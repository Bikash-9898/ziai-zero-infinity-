# app/services/api_key_service.py
import uuid
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.api_key import ApiKey


async def list_api_keys(db: AsyncSession) -> list[ApiKey]:
    """Return all API keys ordered by created_at DESC."""
    result = await db.execute(select(ApiKey).order_by(ApiKey.created_at.desc()))
    keys = list(result.scalars().all())

    # Seed defaults from env if database is empty
    if not keys:
        await seed_default_api_keys(db)
        result = await db.execute(select(ApiKey).order_by(ApiKey.created_at.desc()))
        keys = list(result.scalars().all())

    return keys


async def get_api_key(db: AsyncSession, key_id: str) -> ApiKey | None:
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    return result.scalar_one_or_none()


async def create_api_key(db: AsyncSession, data: dict) -> ApiKey:
    new_key = ApiKey(
        id=str(uuid.uuid4()),
        name=data.get("name", "New API Key"),
        provider=data.get("provider", "other").lower(),
        key_value=data.get("key_value", ""),
        is_active=bool(data.get("is_active", True)),
        description=data.get("description", ""),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)
    return new_key


async def update_api_key(db: AsyncSession, key_id: str, data: dict) -> ApiKey:
    key_item = await get_api_key(db, key_id)
    if not key_item:
        raise ValueError("API Key not found")

    if "name" in data and data["name"] is not None:
        key_item.name = data["name"]
    if "provider" in data and data["provider"] is not None:
        key_item.provider = data["provider"].lower()
    if "key_value" in data and data["key_value"] is not None:
        key_item.key_value = data["key_value"]
    if "is_active" in data and data["is_active"] is not None:
        key_item.is_active = bool(data["is_active"])
    if "description" in data and data["description"] is not None:
        key_item.description = data["description"]

    key_item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(key_item)
    return key_item


async def delete_api_key(db: AsyncSession, key_id: str) -> bool:
    key_item = await get_api_key(db, key_id)
    if not key_item:
        raise ValueError("API Key not found")

    await db.delete(key_item)
    await db.commit()
    return True


PROVIDER_ENV_VARS = {
    "huggingface": "HF_API_KEY",
    "openai":      "OPENAI_API_KEY",
    "anthropic":   "ANTHROPIC_API_KEY",
    "google":      "GOOGLE_API_KEY",
    "nvidia":      "NVIDIA_API_KEY",
    "fal":         "FAL_API_KEY",
    "tavily":      "TAVILY_API_KEY",
}


async def get_provider_api_key(db: AsyncSession, provider: str) -> str | None:
    """Resolve the credential to use for a provider at request time.

    Prefers the most recently updated ACTIVE row in the api_keys table
    (what admins manage from the dashboard), falling back to the .env
    variable when no active DB key exists. Called per AI request so admin
    updates take effect immediately without a server restart.
    """
    result = await db.execute(
        select(ApiKey.key_value)
        .where(ApiKey.provider == (provider or "").lower(), ApiKey.is_active == True)  # noqa: E712
        .order_by(ApiKey.updated_at.desc())
        .limit(1)
    )
    value = result.scalar_one_or_none()
    if value:
        return value

    env_var = PROVIDER_ENV_VARS.get((provider or "").lower())
    return os.getenv(env_var) if env_var else None


async def seed_default_api_keys(db: AsyncSession):
    """Seed initial system keys from environment variables if table is empty."""
    defaults = [
        {
            "name": "HuggingFace Primary Key",
            "provider": "huggingface",
            "key_value": os.getenv("HF_API_KEY", "hf_default_token_placeholder"),
            "is_active": True,
            "description": "Primary key for HuggingFace inference router models & FLUX",
        },
        {
            "name": "fal.ai Generation Key",
            "provider": "fal",
            "key_value": os.getenv("FAL_API_KEY", "fal_default_token_placeholder"),
            "is_active": True,
            "description": "API key for fal.ai fast image generation models",
        },
        {
            "name": "Tavily Web Search Key",
            "provider": "tavily",
            "key_value": os.getenv("TAVILY_API_KEY", "tvly_default_token_placeholder"),
            "is_active": True,
            "description": "API key for Tavily live web search agent",
        },
        {
            "name": "OpenAI Production Key",
            "provider": "openai",
            "key_value": os.getenv("OPENAI_API_KEY", "sk-proj-default_placeholder"),
            "is_active": False,
            "description": "Production OpenAI API key for GPT-4o models",
        },
        {
            "name": "NVIDIA NIM Key",
            "provider": "nvidia",
            "key_value": os.getenv("NVIDIA_API_KEY", ""),
            "is_active": True,
            "description": "API key for NVIDIA NIM (nemotron) chat models",
        },
    ]

    for item in defaults:
        db.add(ApiKey(
            id=str(uuid.uuid4()),
            name=item["name"],
            provider=item["provider"],
            key_value=item["key_value"],
            is_active=item["is_active"],
            description=item["description"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        ))
    await db.commit()
