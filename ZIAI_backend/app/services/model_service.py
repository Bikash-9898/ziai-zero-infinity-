# app/services/model_service.py
"""
CRUD + lookup for the ai_models table, plus a short-TTL in-process cache —
get_model() is called on every single chat request, so we don't want a DB
round-trip per message. Any admin write invalidates the cache immediately,
so changes still take effect right away.
"""

import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.ai_model import AIModel

_CACHE_TTL_SECONDS = 30
_cache: dict[str, tuple[AIModel, float]] = {}
_all_cache: dict[bool, tuple[list[AIModel], float]] = {}  # key = active_only

# Capability ladder used by app.services.routing_service. Index = strength,
# so TIER_ORDER[0] is the cheapest/fastest bucket and TIER_ORDER[-1] is the
# strongest. Admins assign each ai_models row to one of these via the tier
# column; nothing else in the app needs to know the exact bucket names.
TIER_ORDER = ["fast", "balanced", "flagship"]


def _invalidate_cache():
    _cache.clear()
    _all_cache.clear()


async def get_model(db: AsyncSession, model_id: str) -> AIModel | None:
    cached = _cache.get(model_id)
    if cached and (time.time() - cached[1]) < _CACHE_TTL_SECONDS:
        return cached[0]

    row = (await db.execute(select(AIModel).where(AIModel.id == model_id))).scalar_one_or_none()
    if row:
        _cache[model_id] = (row, time.time())
    return row


async def list_models(db: AsyncSession, active_only: bool = True) -> list[AIModel]:
    cached = _all_cache.get(active_only)
    if cached and (time.time() - cached[1]) < _CACHE_TTL_SECONDS:
        return cached[0]

    query = select(AIModel).order_by(AIModel.sort_order, AIModel.id)
    if active_only:
        query = query.where(AIModel.is_active == True)  # noqa: E712
    rows = (await db.execute(query)).scalars().all()
    _all_cache[active_only] = (list(rows), time.time())
    return list(rows)


async def list_models_by_tier(db: AsyncSession, tier: str) -> list[AIModel]:
    """Active models in exactly one capability bucket, cheapest first.
    "Cheapest" = input+output rate summed — used by routing_service to
    tie-break when several models qualify for a given difficulty."""
    models = await list_models(db, active_only=True)
    matching = [m for m in models if m.tier == tier]
    matching.sort(key=lambda m: float(m.input_price_per_million) + float(m.output_price_per_million))
    return matching


async def create_model(db: AsyncSession, data: dict) -> AIModel:
    existing = (await db.execute(select(AIModel).where(AIModel.id == data["id"]))).scalar_one_or_none()
    if existing:
        raise ValueError(f"Model id '{data['id']}' already exists")

    row = AIModel(**data)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    _invalidate_cache()
    return row


async def update_model(db: AsyncSession, model_id: str, data: dict) -> AIModel:
    row = (await db.execute(select(AIModel).where(AIModel.id == model_id))).scalar_one_or_none()
    if not row:
        raise ValueError(f"Model '{model_id}' not found")

    for key, value in data.items():
        if value is not None and hasattr(row, key):
            setattr(row, key, value)

    await db.commit()
    await db.refresh(row)
    _invalidate_cache()
    return row


async def delete_model(db: AsyncSession, model_id: str) -> None:
    row = (await db.execute(select(AIModel).where(AIModel.id == model_id))).scalar_one_or_none()
    if not row:
        raise ValueError(f"Model '{model_id}' not found")
    await db.delete(row)
    await db.commit()
    _invalidate_cache()


# ── One-time seed ────────────────────────────────────────────────────────────
# Populates the table from what used to be the hardcoded lists, but only if
# the table is empty — safe to call on every startup.

_DEFAULT_MODELS = [
    dict(id="llama3",  label="Llama 3.1 8B (recommended)", provider="huggingface",
         provider_model_id="meta-llama/Llama-3.1-8B-Instruct",
         input_price_per_million=0.20, output_price_per_million=0.20, sort_order=0,
         tier="fast", supports_images=False),
    dict(id="qwen",    label="Qwen 2.5 7B", provider="huggingface",
         provider_model_id="Qwen/Qwen2.5-7B-Instruct",
         input_price_per_million=0.20, output_price_per_million=0.20, sort_order=1,
         tier="fast", supports_images=False),
    dict(id="qwen3",   label="Qwen 3 4B (fast)", provider="huggingface",
         provider_model_id="Qwen/Qwen3-4B",
         input_price_per_million=0.15, output_price_per_million=0.15, sort_order=2,
         tier="fast", supports_images=False),
    dict(id="mistral", label="Mistral 7B", provider="huggingface",
         provider_model_id="mistralai/Mistral-7B-Instruct-v0.3",
         input_price_per_million=0.20, output_price_per_million=0.20, sort_order=3,
         tier="fast", supports_images=False),

    dict(id="gpt-4o-mini",   label="GPT-4o Mini", provider="openai",
         provider_model_id="gpt-4o-mini",
         input_price_per_million=0.15, output_price_per_million=0.60, sort_order=4,
         tier="fast", supports_images=True),
    dict(id="gpt-4o",        label="GPT-4o", provider="openai",
         provider_model_id="gpt-4o",
         input_price_per_million=2.50, output_price_per_million=10.00, sort_order=5,
         tier="balanced", supports_images=True),
    dict(id="gpt-4-turbo",   label="GPT-4 Turbo", provider="openai",
         provider_model_id="gpt-4-turbo",
         input_price_per_million=10.00, output_price_per_million=30.00, sort_order=6,
         tier="flagship", supports_images=True),
    dict(id="gpt-3.5-turbo", label="GPT-3.5 Turbo (fast)", provider="openai",
         provider_model_id="gpt-3.5-turbo",
         input_price_per_million=0.50, output_price_per_million=1.50, sort_order=7,
         tier="fast", supports_images=False),

    dict(id="claude-haiku",      label="Claude Haiku 4.5 (fast)", provider="anthropic",
         provider_model_id="claude-haiku-4-5-20251001",
         input_price_per_million=1.00, output_price_per_million=5.00, sort_order=8,
         tier="fast", supports_images=True),
    dict(id="claude-3-5-sonnet", label="Claude Sonnet 3.5", provider="anthropic",
         provider_model_id="claude-sonnet-4-5",
         input_price_per_million=3.00, output_price_per_million=15.00, sort_order=9,
         tier="balanced", supports_images=True),
    dict(id="claude-3-opus",     label="Claude Opus 3", provider="anthropic",
         provider_model_id="claude-opus-4-5",
         input_price_per_million=5.00, output_price_per_million=25.00, sort_order=10,
         tier="flagship", supports_images=True),
    dict(id="gemini-3-6-flash",  label="Gemini 3.6 Flash", provider="google",
         provider_model_id="gemini-3.6-flash",
         input_price_per_million=1.50, output_price_per_million=7.50, sort_order=12,
         tier="balanced", supports_images=True),

    dict(id="nemotron", label="NVIDIA Nemotron 3.5 Lightning 30B", provider="nvidia",
         provider_model_id="nvidia/nemotron-3.5-lightning-30b-a3b",
         input_price_per_million=0.20, output_price_per_million=0.60, sort_order=13,
         tier="fast", supports_images=False),
]

DEFAULT_MODEL_ID = "llama3"


async def seed_default_models(db: AsyncSession) -> None:
    existing_count = (await db.execute(select(AIModel.id))).scalars().all()
    if existing_count:
        return  # already seeded — never overwrite admin edits on restart

    for data in _DEFAULT_MODELS:
        db.add(AIModel(**data))
    await db.commit()