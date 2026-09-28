# app/routers/khalti_router.py
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.payment import Payment

from app.services.billing_service import create_pending_payment, activate_subscription
from app.services.khalti_service import (
    initiate_khalti_payment,
    verify_khalti_payment,
    is_khalti_payment_successful,
)

router = APIRouter(prefix="/api/billing/khalti", tags=["khalti"])

PLAN_PRICES = {
    "basic": 499,
    "pro": 1499,
    "enterprise": 4999,
}


@router.post("/initiate")
async def khalti_initiate_route(
    plan: str = Query(...),
    user_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail=f"Invalid plan '{plan}'")

    if not os.getenv("KHALTI_SECRET_KEY"):
        raise HTTPException(
            status_code=500,
            detail="KHALTI_SECRET_KEY is not configured. Please set it in the backend environment.",
        )

    amount_npr = PLAN_PRICES[plan]
    try:
        payment = await initiate_khalti_payment(amount_npr, plan, user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    await create_pending_payment(
        db=db,
        user_id=UUID(user_id),
        provider="khalti",
        plan=plan,
        amount=float(amount_npr),
        ref_id=payment["pidx"],
    )

    return payment


@router.get("/return")
async def khalti_return_route(request: Request, db: AsyncSession = Depends(get_db)):
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    pidx = request.query_params.get("pidx") or request.query_params.get("payment_id")
    if not pidx:
        return RedirectResponse(
            f"{FRONTEND_URL}/billing?payment=failed&reason=missing_pidx",
            status_code=302,
        )

    payment_result = await db.execute(
        select(Payment).where(
            Payment.ref_id == pidx,
            Payment.status == "pending",
        )
    )
    payment = payment_result.scalar_one_or_none()

    if not payment:
        result2 = await db.execute(select(Payment).where(Payment.ref_id == pidx))
        existing = result2.scalar_one_or_none()
        if existing and existing.status == "success":
            return RedirectResponse(
                f"{FRONTEND_URL}/billing?payment=success&plan={existing.plan}",
                status_code=302,
            )
        return RedirectResponse(
            f"{FRONTEND_URL}/billing?payment=failed&reason=payment_not_found",
            status_code=302,
        )

    try:
        verification = await verify_khalti_payment(pidx)
        if not is_khalti_payment_successful(verification):
            payment.status = "failed"
            await db.commit()
            return RedirectResponse(
                f"{FRONTEND_URL}/billing?payment=failed&reason=payment_not_completed",
                status_code=302,
            )

        await activate_subscription(
            db=db,
            user_id=payment.user_id,
            plan=payment.plan,
            provider="khalti",
            transaction_id=pidx,
            amount=float(payment.amount),
        )
    except Exception as exc:
        return RedirectResponse(
            f"{FRONTEND_URL}/billing?payment=failed&reason={str(exc)}",
            status_code=302,
        )

    return RedirectResponse(
        f"{FRONTEND_URL}/billing?payment=success&plan={payment.plan}",
        status_code=302,
    )


@router.post("/verify")
async def khalti_verify_route(payload: dict, db: AsyncSession = Depends(get_db)):
    pidx = payload.get("pidx") or payload.get("transaction_uuid")
    if not pidx:
        return {"verified": False, "detail": "Missing pidx"}

    payment_result = await db.execute(
        select(Payment).where(
            Payment.ref_id == pidx,
            Payment.status == "pending",
        )
    )
    payment = payment_result.scalar_one_or_none()
    if not payment:
        return {"verified": False, "detail": "No pending payment found for this transaction"}

    try:
        verification = await verify_khalti_payment(pidx)
        if not is_khalti_payment_successful(verification):
            return {"verified": False, "detail": "Khalti payment is not completed"}

        await activate_subscription(
            db=db,
            user_id=payment.user_id,
            plan=payment.plan,
            provider="khalti",
            transaction_id=pidx,
            amount=float(payment.amount),
        )
    except Exception as exc:
        return {"verified": False, "detail": str(exc)}

    return {"verified": True, "detail": "Khalti payment verified"}