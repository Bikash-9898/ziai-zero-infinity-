# app/controllers/image_controller.py
"""
Handles image generation operations:
- Get available image models
- Generate an image
- Get image history for current user
- Get credits used by current user
"""

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.image import ImageGenerateRequest
from app.models.user import User
from app.services import image_model_service
from app.services.image_service import generate_image, save_generation, get_image_history, get_image_model_or_default


async def get_image_models(db: AsyncSession) -> list[dict]:
    """Active image models — powers the chat-style ImageModelSelector dropdown."""
    try:
        models = await image_model_service.list_models(db, active_only=True)
        return [
            {
                "id":                m.id,
                "name":              m.display_name,
                "provider":          m.provider,
                "credits_per_image": float(m.credits_per_image),
            }
            for m in models
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def create_image(req: ImageGenerateRequest, db: AsyncSession, current_user: User):
    """
    Generate an image and save to DB. User identity always comes from JWT.
    Called by: POST /api/image/generate
    """
    try:
        req.user_id = str(current_user.id)
        model_cfg = await get_image_model_or_default(db, req.model)
        req.model = model_cfg.id  # normalize in case we fell back to the default

        result = await generate_image(req, model_cfg)
        return await save_generation(
            db, req, result["image_url"], result["generation_time_ms"],
            credits_used=float(model_cfg.credits_per_image),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_user_image_history(db: AsyncSession, current_user: User) -> dict:
    """
    Return image generation history for the current user.
    Called by: GET /api/image/history
    """
    try:
        images = await get_image_history(db, str(current_user.id))
        return {"images": images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def get_credits_used(db: AsyncSession, current_user: User) -> dict:
    """
    Return total image credits used by the current user.
    Called by: GET /api/image/credits
    """
    from sqlalchemy import text
    try:
        result = await db.execute(
            text("""
                SELECT COALESCE(SUM(credits_used), 0) AS total_credits
                FROM image_generations
                WHERE user_id = :user_id AND status = 'success'
            """),
            {"user_id": str(current_user.id)},
        )
        row = result.fetchone()
        return {
            "user_id": str(current_user.id),
            "total_credits_used": float(row.total_credits),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
