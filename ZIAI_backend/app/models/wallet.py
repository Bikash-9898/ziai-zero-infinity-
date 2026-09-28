# app/models/wallet.py
"""
Auditable ledger of every wallet change: top-ups, per-request deductions,
refunds, and manual admin adjustments. Never mutate User.credit_balance
without also writing one of these rows — it's the only way to reconstruct
"where did the money go" later.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id      = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # topup | deduction | trial_usage | refund | admin_adjustment
    type = Column(String, nullable=False)

    # Positive = credit added, negative = credit spent. NPR, matches Payment.amount.
    amount        = Column(Numeric(12, 2), nullable=False)
    balance_after = Column(Numeric(12, 2), nullable=False)

    # Optional link back to the AiRequest that caused a deduction
    related_request_id = Column(UUID(as_uuid=True), nullable=True)

    description = Column(String, nullable=True)
    created_at  = Column(DateTime, server_default=text("NOW()"), index=True)

    user = relationship("User", back_populates="credit_transactions")

    def __repr__(self):
        return f"<CreditTransaction user_id={self.user_id} type={self.type} amount={self.amount}>"
