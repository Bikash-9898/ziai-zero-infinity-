import uuid
from datetime import datetime
from sqlalchemy import BigInteger, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Boolean, TIMESTAMP, Text, text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

# class User(Base):
#     __tablename__ = "users"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     email = Column(String, unique=True, index=True, nullable=False)
#     username = Column(String, unique=True, index=True, nullable=False)
#     plan = Column(String, default="free")
#     is_active = Column(Boolean, default=True)
#     created_at = Column(TIMESTAMP(timezone=False), server_default=text('now()'))
    

# class Usage(Base):
#     __tablename__ = "usage"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
#     tokens_used = Column(BigInteger, default=0)
#     request_count = Column(Integer, default=0)
#     period_start = Column(Date, nullable=True)
#     period_end = Column(Date, nullable=True)
#     created_at = Column(DateTime, default=datetime.utcnow)

#     # Relationship (Optional: if you have a User model)
#     # user = relationship("User", back_populates="usages")


# class AIRequest(Base):
#     __tablename__ = "ai_requests"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
#     model = Column(String, nullable=False) # e.g., 'gpt-4o'
#     tokens_input = Column(Integer, default=0)
#     tokens_output = Column(Integer, default=0)
#     cost = Column(Numeric(10, 6), default=0.0)
#     latency_ms = Column(Integer, default=0)
#     status = Column(String, nullable=False) # e.g., 'success', 'failed', 'processing'
#     created_at = Column(DateTime, default=datetime.utcnow)

#     # Relationship
#     # user = relationship("User", back_populates="ai_requests")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String, default="New Chat")
    model = Column(String, default="llama3-8b-8192")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String)       # 'user' or 'assistant'
    content = Column(Text)
    tokens_used = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())