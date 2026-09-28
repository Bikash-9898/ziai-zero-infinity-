# app/services/settings_service.py
"""
Admin-configurable settings backed by the app_settings table — lets pricing
and trial sizing change from the admin panel without a code deploy.
Falls back to the DEFAULT_* constants in app.pricing if nothing's been
configured yet (fresh install, or before an admin ever touches this).
"""

import json
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.settings import AppSetting
from app.pricing import (
    GUEST_ALLOWED_MODELS as DEFAULT_GUEST_MODELS,
    DEFAULT_USD_TO_NPR,
    DEFAULT_FREE_TRIAL_TOKENS,
    DEFAULT_GUEST_TRIAL_TOKENS,
)

GUEST_MODELS_KEY   = "guest_allowed_models"
USD_TO_NPR_KEY      = "usd_to_npr_rate"
FREE_TRIAL_KEY       = "free_trial_tokens"
GUEST_TRIAL_KEY      = "guest_trial_tokens"


async def _get_raw(db: AsyncSession, key: str) -> str | None:
    row = (await db.execute(select(AppSetting).where(AppSetting.key == key))).scalar_one_or_none()
    return row.value if row else None


async def _set_raw(db: AsyncSession, key: str, value: str) -> None:
    row = (await db.execute(select(AppSetting).where(AppSetting.key == key))).scalar_one_or_none()
    if row:
        row.value = value
    else:
        db.add(AppSetting(key=key, value=value))


async def get_guest_allowed_models(db: AsyncSession) -> list[str]:
    """Returns the admin-configured list of model keys guests may use."""
    raw = await _get_raw(db, GUEST_MODELS_KEY)
    if raw:
        try:
            models = json.loads(raw)
            if isinstance(models, list) and models:
                return models
        except (json.JSONDecodeError, TypeError):
            pass
    return list(DEFAULT_GUEST_MODELS)


async def set_guest_allowed_models(db: AsyncSession, model_keys: list[str]) -> list[str]:
    """Admin-only write path. Called by: PUT /api/admin/settings/guest-models"""
    if not model_keys:
        raise ValueError("Must allow at least one model for guests")
    await _set_raw(db, GUEST_MODELS_KEY, json.dumps(model_keys))
    await db.commit()
    return model_keys


async def get_usd_to_npr_rate(db: AsyncSession) -> Decimal:
    raw = await _get_raw(db, USD_TO_NPR_KEY)
    if raw:
        try:
            return Decimal(raw)
        except Exception:
            pass
    return DEFAULT_USD_TO_NPR


async def get_free_trial_tokens(db: AsyncSession) -> int:
    raw = await _get_raw(db, FREE_TRIAL_KEY)
    if raw:
        try:
            return int(raw)
        except ValueError:
            pass
    return DEFAULT_FREE_TRIAL_TOKENS


async def get_guest_trial_tokens(db: AsyncSession) -> int:
    raw = await _get_raw(db, GUEST_TRIAL_KEY)
    if raw:
        try:
            return int(raw)
        except ValueError:
            pass
    return DEFAULT_GUEST_TRIAL_TOKENS


async def get_pricing_settings(db: AsyncSession) -> dict:
    """Called by: GET /api/admin/settings/pricing"""
    return {
        "usd_to_npr_rate":    float(await get_usd_to_npr_rate(db)),
        "free_trial_tokens":  await get_free_trial_tokens(db),
        "guest_trial_tokens": await get_guest_trial_tokens(db),
    }


async def update_pricing_settings(
    db: AsyncSession,
    usd_to_npr_rate: float | None = None,
    free_trial_tokens: int | None = None,
    guest_trial_tokens: int | None = None,
) -> dict:
    """Called by: PUT /api/admin/settings/pricing"""
    if usd_to_npr_rate is not None:
        if usd_to_npr_rate <= 0:
            raise ValueError("usd_to_npr_rate must be positive")
        await _set_raw(db, USD_TO_NPR_KEY, str(usd_to_npr_rate))
    if free_trial_tokens is not None:
        if free_trial_tokens < 0:
            raise ValueError("free_trial_tokens must be >= 0")
        await _set_raw(db, FREE_TRIAL_KEY, str(int(free_trial_tokens)))
    if guest_trial_tokens is not None:
        if guest_trial_tokens < 0:
            raise ValueError("guest_trial_tokens must be >= 0")
        await _set_raw(db, GUEST_TRIAL_KEY, str(int(guest_trial_tokens)))

    await db.commit()
    return await get_pricing_settings(db)
