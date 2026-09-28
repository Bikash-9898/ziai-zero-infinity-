# app/schemas/billing.py

from pydantic import BaseModel, UUID4
from typing import Optional, Literal
from datetime import datetime
from decimal import Decimal


# ── Request schemas ──────────────────────────────────────────────────────────

class InitiatePaymentRequest(BaseModel):
    plan:     Literal["basic", "pro", "enterprise"]
    user_id:  UUID4
    provider: Literal["esewa", "khalti"]


class EsewaInitiateRequest(BaseModel):
    plan:    Literal["basic", "pro", "enterprise"]
    user_id: UUID4


class KhaltiInitiateRequest(BaseModel):
    plan:    Literal["basic", "pro", "enterprise"]
    user_id: UUID4


class StripeInitiateRequest(BaseModel):
    plan:    Literal["basic", "pro", "enterprise"]
    user_id: UUID4

class StripeVerifyRequest(BaseModel):
    session_id: str

class EsewaSuccessCallback(BaseModel):
    data: str   # base64-encoded JSON from eSewa


class KhaltiVerifyRequest(BaseModel):
    pidx:              str
    purchase_order_id: Optional[str] = None


# ── Response schemas ─────────────────────────────────────────────────────────

class EsewaPayloadResponse(BaseModel):
    form_url:         str
    payload:          dict
    transaction_uuid: str


class KhaltiInitiateResponse(BaseModel):
    payment_url: str
    pidx:        str
    order_id:    str


class PaymentRecord(BaseModel):
    id:             UUID4
    user_id:        UUID4
    provider:       str
    plan:           str
    amount:         Decimal
    currency:       str
    status:         str
    transaction_id: Optional[str]
    verified_at:    Optional[datetime]
    created_at:     datetime

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    id:                   UUID4
    user_id:              UUID4
    plan:                 str
    status:               str
    current_period_start: Optional[datetime]
    current_period_end:   Optional[datetime]
    created_at:           datetime

    class Config:
        from_attributes = True


class ActivateResponse(BaseModel):
    message:      str
    plan:         str
    subscription: Optional[SubscriptionResponse] = None


class PlanInfo(BaseModel):
    plan:                        str
    tokens_per_month:            int
    requests_per_month:          int
    image_generations_per_month: int
    price_npr:                   Decimal
    is_unlimited:                bool

    class Config:
        from_attributes = True