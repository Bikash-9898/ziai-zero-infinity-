# app/controllers/admin_controller.py
"""
Handles admin dashboard operations:
- Platform stats (tokens, users, requests, latencies)
- Billing stats (revenue, subscriptions, plan distribution, recent payments)
"""

from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, text

from app.models.user import User
from app.models.usage_model import AiRequest
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.services import settings_service


# ── Platform Stats ────────────────────────────────────────────────────────────

async def get_admin_stats(db: AsyncSession) -> dict:
    """
    Return platform-wide stats for the admin dashboard.
    Called by: GET /api/admin/stats
    """
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    last_24h        = datetime.utcnow() - timedelta(hours=24)

    total_tokens = (await db.execute(
        select(func.sum(
            func.coalesce(AiRequest.tokens_input,  0) +
            func.coalesce(AiRequest.tokens_output, 0)
        ))
    )).scalar() or 0

    new_users = (await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= thirty_days_ago)
    )).scalar() or 0

    active_reqs = (await db.execute(
        select(func.count()).select_from(AiRequest).where(AiRequest.created_at >= last_24h)
    )).scalar() or 0

    latency_rows = (await db.execute(
        select(AiRequest.model, func.avg(AiRequest.latency_ms)).group_by(AiRequest.model)
    )).all()

    model_latencies = [
        {"model": model, "avg_latency": round(float(avg), 1)}
        for model, avg in latency_rows
        if avg is not None
    ]

    return {
        "active_requests": active_reqs,
        "total_tokens":    total_tokens,
        "new_users":       new_users,
        "quota_used":      total_tokens,
        "quota_max":       10_000_000,
        "model_latencies": model_latencies,
    }


# ── Billing Stats ─────────────────────────────────────────────────────────────

async def get_admin_billing_stats(db: AsyncSession) -> dict:
    """
    Return billing stats: revenue, active subscriptions, plan distribution, recent payments.
    Called by: GET /api/admin/billing/stats
    """
    total_revenue = (await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == "success")
    )).scalar() or 0

    active_subscriptions = (await db.execute(
        select(func.count(Subscription.id)).where(Subscription.status == "active")
    )).scalar() or 0

    plan_rows = (await db.execute(
        select(User.plan, func.count(User.id)).group_by(User.plan)
    )).fetchall()

    plan_distribution = {row[0]: int(row[1]) for row in plan_rows}
    for plan in ("free", "basic", "pro", "enterprise"):
        plan_distribution.setdefault(plan, 0)

    recent_payments = (await db.execute(
        select(Payment).order_by(Payment.created_at.desc()).limit(20)
    )).scalars().all()

    return {
        "total_revenue":        float(total_revenue),
        "active_subscriptions": int(active_subscriptions),
        "plan_distribution":    plan_distribution,
        "recent_payments": [
            {
                "id":             str(p.id),
                "user_id":        str(p.user_id),
                "provider":       p.provider,
                "plan":           p.plan,
                "amount":         float(p.amount),
                "currency":       p.currency,
                "status":         p.status,
                "transaction_id": p.transaction_id,
                "verified_at":    p.verified_at.isoformat() if p.verified_at else None,
                "created_at":     p.created_at.isoformat(),
            }
            for p in recent_payments
        ],
    }


# ── Per-User Usage (drives the Users tab token/cost columns) ─────────────────

async def get_admin_users_with_usage(db: AsyncSession) -> list[dict]:
    """
    Return every user with their aggregate token usage, cost, and wallet
    balance in one call — used by the admin Users tab.
    Called by: GET /api/admin/users
    """
    rows = (await db.execute(
        select(
            User.id,
            User.email,
            User.username,
            User.plan,
            User.is_active,
            User.created_at,
            User.trial_tokens_remaining,
            User.credit_balance,
            func.coalesce(func.sum(
                func.coalesce(AiRequest.tokens_input, 0) + func.coalesce(AiRequest.tokens_output, 0)
            ), 0).label("total_tokens"),
            func.coalesce(func.sum(AiRequest.cost), 0).label("total_cost_usd"),
            func.count(AiRequest.id).label("total_requests"),
        )
        .outerjoin(AiRequest, AiRequest.user_id == User.id)
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )).all()

    return [
        {
            "id":                     str(r.id),
            "email":                  r.email,
            "username":               r.username,
            "plan":                   r.plan,
            "is_active":              r.is_active,
            "created_at":             r.created_at.isoformat(),
            "trial_tokens_remaining": r.trial_tokens_remaining,
            "credit_balance_npr":     float(r.credit_balance),
            "total_tokens":           int(r.total_tokens),
            "total_cost_usd":         float(r.total_cost_usd),
            "total_requests":         int(r.total_requests),
        }
        for r in rows
    ]


# ── Token Usage Analytics (chart data) ────────────────────────────────────────

async def get_token_analytics(db: AsyncSession, days: int = 30) -> dict:
    """
    Platform-wide daily token usage, for the Overview chart.
    Called by: GET /api/admin/analytics/tokens?days=30
    """
    since = datetime.utcnow() - timedelta(days=days)

    rows = (await db.execute(
        text("""
            SELECT DATE(created_at) AS day,
                   SUM(COALESCE(tokens_input, 0) + COALESCE(tokens_output, 0)) AS tokens,
                   COUNT(*) AS requests
              FROM ai_requests
             WHERE created_at >= :since
             GROUP BY DATE(created_at)
             ORDER BY day ASC
        """),
        {"since": since},
    )).fetchall()

    return {
        "daily": [
            {"date": str(r.day), "tokens": int(r.tokens or 0), "requests": int(r.requests)}
            for r in rows
        ]
    }


# ── Profit Analytics (revenue - cost, chart data) ─────────────────────────────

async def get_profit_analytics(db: AsyncSession, days: int = 30) -> dict:
    """
    Daily revenue (successful payments, NPR) vs. daily cost (AI provider
    spend, converted to NPR) vs. profit — for the Billing tab chart.
    Called by: GET /api/admin/analytics/profit?days=30
    """
    since = datetime.utcnow() - timedelta(days=days)

    revenue_rows = (await db.execute(
        text("""
            SELECT DATE(created_at) AS day, COALESCE(SUM(amount), 0) AS revenue_npr
              FROM payments
             WHERE status = 'success' AND created_at >= :since
             GROUP BY DATE(created_at)
        """),
        {"since": since},
    )).fetchall()

    cost_rows = (await db.execute(
        text("""
            SELECT DATE(created_at) AS day, COALESCE(SUM(cost), 0) AS cost_usd
              FROM ai_requests
             WHERE created_at >= :since
             GROUP BY DATE(created_at)
        """),
        {"since": since},
    )).fetchall()

    revenue_by_day = {str(r.day): float(r.revenue_npr) for r in revenue_rows}
    usd_to_npr_rate = float(await settings_service.get_usd_to_npr_rate(db))
    cost_by_day_npr = {str(r.day): float(r.cost_usd) * usd_to_npr_rate for r in cost_rows}

    all_days = sorted(set(revenue_by_day) | set(cost_by_day_npr))
    daily = [
        {
            "date":        day,
            "revenue_npr": round(revenue_by_day.get(day, 0.0), 2),
            "cost_npr":    round(cost_by_day_npr.get(day, 0.0), 2),
            "profit_npr":  round(revenue_by_day.get(day, 0.0) - cost_by_day_npr.get(day, 0.0), 2),
        }
        for day in all_days
    ]

    totals = {
        "total_revenue_npr": round(sum(d["revenue_npr"] for d in daily), 2),
        "total_cost_npr":    round(sum(d["cost_npr"] for d in daily), 2),
        "total_profit_npr":  round(sum(d["profit_npr"] for d in daily), 2),
    }

    return {"daily": daily, **totals}


# ── Guest model restriction settings ──────────────────────────────────────────

async def get_guest_model_settings(db: AsyncSession) -> dict:
    """
    Returns the full list of models the platform supports, plus which ones
    are currently allowed for guests — used to render checkboxes in the
    admin Settings panel.
    Called by: GET /api/admin/settings/guest-models
    """
    from app.services import model_service
    from app.services.settings_service import get_guest_allowed_models

    all_models = await model_service.list_models(db, active_only=True)
    allowed = await get_guest_allowed_models(db)
    return {
        "available_models": [m.id for m in all_models],
        "allowed_models":   allowed,
    }


async def update_guest_model_settings(db: AsyncSession, model_keys: list[str]) -> dict:
    """
    Called by: PUT /api/admin/settings/guest-models
    """
    from app.services import model_service
    from app.services.settings_service import set_guest_allowed_models

    all_models = await model_service.list_models(db, active_only=True)
    valid_ids = {m.id for m in all_models}
    valid_keys = [k for k in model_keys if k in valid_ids]
    if not valid_keys:
        raise ValueError("No valid model keys provided")

    updated = await set_guest_allowed_models(db, valid_keys)
    return {"allowed_models": updated}


# ── AI Model registry CRUD (single source of truth for models) ───────────────

async def list_ai_models(db: AsyncSession) -> list[dict]:
    """All models, including inactive ones — used by the admin Models tab."""
    from app.services import model_service

    models = await model_service.list_models(db, active_only=False)
    return [
        {
            "id":                        m.id,
            "label":                     m.label,
            "provider":                  m.provider,
            "provider_model_id":         m.provider_model_id,
            "input_price_per_million":   float(m.input_price_per_million),
            "output_price_per_million":  float(m.output_price_per_million),
            "is_active":                 m.is_active,
            "sort_order":                m.sort_order,
            "tier":                      m.tier,
            "supports_images":           m.supports_images,
        }
        for m in models
    ]


async def create_ai_model(db: AsyncSession, data: dict) -> dict:
    from app.services import model_service

    row = await model_service.create_model(db, data)
    return {"id": row.id, "created": True}


async def update_ai_model(db: AsyncSession, model_id: str, data: dict) -> dict:
    from app.services import model_service

    row = await model_service.update_model(db, model_id, data)
    return {"id": row.id, "updated": True}


async def delete_ai_model(db: AsyncSession, model_id: str) -> dict:
    from app.services import model_service

    await model_service.delete_model(db, model_id)
    return {"id": model_id, "deleted": True}


# ── Dynamic pricing settings (USD→NPR rate, trial sizes) ─────────────────────

async def get_pricing_settings(db: AsyncSession) -> dict:
    """Called by: GET /api/admin/settings/pricing"""
    from app.services import settings_service
    return await settings_service.get_pricing_settings(db)


async def update_pricing_settings(db: AsyncSession, **kwargs) -> dict:
    """Called by: PUT /api/admin/settings/pricing"""
    from app.services import settings_service
    return await settings_service.update_pricing_settings(db, **kwargs)


# ── Image Model registry CRUD (mirrors AI model registry) ────────────────────

async def list_image_models(db: AsyncSession) -> list[dict]:
    """All image models, including inactive — used by the admin Image Models tab."""
    from app.services import image_model_service

    models = await image_model_service.list_models(db, active_only=False)
    return [
        {
            "id":                 m.id,
            "display_name":       m.display_name,
            "provider":           m.provider,
            "provider_model_id":  m.provider_model_id,
            "credits_per_image":  float(m.credits_per_image),
            "is_active":          m.is_active,
            "sort_order":         m.sort_order,
        }
        for m in models
    ]


async def create_image_model(db: AsyncSession, data: dict) -> dict:
    from app.services import image_model_service

    row = await image_model_service.create_model(db, data)
    return {"id": row.id, "created": True}


async def update_image_model(db: AsyncSession, model_id: str, data: dict) -> dict:
    from app.services import image_model_service

    row = await image_model_service.update_model(db, model_id, data)
    return {"id": row.id, "updated": True}


async def delete_image_model(db: AsyncSession, model_id: str) -> dict:
    from app.services import image_model_service

    await image_model_service.delete_model(db, model_id)
    return {"id": model_id, "deleted": True}


# ── System API Key database CRUD ────────────────────────────────────────────────

async def list_admin_api_keys(db: AsyncSession) -> list[dict]:
    from app.services import api_key_service

    keys = await api_key_service.list_api_keys(db)
    return [
        {
            "id":          k.id,
            "name":        k.name,
            "provider":    k.provider,
            "key_value":   k.key_value,
            "is_active":   k.is_active,
            "description": k.description,
            "created_at":  k.created_at.isoformat() if k.created_at else None,
            "updated_at":  k.updated_at.isoformat() if k.updated_at else None,
        }
        for k in keys
    ]


async def create_admin_api_key(db: AsyncSession, data: dict) -> dict:
    from app.services import api_key_service

    row = await api_key_service.create_api_key(db, data)
    return {"id": row.id, "created": True}


async def update_admin_api_key(db: AsyncSession, key_id: str, data: dict) -> dict:
    from app.services import api_key_service

    row = await api_key_service.update_api_key(db, key_id, data)
    return {"id": row.id, "updated": True}


async def delete_admin_api_key(db: AsyncSession, key_id: str) -> dict:
    from app.services import api_key_service

    await api_key_service.delete_api_key(db, key_id)
    return {"id": key_id, "deleted": True}
