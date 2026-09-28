# app/models/api_key.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name        = Column(String, nullable=False)
    provider    = Column(String, nullable=False)  # e.g., 'huggingface', 'openai', 'anthropic', 'fal', 'tavily', 'google', 'openrouter', 'other'
    key_value   = Column(Text, nullable=False)
    is_active   = Column(Boolean, default=True, nullable=False)
    description = Column(String, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
