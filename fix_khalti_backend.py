from pathlib import Path

khalti_service = '''import httpx
import os
import uuid

KHALTI_SECRET = os.getenv("KHALTI_SECRET_KEY")
KHALTI_BASE_URL = os.getenv("KHALTI_BASE_URL", "https://a.khalti.com/api/v2")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

HEADERS = {
    "Content-Type": "application/json",
}


def _ensure_khalti_secret() -> None:
    if not KHALTI_SECRET:
        raise RuntimeError("KHALTI_SECRET_KEY is not configured. Please set it in the backend environment.")


def is_khalti_payment_successful(data: dict) -> bool:
    status = str(data.get("status", "") or "").lower()
    state = str(data.get("state", "") or "").lower()
    if status in {"completed", "success", "successful"}:
        return True
    if state in {"completed", "success", "successful"}:
        return True
    return False


async def initiate_khalti_payment(amount_npr: float, plan: str, user_id: str) -> dict:
    _ensure_khalti_secret()

    purchase_order_id = str(uuid.uuid4())
    payload = {
        "return_url": f"{BASE_URL}/api/billing/khalti/return",
        "website_url": FRONTEND_URL,
        "amount": int(amount_npr * 100),
        "purchase_order_id": purchase_order_id,
        "purchase_order_name": f"{plan.title()} Plan",
        "customer_info": {"name": user_id},
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{KHALTI_BASE_URL}/epayment/initiate/",
            json=payload,
            headers={**HEADERS, "Authorization": f"Key {KHALTI_SECRET}"},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "payment_url": data["payment_url"],
            "pidx": data["pidx"],
            "order_id": purchase_order_id,
        }


async def verify_khalti_payment(pidx: str) -> dict:
    _ensure_khalti_secret()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{KHALTI_BASE_URL}/epayment/lookup/",
            json={"pidx": pidx},
            headers={**HEADERS, "Authorization": f"Key {KHALTI_SECRET}"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()
'''

billing_router = '''# app/routers/billing_router.py
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.payment import Payment
from app.schemas.billing import PaymentRecord, SubscriptionResponse, PlanInfo
from app.controllers.billing_controller import (
    get_subscription,
    get_payment_history,
    cancel_subscription,
    switch_to_free,
    get_all_plans,
    get_billing_status,
)
from app.services.billing_service import create_pending_payment, activate_subscription
from app.services.khalti_service import (
    initiate_khalti_payment,
    verify_khalti_payment,
    is_khalti_payment_successful,
)

router = APIRouter(prefix="/api/billing", tags=["billing"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/subscription/{user_id}", response_model=SubscriptionResponse)
async def subscription_route(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_subscription(user_id, db)


@router.get("/payments/{user_id}", response_model=list[PaymentRecord])
async def payment_history_route(
    user_id: UUID,
    limit:   int = Query(20, ge=1, le=100),
    offset:  int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await get_payment_history(user_id, limit, offset, db)


@router.post("/cancel/{user_id}")
async def cancel_subscription_route(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await cancel_subscription(user_id, db)


@router.post("/switch-free/{user_id}")
async def switch_to_free_route(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await switch_to_free(user_id, db)


@router.get("/plans", response_model=list[PlanInfo])
async def plans_route(db: AsyncSession = Depends(get_db)):
    return await get_all_plans(db)


@router.get("/status/{user_id}")
async def billing_status_route(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_billing_status(user_id, db)


PLAN_PRICES = {
    "basic": 299,
    "pro": 999,
    "enterprise": 2999,
}


@router.post("/khalti/initiate")
async def khalti_initiate_route(
    plan: str = Query(...),
    user_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail=f"Invalid plan '{plan}'")

    amount_npr = PLAN_PRICES[plan]
    payment = await initiate_khalti_payment(amount_npr, plan, user_id)

    await create_pending_payment(
        db=db,
        user_id=UUID(user_id),
        provider="khalti",
        plan=plan,
        amount=float(amount_npr),
        ref_id=payment["pidx"],
    )

    return payment


@router.get("/khalti/return")
async def khalti_return_route(request: Request, db: AsyncSession = Depends(get_db)):
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
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


@router.post("/khalti/verify")
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
'''

Path('app/services/khalti_service.py').write_text(khalti_service, encoding='utf-8')
Path('app/routers/billing_router.py').write_text(billing_router, encoding='utf-8')
print('Updated khalti_service.py and billing_router.py')
