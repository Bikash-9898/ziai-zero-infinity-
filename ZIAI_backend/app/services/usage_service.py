from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, text
from datetime import datetime, date, timedelta
from decimal import Decimal
from uuid import UUID
import uuid
 
from app.models.usage_model import Usage, AiRequest, PlanLimit
from app.models.user import User
from app.schemas.usage_schemas import LogAiRequestSchema

# async def check_and_increment_usage(db: AsyncSession, user_id: str, tokens: int, model: str) -> bool:
#     """Returns False if user exceeded plan limit"""
#     today = date.today()

#     # Get user plan
#     result = await db.execute(
#         "SELECT plan FROM users WHERE id = :uid", {"uid": user_id}
#     )
#     plan = result.scalar()

#     # Get plan limits
#     limits = await db.execute(
#         "SELECT tokens_per_month, requests_per_month FROM plan_limits WHERE plan = :plan",
#         {"plan": plan}
#     )
#     limit = limits.fetchone()
#     if not limit:
#         return False

#     tokens_limit, req_limit = limit

#     # Get current usage
#     usage = await db.execute(
#         """SELECT tokens_used, request_count FROM usage
#            WHERE user_id = :uid AND period_start <= :today AND period_end >= :today
#            ORDER BY created_at DESC LIMIT 1""",
#         {"uid": user_id, "today": today}
#     )
#     row = usage.fetchone()

#     if row:
#         if tokens_limit != -1 and (row.tokens_used + tokens) > tokens_limit:
#             return False
#         if req_limit != -1 and row.request_count >= req_limit:
#             return False

#     # Increment usage
#     await db.execute(
#         """UPDATE usage SET tokens_used = tokens_used + :tokens, request_count = request_count + 1
#            WHERE user_id = :uid AND period_start <= :today AND period_end >= :today""",
#         {"tokens": tokens, "uid": user_id, "today": today}
#     )
#     await db.commit()
#     return True

async def get_current_usage(db: AsyncSession, user_id: UUID) -> Usage | None:
    today = date.today()
    result = await db.execute(
        select(Usage)
        .where(Usage.user_id == user_id, Usage.period_start <= today, Usage.period_end >= today)
        .order_by(Usage.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
 
 
async def get_plan_limits(db: AsyncSession, plan: str) -> PlanLimit | None:
    result = await db.execute(select(PlanLimit).where(PlanLimit.plan == plan))
    return result.scalar_one_or_none()
 
 
async def ensure_usage_row(db: AsyncSession, user_id: UUID) -> Usage:
    """Get or create a usage row for the current billing period."""
    usage = await get_current_usage(db, user_id)
    if usage:
        return usage
 
    today = date.today()
    period_end = today + timedelta(days=30)
    new_usage = Usage(
        id=uuid.uuid4(),
        user_id=user_id,
        tokens_used=0,
        request_count=0,
        period_start=today,
        period_end=period_end,
    )
    db.add(new_usage)
    await db.flush()
    return new_usage
 
 
async def check_and_increment_usage(
    db: AsyncSession,
    user_id: UUID,
    tokens: int,
    model: str,
) -> bool:
    """
    Returns True if the request is allowed and usage was incremented.
    Returns False if the user has exceeded their plan limit.
    """
    # Get user plan
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        return False
 
    limits = await get_plan_limits(db, user.plan)
    if not limits:
        return False
 
    usage = await ensure_usage_row(db, user_id)
 
    # Check token limit (-1 = unlimited)
    if limits.tokens_per_month != -1:
        if (usage.tokens_used + tokens) > limits.tokens_per_month:
            return False
 
    # Check request limit
    if limits.requests_per_month != -1:
        if usage.request_count >= limits.requests_per_month:
            return False
 
    # Increment counters
    await db.execute(
        text("""
            UPDATE usage
            SET tokens_used = tokens_used + :tokens,
                request_count = request_count + 1
            WHERE id = :usage_id
        """),
        {"tokens": tokens, "usage_id": str(usage.id)},
    )
    await db.commit()
    return True
 
 
async def log_request(db: AsyncSession, payload: LogAiRequestSchema) -> AiRequest:
    """Insert an ai_request record after a completed request."""
    record = AiRequest(
        id=uuid.uuid4(),
        user_id=payload.user_id,
        model=payload.model,
        tokens_input=payload.tokens_input,
        tokens_output=payload.tokens_output,
        cost=payload.cost,
        latency_ms=payload.latency_ms,
        status=payload.status,
    )
    db.add(record)
 
    # Also update usage counters
    total_tokens = payload.tokens_input + payload.tokens_output
    today = date.today()
    await db.execute(
        text("""
            UPDATE usage
            SET tokens_used = tokens_used + :tokens,
                request_count = request_count + 1
            WHERE user_id = :uid
              AND period_start <= :today
              AND period_end >= :today
        """),
        {"tokens": total_tokens, "uid": str(payload.user_id), "today": today},
    )
 
    await db.commit()
    await db.refresh(record)
    return record
 
 
async def reset_usage_for_period(db: AsyncSession, user_id: UUID, period_start: date, period_end: date):
    """Create a fresh usage row for a new billing period (called after payment)."""
    new_usage = Usage(
        id=uuid.uuid4(),
        user_id=user_id,
        tokens_used=0,
        request_count=0,
        period_start=period_start,
        period_end=period_end,
    )
    db.add(new_usage)
    await db.commit()
    return new_usage
 