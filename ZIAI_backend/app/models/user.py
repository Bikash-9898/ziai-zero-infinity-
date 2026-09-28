from sqlalchemy import Column, String, Boolean, DateTime, Numeric, BigInteger, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.pricing import DEFAULT_FREE_TRIAL_TOKENS
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, nullable=True)
    plan = Column(String, nullable=False, default="free")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=text("NOW()"))

    # ── Wallet / pay-as-you-go fields ────────────────────────────────────
    # New users get a limited free trial (in raw tokens) before they need
    # to top up credit_balance. This column default is only a safety net —
    # the real, admin-editable value is fetched at creation time from
    # app.services.settings_service and set explicitly (see auth_controller
    # / user_controller). Once trial_tokens_remaining hits 0, requests are
    # billed against credit_balance (NPR) instead.
    trial_tokens_remaining = Column(BigInteger, nullable=False, default=DEFAULT_FREE_TRIAL_TOKENS)
    credit_balance         = Column(Numeric(12, 2), nullable=False, default=0)  # NPR

    # ── Guest (not-signed-in) chat ───────────────────────────────────────
    # A guest is a real User row auto-provisioned per browser (see
    # auth_controller.guest_login), identified by a UUID the frontend
    # generates and stores in localStorage — NOT a real email/account.
    is_guest        = Column(Boolean, nullable=False, default=False)
    client_guest_id = Column(String, unique=True, nullable=True, index=True)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete")
    payments = relationship("Payment", back_populates="user", cascade="all, delete")
    usages = relationship("Usage", back_populates="user", cascade="all, delete")
    ai_requests = relationship("AiRequest", back_populates="user", cascade="all, delete")
    credit_transactions = relationship("CreditTransaction", back_populates="user", cascade="all, delete")
    library_items = relationship("LibraryItem", back_populates="user", cascade="all, delete")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} plan={self.plan}>"