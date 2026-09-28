# app/models/subscription.py

from sqlalchemy import Column, String, DateTime, ForeignKey, text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Subscription(Base):
    __tablename__ = "subscriptions"

    id                   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id              = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan                 = Column(String, nullable=False)
    status               = Column(String, nullable=False, default="active")  # active | canceled | expired
    current_period_start = Column(DateTime, nullable=True)
    current_period_end   = Column(DateTime, nullable=True)
    created_at           = Column(DateTime, server_default=text("NOW()"))

    # Relationships
    user = relationship("User", back_populates="subscriptions")

    # One subscription row per user (upserted on each payment activation)
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_subscriptions_user_id"),
    )

    def __repr__(self):
        return (
            f"<Subscription user_id={self.user_id} "
            f"plan={self.plan} status={self.status}>"
        )

    @property
    def is_active(self) -> bool:
        return self.status == "active"