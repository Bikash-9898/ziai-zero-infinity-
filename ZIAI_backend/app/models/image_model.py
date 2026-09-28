# app/models/image_model.py
"""
Single source of truth for image generation models — mirrors app.models
.ai_model.AIModel. Replaces what used to be hardcoded HF_MODELS/FAL_MODELS
dicts in image_service.py plus a partial (pricing-only) image_models table.

NOTE: the `image_models` table already existed in the DB before this model
was introduced (id, display_name, credits_per_image only) — see the ALTER
TABLE statements in the delivery notes to add the new columns.
"""

from sqlalchemy import Column, String, Boolean, Integer, Numeric, DateTime, text
from app.database import Base


class ImageModel(Base):
    __tablename__ = "image_models"

    # Stable key used everywhere else — AiRequest-style reference, e.g. "flux".
    id = Column(String, primary_key=True)

    display_name = Column(String, nullable=False)   # "FLUX.1 (recommended)"
    provider     = Column(String, nullable=False, default="pollinations")  # "huggingface" | "fal" | "pollinations"

    # The real model identifier the provider expects, e.g.
    # "black-forest-labs/FLUX.1-schnell" or "fal-ai/flux/schnell".
    # Pollinations doesn't need a separate ID (it takes `model` directly in
    # the URL) — provider_model_id can just equal `id` for those rows.
    provider_model_id = Column(String, nullable=False)

    credits_per_image = Column(Numeric(6, 2), nullable=False, default=1.0)

    is_active  = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, server_default=text("NOW()"))

    def __repr__(self):
        return f"<ImageModel id={self.id} provider={self.provider} active={self.is_active}>"
