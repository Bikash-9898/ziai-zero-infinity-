# app/schemas/usage.py

from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


# ── Request schemas ──────────────────────────────────────────────────────────

class LogAiRequestSchema(BaseModel):
    user_id:      UUID4
    model:        str
    tokens_input: int
    tokens_output:int
    cost:         Optional[Decimal] = None
    latency_ms:   Optional[int]     = None
    status:       str               = "success"


class CheckUsageRequest(BaseModel):
    user_id:          UUID4
    estimated_tokens: int = 500


# ── Response schemas ─────────────────────────────────────────────────────────

class UsageResponse(BaseModel):
    user_id:              UUID4
    plan:                 str
    tokens_used:          int
    tokens_limit:         int           # -1 = unlimited
    requests_used:        int
    requests_limit:       int           # -1 = unlimited
    images_used:          int
    images_limit:         int           # -1 = unlimited
    period_start:         date
    period_end:           date
    percent_tokens_used:  Optional[float]   # None if unlimited
    percent_requests_used:Optional[float]   # None if unlimited


class AiRequestResponse(BaseModel):
    id:            UUID4
    user_id:       UUID4
    model:         str
    tokens_input:  Optional[int]
    tokens_output: Optional[int]
    total_tokens:  int
    cost:          Optional[Decimal]
    latency_ms:    Optional[int]
    status:        str
    created_at:    datetime

    class Config:
        from_attributes = True


class UsageHistoryResponse(BaseModel):
    requests:  list[AiRequestResponse]
    total:     int
    page:      int
    page_size: int


class UsageSummaryResponse(BaseModel):
    daily_tokens:  list[dict]   # [{date, tokens, requests}]
    top_models:    list[dict]   # [{model, count, tokens}]
    total_cost:    Decimal
    avg_latency_ms:Optional[float]