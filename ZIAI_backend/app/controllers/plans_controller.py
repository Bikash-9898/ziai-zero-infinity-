# app/controllers/plans_controller.py
"""
Handles plan operations:
- List all plans
- Get a single plan by name
- Compare plans for a specific user (upgrade/downgrade/current)
"""

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.usage_model import PlanLimit
from app.models.user import User
from app.schemas.billing import PlanInfo

PLAN_ORDER = ["free", "basic", "pro", "enterprise"]


# ── List All Plans ────────────────────────────────────────────────────────────

async def list_plans(db: AsyncSession) -> list[PlanInfo]:
    """
    Return all plans sorted by price ascending.
    Called by: GET /api/plans/
    """
    result = await db.execute(select(PlanLimit).order_by(PlanLimit.price_npr))
    plans  = result.scalars().all()
    return [
        PlanInfo(
            plan=p.plan,
            tokens_per_month=p.tokens_per_month,
            requests_per_month=p.requests_per_month,
            image_generations_per_month=p.image_generations_per_month,
            price_npr=p.price_npr,
            is_unlimited=p.is_unlimited,
        )
        for p in plans
    ]


# ── Get Single Plan ───────────────────────────────────────────────────────────

async def get_plan(plan: str, db: AsyncSession) -> PlanInfo:
    """
    Return details for a single plan by name.
    Called by: GET /api/plans/{plan}
    """
    result = await db.execute(select(PlanLimit).where(PlanLimit.plan == plan))
    p      = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail=f"Plan '{plan}' not found")
    return PlanInfo(
        plan=p.plan,
        tokens_per_month=p.tokens_per_month,
        requests_per_month=p.requests_per_month,
        image_generations_per_month=p.image_generations_per_month,
        price_npr=p.price_npr,
        is_unlimited=p.is_unlimited,
    )


# ── Compare Plans for User ────────────────────────────────────────────────────

async def compare_plans_for_user(user_id, db: AsyncSession) -> list[dict]:
    """
    Return all plans annotated with action = current | upgrade | downgrade,
    relative to the user's current plan.
    Called by: GET /api/plans/compare/{user_id}
    """
    user_result = await db.execute(select(User).where(User.id == user_id))
    user        = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plans_result = await db.execute(select(PlanLimit).order_by(PlanLimit.price_npr))
    plans        = plans_result.scalars().all()

    current_index = PLAN_ORDER.index(user.plan) if user.plan in PLAN_ORDER else 0

    return [
        {
            "plan":                        p.plan,
            "price_npr":                   float(p.price_npr),
            "tokens_per_month":            p.tokens_per_month,
            "requests_per_month":          p.requests_per_month,
            "image_generations_per_month": p.image_generations_per_month,
            "is_unlimited":                p.is_unlimited,
            "is_current":                  p.plan == user.plan,
            "action": (
                "current"  if p.plan == user.plan
                else "upgrade"   if PLAN_ORDER.index(p.plan) > current_index
                else "downgrade"
            ),
        }
        for p in plans
        if p.plan in PLAN_ORDER
    ]
