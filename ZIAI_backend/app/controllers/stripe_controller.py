import logging
import os
from urllib.parse import quote
from uuid import UUID

from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.payment import Payment
from app.services.billing_service import create_pending_payment, activate_subscription
from app.services.stripe_service import (
    create_checkout_session,
    retrieve_checkout_session,
    is_stripe_payment_successful,
    get_payment_intent_id,
)

log = logging.getLogger(__name__)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# NOTE: these are treated as amounts in your currency's major unit (e.g. dollars).
# Double check these against what you actually intend to charge —
# 299 here means $299.00, not $2.99. Adjust if that's not what you want.
PLAN_PRICES = {
    "basic": 299,
    "pro": 999,
    "enterprise": 2999,
}


async def initiate_payment(plan: str, user_id: str, db: AsyncSession) -> dict:
    if plan not in PLAN_PRICES:
        raise ValueError(f"Invalid plan '{plan}'")

    amount = PLAN_PRICES[plan]
    payload = await create_checkout_session(amount, plan, user_id)

    await create_pending_payment(
        db=db,
        user_id=UUID(user_id),
        provider="stripe",
        plan=plan,
        amount=float(amount),
        ref_id=payload["session_id"],
    )

    return payload


async def handle_success(session_id: str, db: AsyncSession) -> RedirectResponse:
    if not session_id:
        return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=missing_session", 302)

    payment_result = await db.execute(
        select(Payment).where(Payment.ref_id == session_id, Payment.status == "pending")
    )
    payment = payment_result.scalar_one_or_none()

    if not payment:
        result2 = await db.execute(select(Payment).where(Payment.ref_id == session_id))
        existing = result2.scalar_one_or_none()
        if existing and existing.status == "success":
            return RedirectResponse(f"{FRONTEND_URL}/billing?payment=success&plan={existing.plan}", 302)
        return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=payment_not_found", 302)

    try:
        session = await retrieve_checkout_session(session_id)
        if not is_stripe_payment_successful(session):
            payment.status = "failed"
            await db.commit()
            return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=payment_not_completed", 302)

        await activate_subscription(
            db=db,
            user_id=payment.user_id,
            plan=payment.plan,
            provider="stripe",
            transaction_id=get_payment_intent_id(session),
            amount=float(payment.amount),
        )
    except Exception as exc:
        log.error("Stripe success handling error: %s", exc)
        return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=processing_error", 302)

    return RedirectResponse(f"{FRONTEND_URL}/billing?payment=success&plan={payment.plan}", 302)


async def verify_payment(session_id: str, db: AsyncSession) -> dict:
    if not session_id:
        return {"verified": False, "detail": "Missing session_id"}

    payment_result = await db.execute(
        select(Payment).where(Payment.ref_id == session_id, Payment.status == "pending")
    )
    payment = payment_result.scalar_one_or_none()
    if not payment:
        return {"verified": False, "detail": "No pending payment found for this session"}

    try:
        session = await retrieve_checkout_session(session_id)
        if not is_stripe_payment_successful(session):
            return {"verified": False, "detail": "Stripe payment is not completed"}

        await activate_subscription(
            db=db,
            user_id=payment.user_id,
            plan=payment.plan,
            provider="stripe",
            transaction_id=get_payment_intent_id(session),
            amount=float(payment.amount),
        )
    except Exception as exc:
        log.error("Stripe verify error: %s", exc)
        return {"verified": False, "detail": str(exc)}

    return {"verified": True, "detail": "Stripe payment verified"}