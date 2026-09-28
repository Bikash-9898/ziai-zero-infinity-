# app/services/billing_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timedelta
from uuid import UUID
import uuid

from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.services.usage_service import reset_usage_for_period


# ── Pending payment creation ──────────────────────────────────────────────────

async def create_pending_payment(
    db: AsyncSession,
    user_id: UUID,
    provider: str,
    plan: str,
    amount: float,
    ref_id: str,
) -> Payment:
    payment = Payment(
        id=uuid.uuid4(),
        user_id=user_id,
        provider=provider,
        plan=plan,
        amount=amount,
        status="pending",
        ref_id=ref_id,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


# ── Subscription activation ───────────────────────────────────────────────────

async def activate_subscription(
    db: AsyncSession,
    user_id: UUID,
    plan: str,
    provider: str,
    transaction_id: str,
    amount: float,
) -> Subscription:
    """
    Called after payment verification succeeds.
    All steps run before a single commit — atomic.

    Steps:
      1. Load and update the pending payment row via ORM (reliable rowcount)
      2. Upsert subscription
      3. Update user.plan
      4. Reset usage for new billing period
    """
    now        = datetime.utcnow()
    period_end = now + timedelta(days=30)

    # 1. Load the pending payment by ref_id using ORM
    # Using ORM select instead of raw text() so we get a real object
    # and can check if it exists before updating.
    result = await db.execute(
        select(Payment).where(
            Payment.ref_id == transaction_id,
            Payment.user_id == user_id,
            Payment.status == "pending",
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise ValueError(
            f"No pending payment found for ref_id={transaction_id} "
            f"user_id={user_id}. Cannot activate subscription."
        )

    # Update payment fields directly on the ORM object
    payment.status         = "success"
    payment.transaction_id = transaction_id
    payment.verified_at    = now

    # 2. Upsert subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    sub = sub_result.scalar_one_or_none()

    if sub:
        sub.plan                 = plan
        sub.status               = "active"
        sub.current_period_start = now
        sub.current_period_end   = period_end
    else:
        sub = Subscription(
            id=uuid.uuid4(),
            user_id=user_id,
            plan=plan,
            status="active",
            current_period_start=now,
            current_period_end=period_end,
        )
        db.add(sub)

    # 3. Update user.plan via ORM
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    if user:
        user.plan = plan

    # 4. Reset usage for the new billing period
    await reset_usage_for_period(db, user_id, now.date(), period_end.date())

    # Single commit — all or nothing
    await db.commit()
    await db.refresh(sub)
    return sub


# ── Cancel subscription ───────────────────────────────────────────────────────

async def cancel_subscription(
    db: AsyncSession,
    user_id: UUID,
) -> Subscription:
    """
    Mark subscription as canceled — access continues until period_end.
    Does NOT downgrade the user plan immediately.
    """
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status  == "active",
        )
    )
    sub = result.scalar_one_or_none()

    if not sub:
        raise ValueError(f"No active subscription found for user_id={user_id}")

    sub.status = "canceled"
    await db.commit()
    await db.refresh(sub)
    return sub


# ── Expire overdue subscriptions (cron helper) ────────────────────────────────

async def expire_overdue_subscriptions(db: AsyncSession) -> int:
    """
    Find subscriptions past period_end and downgrade to free.
    Call from a scheduler — not on every request.
    Returns count of subscriptions expired.
    """
    now = datetime.utcnow()

    result = await db.execute(
        select(Subscription).where(
            Subscription.status == "active",
            Subscription.current_period_end < now,
        )
    )
    expired = result.scalars().all()

    for sub in expired:
        sub.status = "expired"
        user_result = await db.execute(
            select(User).where(User.id == sub.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.plan = "free"

    await db.commit()
    return len(expired)
