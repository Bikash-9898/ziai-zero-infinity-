# app/controllers/billing_controller.py
"""
Handles billing operations:
- Get active subscription for a user
- Get payment history
- Cancel subscription
- Switch to free plan
- Get all plans
- Get full billing status
"""

import uuid as _uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, text

from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.models.usage_model import PlanLimit
from app.schemas.billing import PlanInfo


# ── Get Subscription ──────────────────────────────────────────────────────────

async def get_subscription(user_id, db: AsyncSession):
    """
    Return the active subscription for a user.
    Called by: GET /api/billing/subscription/{user_id}
    """
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .order_by(desc(Subscription.created_at))
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")
    return sub


# ── Get Payment History ───────────────────────────────────────────────────────

async def get_payment_history(user_id, limit: int, offset: int, db: AsyncSession):
    """
    Return paginated payment history for a user, most recent first.
    Called by: GET /api/billing/payments/{user_id}
    """
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == user_id)
        .order_by(desc(Payment.created_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


# ── Cancel Subscription ───────────────────────────────────────────────────────

async def cancel_subscription(user_id, db: AsyncSession) -> dict:
    """
    Cancel the active subscription. User keeps access until period_end.
    Called by: POST /api/billing/cancel/{user_id}
    """
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status  == "active",
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")

    sub.status = "canceled"
    await db.commit()

    return {
        "message":    "Subscription canceled. Access continues until period end.",
        "period_end": sub.current_period_end,
    }


# ── Switch to Free ────────────────────────────────────────────────────────────

async def switch_to_free(user_id, db: AsyncSession) -> dict:
    """
    Instantly downgrade a user to the free plan.
    Cancels active subscription, updates user plan, creates audit payment.
    Called by: POST /api/billing/switch-free/{user_id}
    """
    user_result = await db.execute(select(User).where(User.id == user_id))
    user        = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.plan == "free":
        return {"message": "Already on free plan", "plan": "free"}

    # Cancel active subscription if exists
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status  == "active",
        )
    )
    sub = sub_result.scalar_one_or_none()
    if sub:
        sub.status = "canceled"

    # Downgrade plan
    await db.execute(
        text("UPDATE users SET plan = 'free' WHERE id = :uid"),
        {"uid": str(user_id)},
    )

    # Audit record
    db.add(Payment(
        id=_uuid.uuid4(),
        user_id=user_id,
        provider="internal",
        plan="free",
        amount=0.00,
        currency="NPR",
        status="success",
        transaction_id=f"free-switch-{_uuid.uuid4().hex[:8]}",
        verified_at=datetime.utcnow(),
    ))

    await db.commit()
    return {
        "message":       "Successfully switched to free plan",
        "plan":          "free",
        "previous_plan": user.plan,
    }


# ── Get All Plans ─────────────────────────────────────────────────────────────

async def get_all_plans(db: AsyncSession) -> list[PlanInfo]:
    """
    Return all available plans sorted by price.
    Called by: GET /api/billing/plans  and  GET /api/plans/
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


# ── Get Billing Status ────────────────────────────────────────────────────────

async def get_billing_status(user_id, db: AsyncSession) -> dict:
    """
    Full billing status: current plan, subscription state, latest payment.
    Called by: GET /api/billing/status/{user_id}
    """
    user_result = await db.execute(select(User).where(User.id == user_id))
    user        = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Try active subscription first, then most recent canceled
    sub_result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id, Subscription.status == "active")
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()

    if not sub:
        canceled_result = await db.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id, Subscription.status == "canceled")
            .order_by(desc(Subscription.current_period_end))
            .limit(1)
        )
        sub = canceled_result.scalar_one_or_none()

    # Last successful payment
    pay_result = await db.execute(
        select(Payment)
        .where(Payment.user_id == user_id, Payment.status == "success")
        .order_by(desc(Payment.created_at))
        .limit(1)
    )
    last_payment = pay_result.scalar_one_or_none()

    return {
        "user_id":      str(user_id),
        "current_plan": user.plan,
        "is_active":    user.is_active,
        "subscription": {
            "status":       sub.status               if sub else None,
            "period_start": sub.current_period_start if sub else None,
            "period_end":   sub.current_period_end   if sub else None,
        },
        "last_payment": {
            "provider": last_payment.provider    if last_payment else None,
            "amount":   str(last_payment.amount) if last_payment else None,
            "date":     last_payment.created_at  if last_payment else None,
        },
    }
