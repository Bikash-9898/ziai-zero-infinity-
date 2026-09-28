import os
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, BigInteger, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class LibraryItem(Base):
    __tablename__ = "library_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    original_name = Column(String, nullable=False)
    filename = Column(String, nullable=False, unique=True)
    url = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    size = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, server_default=text("NOW()"))

    user = relationship("User", back_populates="library_items")
