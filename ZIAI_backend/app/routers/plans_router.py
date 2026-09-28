# app/routers/plans_router.py
from fastapi import APIRouter, Depends
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.billing import PlanInfo
from app.controllers.plans_controller import (
    list_plans,
    get_plan,
    compare_plans_for_user,
)

router = APIRouter(prefix="/api/plans", tags=["plans"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[PlanInfo])
async def list_plans_route(db: AsyncSession = Depends(get_db)):
    return await list_plans(db)


@router.get("/compare/{user_id}")
async def compare_plans_route(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await compare_plans_for_user(user_id, db)


# NOTE: this must come AFTER /compare/{user_id} to avoid
# FastAPI matching "compare" as the plan name
@router.get("/{plan}", response_model=PlanInfo)
async def get_plan_route(plan: str, db: AsyncSession = Depends(get_db)):
    return await get_plan(plan, db)
