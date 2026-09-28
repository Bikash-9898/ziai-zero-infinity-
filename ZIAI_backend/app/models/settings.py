# app/models/settings.py
"""
Generic key-value store for admin-configurable settings that shouldn't
require a code deploy to change — e.g. which models guests are allowed to
use. Keep values as JSON-encoded strings so this table can hold anything
without a schema migration per new setting.
"""

from sqlalchemy import Column, String, DateTime, text
from app.database import Base


class AppSetting(Base):
    __tablename__ = "app_settings"

    key        = Column(String, primary_key=True)
    value      = Column(String, nullable=False)  # JSON-encoded
    updated_at = Column(DateTime, server_default=text("NOW()"), onupdate=text("NOW()"))
