# app/routers/esewa_router.py
from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.controllers.esewa_controller import (
    initiate_payment,
    initiate_wallet_topup,
    handle_success,
    handle_failure,
    handle_debug,
)

router = APIRouter(prefix="/api/billing/esewa", tags=["esewa"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/initiate")
async def initiate_esewa(
    plan: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await initiate_payment(plan, user_id, db)


@router.post("/topup/initiate")
async def initiate_esewa_topup(
    amount_npr: float,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await initiate_wallet_topup(amount_npr, user_id, db)


@router.get("/success")
async def esewa_success(request: Request, db: AsyncSession = Depends(get_db)):
    return await handle_success(dict(request.query_params), db)


@router.get("/failure")
async def esewa_failure(request: Request, db: AsyncSession = Depends(get_db)):
    return await handle_failure(dict(request.query_params), db)


@router.get("/debug")
async def esewa_debug(request: Request):
    return await handle_debug(dict(request.query_params))