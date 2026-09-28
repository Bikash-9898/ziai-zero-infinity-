from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.controllers.stripe_controller import (
    initiate_payment,
    handle_success,
    verify_payment,
)
from app.schemas.billing import StripeVerifyRequest

router = APIRouter(prefix="/api/billing/stripe", tags=["stripe"])


@router.post("/initiate")
async def stripe_initiate(
    plan: str = Query(...),
    user_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return await initiate_payment(plan, user_id, db)


@router.get("/success")
async def stripe_success(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await handle_success(session_id, db)


@router.post("/verify")
async def stripe_verify(
    request: StripeVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    return await verify_payment(request.session_id, db)