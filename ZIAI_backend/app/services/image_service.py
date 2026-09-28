# app/services/image_service.py
import httpx
import time
import uuid
import os
from datetime import datetime
from urllib.parse import quote          # ← proper URL encoding
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.image import ImageGenerateRequest
from app.models.image_model import ImageModel
from app.services import image_model_service

HF_API_KEY  = os.getenv("HF_API_KEY")
FAL_API_KEY = os.getenv("FAL_API_KEY")


# ── HuggingFace ───────────────────────────────────────────────────────────────

async def generate_image_huggingface(req: ImageGenerateRequest, provider_model_id: str) -> dict:
    start = time.time()

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"https://router.huggingface.co/hf-inference/models/{provider_model_id}",
            headers={"Authorization": f"Bearer {HF_API_KEY}"},
            json={"inputs": req.prompt},
        )
        if response.status_code != 200:
            raise Exception(f"HuggingFace generation failed: {response.text}")

    import base64
    image_base64 = base64.b64encode(response.content).decode("utf-8")
    image_url    = f"data:image/png;base64,{image_base64}"

    return {
        "image_url":           image_url,
        "generation_time_ms":  int((time.time() - start) * 1000),
    }


# ── fal.ai — uses synchronous endpoint to avoid polling complexity ────────────

async def generate_image_fal(req: ImageGenerateRequest, provider_model_id: str) -> dict:
    """
    Uses fal.run (sync) instead of queue.fal.run (async queue).
    queue.fal.run returns a request ID, not an image — polling is required.
    fal.run blocks until the result is ready (up to timeout).
    """
    start = time.time()

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"https://fal.run/{provider_model_id}",          # ← sync endpoint, not queue
            headers={
                "Authorization": f"Key {FAL_API_KEY}",
                "Content-Type":  "application/json",
            },
            json={
                "prompt":          req.prompt,
                "negative_prompt": req.negative_prompt or "",
                "image_size": {
                    "width":  req.width,
                    "height": req.height,
                },
                "num_images": 1,
            },
        )
        if response.status_code != 200:
            raise Exception(f"fal.ai generation failed: {response.text}")

        result = response.json()

    # fal.run returns images list directly
    images = result.get("images") or result.get("image", [])
    if not images:
        raise Exception(f"fal.ai returned no images: {result}")

    image_url = images[0]["url"] if isinstance(images[0], dict) else images[0]

    return {
        "image_url":          image_url,
        "generation_time_ms": int((time.time() - start) * 1000),
    }


# ── Pollinations ──────────────────────────────────────────────────────────────

async def generate_image_pollinations(req: ImageGenerateRequest, provider_model_id: str) -> dict:
    start = time.time()

    encoded_prompt = quote(req.prompt, safe="")
    provider_id = provider_model_id if provider_model_id else "flux"
    image_url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?model={quote(provider_id)}"
        f"&width={req.width}"
        f"&height={req.height}"
        f"&nologo=true"
        f"&seed={int(time.time())}"
    )

    return {
        "image_url":          image_url,
        "generation_time_ms": int((time.time() - start) * 1000),
    }


# ── Dispatcher ────────────────────────────────────────────────────────────────

async def get_image_model_or_default(db: AsyncSession, model_id: str) -> ImageModel:
    """Looks up the requested model in the DB registry, falling back to the default if unknown/disabled."""
    model_cfg = await image_model_service.get_model(db, model_id)
    if not model_cfg or not model_cfg.is_active:
        model_cfg = await image_model_service.get_model(db, image_model_service.DEFAULT_IMAGE_MODEL_ID)
    if not model_cfg:
        raise Exception(
            "No image models configured — run app.services.image_model_service.seed_default_image_models"
        )
    return model_cfg


async def generate_image(req: ImageGenerateRequest, model_cfg: ImageModel) -> dict:
    """Provider routing with automatic free fallback if provider API key is missing or fails."""
    try:
        if model_cfg.provider == "huggingface":
            if not HF_API_KEY:
                raise Exception("HuggingFace API key not configured")
            return await generate_image_huggingface(req, model_cfg.provider_model_id)
        elif model_cfg.provider == "fal":
            if not FAL_API_KEY:
                raise Exception("fal.ai API key not configured")
            return await generate_image_fal(req, model_cfg.provider_model_id)
        else:
            return await generate_image_pollinations(req, model_cfg.provider_model_id or "flux")
    except Exception as err:
        print(f"[WARN] Image provider '{model_cfg.provider}' failed ({err}). Falling back to Pollinations AI.")
        return await generate_image_pollinations(req, "flux")


# ── DB helpers ────────────────────────────────────────────────────────────────

async def save_generation(
    db: AsyncSession,
    req: ImageGenerateRequest,
    image_url: str,
    time_ms: int,
    credits_used: float,
) -> dict:
    """
    Saves using ORM-compatible raw SQL but with UUID user_id (from JWT).
    user_id is now a UUID string matching the users.id column.
    """
    record_id = str(uuid.uuid4())
    now       = datetime.utcnow()

    await db.execute(
        text("""
            INSERT INTO image_generations
              (id, user_id, prompt, negative_prompt, model, width, height,
               image_url, status, credits_used, generation_time_ms, created_at)
            VALUES
              (:id, :user_id, :prompt, :neg, :model, :width, :height,
               :url, 'success', :credits, :time_ms, :now)
        """),
        {
            "id":       record_id,
            "user_id":  req.user_id,    # UUID string, set by router from JWT
            "prompt":   req.prompt,
            "neg":      req.negative_prompt,
            "model":    req.model,
            "width":    req.width,
            "height":   req.height,
            "url":      image_url,
            "credits":  credits_used,
            "time_ms":  time_ms,
            "now":      now,
        },
    )
    await db.commit()

    return {
        "id":                  record_id,
        "image_url":           image_url,
        "prompt":              req.prompt,
        "model":               req.model,
        "generation_time_ms":  time_ms,
        "created_at":          now.isoformat(),
    }


async def get_image_history(db: AsyncSession, user_id: str) -> list:
    """user_id is now a UUID string from the JWT."""
    result = await db.execute(
        text("""
            SELECT id, image_url, prompt, model, generation_time_ms, created_at
            FROM image_generations
            WHERE user_id = :user_id AND status = 'success'
            ORDER BY created_at DESC
            LIMIT 20
        """),
        {"user_id": user_id},
    )
    rows = result.fetchall()
    return [
        {
            **dict(row._mapping),
            "id":         str(dict(row._mapping)["id"]),
            "created_at": dict(row._mapping)["created_at"].isoformat(),
        }
        for row in rows
    ]
