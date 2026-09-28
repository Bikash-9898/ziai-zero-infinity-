# app/routers/image_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth_jwt import get_current_user
from app.models.user import User
from app.models.image import ImageGenerateRequest
from app.controllers.image_controller import (
    get_image_models,
    create_image,
    get_user_image_history,
    get_credits_used,
)

router = APIRouter(prefix="/api/image", tags=["image"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/models")
async def models_route(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await get_image_models(db)


@router.post("/generate")
async def generate_route(
    req: ImageGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_image(req, db, current_user)


@router.get("/history")
async def history_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_user_image_history(db, current_user)


@router.get("/credits")
async def credits_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_credits_used(db, current_user)
