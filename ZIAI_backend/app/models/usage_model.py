# app/models/usage.py

from sqlalchemy import (
    Column, String, Integer, BigInteger,
    Date, DateTime, ForeignKey, Numeric, text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Usage(Base):
    """Tracks aggregated token + request counts per billing period."""
    __tablename__ = "usage"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id       = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tokens_used   = Column(BigInteger, default=0)
    request_count = Column(Integer, default=0)
    period_start  = Column(Date, nullable=False)
    period_end    = Column(Date, nullable=False)
    created_at    = Column(DateTime, server_default=text("NOW()"))

    # Relationships
    user = relationship("User", back_populates="usages")

    def __repr__(self):
        return (
            f"<Usage user_id={self.user_id} "
            f"tokens={self.tokens_used} period={self.period_start}>"
        )


class AiRequest(Base):
    """
    Individual AI request records.
    Used for: per-request logging, usage history (admin), cost tracking.
    NOTE: total_tokens is a computed property — not stored in the DB column.
    It is serialized correctly by Pydantic from_attributes=True.
    """
    __tablename__ = "ai_requests"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id      = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model        = Column(String, nullable=False)
    tokens_input = Column(Integer, nullable=True)
    tokens_output= Column(Integer, nullable=True)
    cost         = Column(Numeric(10, 6), nullable=True)
    latency_ms   = Column(Integer, nullable=True)
    status       = Column(String, default="success")   # success | error
    created_at   = Column(DateTime, server_default=text("NOW()"), index=True)

    # Relationships
    user = relationship("User", back_populates="ai_requests")

    @property
    def total_tokens(self) -> int:
        """Computed — not a DB column. Pydantic reads this via from_attributes."""
        return (self.tokens_input or 0) + (self.tokens_output or 0)

    def __repr__(self):
        return (
            f"<AiRequest user_id={self.user_id} "
            f"model={self.model} status={self.status}>"
        )


class PlanLimit(Base):
    """
    Static plan configuration stored in DB.
    is_unlimited is a computed property — tokens_per_month == -1 means unlimited.

    NOTE: is_unlimited is NOT a DB column. It is computed by the @property
    and serialized by Pydantic (from_attributes=True reads Python properties).
    The plan_limits table does NOT have an is_unlimited column.
    """
    __tablename__ = "plan_limits"

    plan                          = Column(String, primary_key=True)
    tokens_per_month              = Column(BigInteger, nullable=False)
    requests_per_month            = Column(Integer, nullable=False)
    image_generations_per_month   = Column(Integer, nullable=False)
    price_npr                     = Column(Numeric(10, 2), nullable=False)

    @property
    def is_unlimited(self) -> bool:
        """True when tokens_per_month is -1 (enterprise unlimited plan)."""
        return self.tokens_per_month == -1

    def __repr__(self):
        return f"<PlanLimit plan={self.plan} price_npr={self.price_npr}>"