# app/models/ai_model.py
"""
Single source of truth for which AI models exist, how to call them, and
what they cost. Replaces what used to be three hand-synced lists:
  - frontend store/models.ts        (id/label for the dropdown)
  - ai_service.AVAILABLE_MODELS     (provider/model_id routing)
  - pricing.MODEL_PRICING_USD       (cost rates)
Admin CRUD lives in admin_controller / admin_router (/api/admin/models).
"""

from sqlalchemy import Column, String, Boolean, Integer, Numeric, DateTime, text
from app.database import Base


class AIModel(Base):
    __tablename__ = "ai_models"

    # Stable key used everywhere else in the app (AiRequest.model, wallet
    # deductions, guest_allowed_models, frontend selection) — e.g. "llama3".
    id = Column(String, primary_key=True)

    label    = Column(String, nullable=False)   # "Llama 3.1 8B (recommended)"
    provider = Column(String, nullable=False)   # "huggingface" | "openai" | "anthropic"

    # The real string the provider's SDK expects, e.g. "gpt-4o" or
    # "meta-llama/Llama-3.1-8B-Instruct". Deliberately separate from `id`
    # so the provider can rename/version a model without breaking every
    # AiRequest row or wallet transaction that references the stable `id`.
    provider_model_id = Column(String, nullable=False)

    input_price_per_million  = Column(Numeric(10, 4), nullable=False, default=0)
    output_price_per_million = Column(Numeric(10, 4), nullable=False, default=0)

    is_active  = Column(Boolean, nullable=False, default=True)   # hide without deleting
    sort_order = Column(Integer, nullable=False, default=0)

    # Capability bucket used by app.services.routing_service to pick a model
    # for "Auto" chat requests: "fast" | "balanced" | "flagship". Admin-editable
    # from the same Models tab as everything else — see admin_controller.
    tier = Column(String, nullable=False, default="balanced", server_default="balanced")

    # When True, image attachments in chat are forwarded to the provider as
    # vision content blocks. When False, images are dropped and the user is
    # informed that the model doesn't support image input.
    supports_images = Column(Boolean, nullable=False, default=False, server_default=text("false"))

    created_at = Column(DateTime, server_default=text("NOW()"))

    def __repr__(self):
        return f"<AIModel id={self.id} provider={self.provider} active={self.is_active}>"
