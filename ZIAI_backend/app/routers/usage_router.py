# app/routers/usage_router.py
from fastapi import APIRouter, Depends, Query
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.usage_schemas import (
    UsageResponse,
    UsageHistoryResponse,
    UsageSummaryResponse,
    LogAiRequestSchema,
)
from app.controllers.usage_controller import (
    get_usage,
    get_usage_history,
    get_usage_summary,
    log_ai_request,
)

router = APIRouter(prefix="/api/usage", tags=["usage"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/{user_id}", response_model=UsageResponse)
async def usage_route(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_usage(user_id, db)


@router.get("/{user_id}/history", response_model=UsageHistoryResponse)
async def usage_history_route(
    user_id:   UUID,
    page:      int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await get_usage_history(user_id, page, page_size, db)


@router.get("/{user_id}/summary", response_model=UsageSummaryResponse)
async def usage_summary_route(
    user_id: UUID,
    days:    int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    return await get_usage_summary(user_id, days, db)


@router.post("/log")
async def log_request_route(
    payload: LogAiRequestSchema,
    db: AsyncSession = Depends(get_db),
):
    return await log_ai_request(payload, db)
