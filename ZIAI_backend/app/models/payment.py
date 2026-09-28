# app/models/payment.py

from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Payment(Base):
    __tablename__ = "payments"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider       = Column(String, nullable=False)          # esewa | khalti | internal
    plan           = Column(String, nullable=False)          # free | basic | pro | enterprise
    amount         = Column(Numeric(10, 2), nullable=False)  # NPR
    currency       = Column(String, default="NPR")
    status         = Column(String, default="pending")       # pending | success | failed | refunded
    transaction_id = Column(String, nullable=True)           # provider's transaction ID (set on success)
    ref_id         = Column(String, nullable=True, index=True)  # = transaction_uuid at initiation time
    verified_at    = Column(DateTime, nullable=True)
    created_at     = Column(DateTime, server_default=text("NOW()"))

    # Relationships
    user = relationship("User", back_populates="payments")

    def __repr__(self):
        return (
            f"<Payment id={self.id} provider={self.provider} "
            f"plan={self.plan} status={self.status}>"
        )