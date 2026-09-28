# app/controllers/usage_controller.py
"""
Handles usage tracking operations:
- Get current period usage vs plan limits
- Get paginated usage history
- Get aggregated usage summary
- Log a completed AI request
"""

from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
# note: func is still used for count() in get_usage_history

from app.models.usage_model import Usage, AiRequest, PlanLimit
from app.models.user import User
from app.schemas.usage_schemas import (
    UsageResponse,
    AiRequestResponse,
    UsageHistoryResponse,
    UsageSummaryResponse,
    LogAiRequestSchema,
)


# ── Current Period Usage ──────────────────────────────────────────────────────

async def get_usage(user_id, db: AsyncSession) -> UsageResponse:
    """
    Return current period usage vs plan limits for a user.
    Called by: GET /api/usage/{user_id}
    """
    today = date.today()

    user_result = await db.execute(select(User).where(User.id == user_id))
    user        = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    limit_result = await db.execute(select(PlanLimit).where(PlanLimit.plan == user.plan))
    limits       = limit_result.scalar_one_or_none()
    if not limits:
        raise HTTPException(status_code=500, detail=f"Plan limits not configured for: {user.plan}")

    usage_result = await db.execute(
        select(Usage)
        .where(
            Usage.user_id      == user_id,
            Usage.period_start <= today,
            Usage.period_end   >= today,
        )
        .order_by(desc(Usage.created_at))
        .limit(1)
    )
    usage = usage_result.scalar_one_or_none()

    tokens_used   = usage.tokens_used   if usage else 0
    requests_used = usage.request_count if usage else 0
    period_start  = usage.period_start  if usage else today
    period_end    = usage.period_end    if usage else today + timedelta(days=30)

    # Image usage — raw SQL since image_generations has no SQLAlchemy ORM model
    # FIX: was using status='completed' but save_generation() writes status='success'
    try:
        img_result = await db.execute(
            text("""
                SELECT COUNT(*)
                FROM image_generations
                WHERE user_id = :uid
                  AND status = 'success'
                  AND created_at >= :period_start
            """),
            {
                "uid":          str(user_id),
                "period_start": datetime.combine(period_start, datetime.min.time()),
            },
        )
        images_used = img_result.scalar() or 0
    except Exception:
        images_used = 0

    def pct(used: int, limit: int):
        if limit == -1:
            return None
        return round((used / limit) * 100, 1) if limit > 0 else 0.0

    return UsageResponse(
        user_id=user_id,
        plan=user.plan,
        tokens_used=tokens_used,
        tokens_limit=limits.tokens_per_month,
        requests_used=requests_used,
        requests_limit=limits.requests_per_month,
        images_used=images_used,
        images_limit=limits.image_generations_per_month,
        period_start=period_start,
        period_end=period_end,
        percent_tokens_used=pct(tokens_used, limits.tokens_per_month),
        percent_requests_used=pct(requests_used, limits.requests_per_month),
    )


# ── Usage History ─────────────────────────────────────────────────────────────

async def get_usage_history(
    user_id,
    page: int,
    page_size: int,
    db: AsyncSession,
) -> UsageHistoryResponse:
    """
    Return paginated AI request history for a user.
    Called by: GET /api/usage/{user_id}/history
    """
    offset = (page - 1) * page_size

    count_result = await db.execute(
        select(func.count()).select_from(AiRequest).where(AiRequest.user_id == user_id)
    )
    total = count_result.scalar()

    result = await db.execute(
        select(AiRequest)
        .where(AiRequest.user_id == user_id)
        .order_by(desc(AiRequest.created_at))
        .limit(page_size)
        .offset(offset)
    )
    requests = result.scalars().all()

    return UsageHistoryResponse(
        requests=[
            AiRequestResponse(
                id=r.id,
                user_id=r.user_id,
                model=r.model,
                tokens_input=r.tokens_input,
                tokens_output=r.tokens_output,
                total_tokens=r.total_tokens,
                cost=r.cost,
                latency_ms=r.latency_ms,
                status=r.status,
                created_at=r.created_at,
            )
            for r in requests
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


# ── Usage Summary ─────────────────────────────────────────────────────────────

async def get_usage_summary(user_id, days: int, db: AsyncSession) -> UsageSummaryResponse:
    """
    Return aggregated usage: daily tokens, top models, total cost, avg latency.
    Called by: GET /api/usage/{user_id}/summary
    """
    since = datetime.utcnow() - timedelta(days=days)

    daily_result = await db.execute(
        text("""
            SELECT DATE(created_at)                        AS day,
                   SUM(tokens_input + tokens_output)       AS tokens,
                   COUNT(*)                                AS requests
              FROM ai_requests
             WHERE user_id = :uid AND created_at >= :since
             GROUP BY DATE(created_at)
             ORDER BY day ASC
        """),
        {"uid": str(user_id), "since": since},
    )
    daily_tokens = [
        {"date": str(row.day), "tokens": int(row.tokens or 0), "requests": int(row.requests)}
        for row in daily_result.fetchall()
    ]

    models_result = await db.execute(
        text("""
            SELECT model, COUNT(*) AS count, SUM(tokens_input + tokens_output) AS tokens
              FROM ai_requests
             WHERE user_id = :uid AND created_at >= :since
             GROUP BY model ORDER BY count DESC LIMIT 5
        """),
        {"uid": str(user_id), "since": since},
    )
    top_models = [
        {"model": row.model, "count": int(row.count), "tokens": int(row.tokens or 0)}
        for row in models_result.fetchall()
    ]

    agg_result = await db.execute(
        text("""
            SELECT COALESCE(SUM(cost), 0) AS total_cost, AVG(latency_ms) AS avg_latency
              FROM ai_requests
             WHERE user_id = :uid AND created_at >= :since
        """),
        {"uid": str(user_id), "since": since},
    )
    agg = agg_result.fetchone()

    return UsageSummaryResponse(
        daily_tokens=daily_tokens,
        top_models=top_models,
        total_cost=agg.total_cost,
        avg_latency_ms=float(agg.avg_latency) if agg.avg_latency else None,
    )


# ── Log AI Request ────────────────────────────────────────────────────────────

async def log_ai_request(payload: LogAiRequestSchema, db: AsyncSession) -> dict:
    """
    Log a completed AI request and update usage counters.
    Called by: POST /api/usage/log
    """
    from app.services.usage_service import log_request
    await log_request(db, payload)
    return {"message": "Request logged"}