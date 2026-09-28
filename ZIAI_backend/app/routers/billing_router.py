# app/routers/billing_router.py
from fastapi import APIRouter, Depends, Query, HTTPException
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.billing import PaymentRecord, SubscriptionResponse, PlanInfo
from app.controllers.billing_controller import (
    get_subscription,
    get_payment_history,
    cancel_subscription,
    switch_to_free,
    get_all_plans,
    get_billing_status,
)
from app.services.wallet_service import get_wallet_status

router = APIRouter(prefix="/api/billing", tags=["billing"])


@router.get("/wallet/{user_id}")
async def wallet_status_route(user_id: UUID, db: AsyncSession = Depends(get_db)):
    status = await get_wallet_status(db, user_id)
    if status is None:
        raise HTTPException(status_code=404, detail="User not found")
    return status


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
