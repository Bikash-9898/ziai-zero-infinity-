# app/routers/admin_router.py
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.Dependencies import require_admin
from app.controllers.admin_controller import (
    get_admin_stats,
    get_admin_billing_stats,
    get_admin_users_with_usage,
    get_token_analytics,
    get_profit_analytics,
    get_guest_model_settings,
    update_guest_model_settings,
    list_ai_models,
    create_ai_model,
    update_ai_model,
    delete_ai_model,
    get_pricing_settings,
    update_pricing_settings,
    list_image_models,
    create_image_model,
    update_image_model,
    delete_image_model,
    list_admin_api_keys,
    create_admin_api_key,
    update_admin_api_key,
    delete_admin_api_key,
)
from app.services.wallet_service import add_credits

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/stats", dependencies=[Depends(require_admin)])
async def admin_stats_route(db: AsyncSession = Depends(get_db)):
    return await get_admin_stats(db)


@router.get("/billing/stats", dependencies=[Depends(require_admin)])
async def admin_billing_stats_route(db: AsyncSession = Depends(get_db)):
    return await get_admin_billing_stats(db)


@router.get("/user", dependencies=[Depends(require_admin)])
async def admin_users_route(db: AsyncSession = Depends(get_db)):
    """Users list enriched with per-user token usage, cost, and wallet balance."""
    return await get_admin_users_with_usage(db)


@router.get("/analytics/tokens", dependencies=[Depends(require_admin)])
async def admin_token_analytics_route(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    return await get_token_analytics(db, days)


@router.get("/analytics/profit", dependencies=[Depends(require_admin)])
async def admin_profit_analytics_route(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    return await get_profit_analytics(db, days)


@router.post("/users/{user_id}/wallet/adjust", dependencies=[Depends(require_admin)])
async def admin_adjust_wallet_route(
    user_id: UUID,
    amount_npr: float,
    reason: str = "Manual admin adjustment",
    db: AsyncSession = Depends(get_db),
):
    """Admin can manually credit (positive) or debit (negative) a user's wallet."""
    return await add_credits(
        db=db,
        user_id=user_id,
        amount_npr=Decimal(str(amount_npr)),
        source="admin_adjustment",
        description=reason,
    )


@router.get("/settings/guest-models", dependencies=[Depends(require_admin)])
async def admin_get_guest_models_route(db: AsyncSession = Depends(get_db)):
    return await get_guest_model_settings(db)


class GuestModelsUpdate(BaseModel):
    allowed_models: list[str]


@router.put("/settings/guest-models", dependencies=[Depends(require_admin)])
async def admin_update_guest_models_route(
    body: GuestModelsUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await update_guest_model_settings(db, body.allowed_models)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── AI Model registry CRUD ────────────────────────────────────────────────────

class AIModelCreate(BaseModel):
    id: str
    label: str
    provider: str                      # "huggingface" | "openai" | "anthropic"
    provider_model_id: str
    input_price_per_million: float = 0
    output_price_per_million: float = 0
    is_active: bool = True
    sort_order: int = 0
    tier: str = "balanced"             # "fast" | "balanced" | "flagship" — drives Auto routing
    supports_images: bool = False      # can this model process image attachments?


class AIModelUpdate(BaseModel):
    label: str | None = None
    provider: str | None = None
    provider_model_id: str | None = None
    input_price_per_million: float | None = None
    output_price_per_million: float | None = None
    is_active: bool | None = None
    sort_order: int | None = None
    tier: str | None = None
    supports_images: bool | None = None


@router.get("/models", dependencies=[Depends(require_admin)])
async def admin_list_models_route(db: AsyncSession = Depends(get_db)):
    """All models including inactive — powers the admin Models tab."""
    return await list_ai_models(db)


@router.post("/models", dependencies=[Depends(require_admin)])
async def admin_create_model_route(
    body: AIModelCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_ai_model(db, body.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/models/{model_id}", dependencies=[Depends(require_admin)])
async def admin_update_model_route(
    model_id: str,
    body: AIModelUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await update_ai_model(db, model_id, body.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/models/{model_id}", dependencies=[Depends(require_admin)])
async def admin_delete_model_route(
    model_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await delete_ai_model(db, model_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Dynamic pricing settings ──────────────────────────────────────────────────

class PricingSettingsUpdate(BaseModel):
    usd_to_npr_rate: float | None = None
    free_trial_tokens: int | None = None
    guest_trial_tokens: int | None = None


@router.get("/settings/pricing", dependencies=[Depends(require_admin)])
async def admin_get_pricing_settings_route(db: AsyncSession = Depends(get_db)):
    return await get_pricing_settings(db)


@router.put("/settings/pricing", dependencies=[Depends(require_admin)])
async def admin_update_pricing_settings_route(
    body: PricingSettingsUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await update_pricing_settings(db, **body.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Image Model registry CRUD ──────────────────────────────────────────────────

class ImageModelCreate(BaseModel):
    id: str
    display_name: str
    provider: str                      # "huggingface" | "fal" | "pollinations"
    provider_model_id: str
    credits_per_image: float = 1.0
    is_active: bool = True
    sort_order: int = 0


class ImageModelUpdate(BaseModel):
    display_name: str | None = None
    provider: str | None = None
    provider_model_id: str | None = None
    credits_per_image: float | None = None
    is_active: bool | None = None
    sort_order: int | None = None


@router.get("/image-models", dependencies=[Depends(require_admin)])
async def admin_list_image_models_route(db: AsyncSession = Depends(get_db)):
    return await list_image_models(db)


@router.post("/image-models", dependencies=[Depends(require_admin)])
async def admin_create_image_model_route(
    body: ImageModelCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_image_model(db, body.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/image-models/{model_id}", dependencies=[Depends(require_admin)])
async def admin_update_image_model_route(
    model_id: str,
    body: ImageModelUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await update_image_model(db, model_id, body.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/image-models/{model_id}", dependencies=[Depends(require_admin)])
async def admin_delete_image_model_route(
    model_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await delete_image_model(db, model_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── System API Key database CRUD ────────────────────────────────────────────────

class ApiKeyCreate(BaseModel):
    name: str
    provider: str
    key_value: str
    is_active: bool = True
    description: str | None = None


class ApiKeyUpdate(BaseModel):
    name: str | None = None
    provider: str | None = None
    key_value: str | None = None
    is_active: bool | None = None
    description: str | None = None


@router.get("/api-keys", dependencies=[Depends(require_admin)])
async def admin_list_api_keys_route(db: AsyncSession = Depends(get_db)):
    return await list_admin_api_keys(db)


@router.post("/api-keys", dependencies=[Depends(require_admin)])
async def admin_create_api_key_route(
    body: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_admin_api_key(db, body.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/api-keys/{key_id}", dependencies=[Depends(require_admin)])
async def admin_update_api_key_route(
    key_id: str,
    body: ApiKeyUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await update_admin_api_key(db, key_id, body.model_dump(exclude_unset=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/api-keys/{key_id}", dependencies=[Depends(require_admin)])
async def admin_delete_api_key_route(
    key_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await delete_admin_api_key(db, key_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
