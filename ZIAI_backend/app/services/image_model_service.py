# app/services/image_model_service.py
"""
CRUD + lookup for the image_models table. Mirrors app.services.model_service
exactly — same short-TTL cache reasoning (queried on every image generation).
"""

import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.image_model import ImageModel

_CACHE_TTL_SECONDS = 30
_cache: dict[str, tuple[ImageModel, float]] = {}
_all_cache: dict[bool, tuple[list[ImageModel], float]] = {}


def _invalidate_cache():
    _cache.clear()
    _all_cache.clear()


async def get_model(db: AsyncSession, model_id: str) -> ImageModel | None:
    cached = _cache.get(model_id)
    if cached and (time.time() - cached[1]) < _CACHE_TTL_SECONDS:
        return cached[0]

    row = (await db.execute(select(ImageModel).where(ImageModel.id == model_id))).scalar_one_or_none()
    if row:
        _cache[model_id] = (row, time.time())
    return row


async def list_models(db: AsyncSession, active_only: bool = True) -> list[ImageModel]:
    cached = _all_cache.get(active_only)
    if cached and (time.time() - cached[1]) < _CACHE_TTL_SECONDS:
        return cached[0]

    query = select(ImageModel).order_by(ImageModel.sort_order, ImageModel.id)
    if active_only:
        query = query.where(ImageModel.is_active == True)  # noqa: E712
    rows = (await db.execute(query)).scalars().all()
    _all_cache[active_only] = (list(rows), time.time())
    return list(rows)


async def create_model(db: AsyncSession, data: dict) -> ImageModel:
    existing = (await db.execute(select(ImageModel).where(ImageModel.id == data["id"]))).scalar_one_or_none()
    if existing:
        raise ValueError(f"Image model id '{data['id']}' already exists")

    row = ImageModel(**data)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    _invalidate_cache()
    return row


async def update_model(db: AsyncSession, model_id: str, data: dict) -> ImageModel:
    row = (await db.execute(select(ImageModel).where(ImageModel.id == model_id))).scalar_one_or_none()
    if not row:
        raise ValueError(f"Image model '{model_id}' not found")

    for key, value in data.items():
        if value is not None and hasattr(row, key):
            setattr(row, key, value)

    await db.commit()
    await db.refresh(row)
    _invalidate_cache()
    return row


async def delete_model(db: AsyncSession, model_id: str) -> None:
    row = (await db.execute(select(ImageModel).where(ImageModel.id == model_id))).scalar_one_or_none()
    if not row:
        raise ValueError(f"Image model '{model_id}' not found")
    await db.delete(row)
    await db.commit()
    _invalidate_cache()


# ── One-time seed ────────────────────────────────────────────────────────────
# Fixes a latent bug along the way: "sdxl" previously had no entry in either
# hardcoded HF_MODELS/FAL_MODELS dict, so selecting it silently fell through
# to the Pollinations dispatcher with model="sdxl" (wrong provider). It now
# gets a real HuggingFace model id.

_DEFAULT_IMAGE_MODELS = [
    dict(id="flux",  display_name="FLUX.1 (recommended)", provider="pollinations",
         provider_model_id="flux", credits_per_image=1.0, sort_order=0),
    dict(id="turbo", display_name="FLUX.1-schnell", provider="huggingface",
         provider_model_id="black-forest-labs/FLUX.1-schnell", credits_per_image=0.5, sort_order=1),
    dict(id="sdxl",  display_name="Stable Diffusion 3.5 Large", provider="huggingface",
         provider_model_id="stabilityai/stable-diffusion-3.5-large", credits_per_image=1.0, sort_order=2),
]

DEFAULT_IMAGE_MODEL_ID = "flux"


async def seed_default_image_models(db: AsyncSession) -> None:
    existing = (await db.execute(select(ImageModel.id))).scalars().all()
    if existing:
        return  # already seeded — never overwrite admin edits on restart

    for data in _DEFAULT_IMAGE_MODELS:
        db.add(ImageModel(**data))
    await db.commit()
