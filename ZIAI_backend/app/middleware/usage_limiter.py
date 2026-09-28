# usage_limiter.py
from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Callable

from app.database import get_db
from app.services.usage_service import check_and_increment_usage


# async def enforce_usage_limit(request: Request, db, user_id: str, estimated_tokens: int = 500):
#     allowed = await check_and_increment_usage(db, user_id, estimated_tokens, model="check")
#     if not allowed:
#         raise HTTPException(429, detail="Monthly usage limit reached. Please upgrade your plan.")
    




class UsageLimiter:
    """
    Dependency-injectable usage limiter for AI endpoints.

    Usage in a router:
        @router.post("/chat")
        async def chat(
            payload: ChatRequest,
            _: None = Depends(UsageLimiter(estimated_tokens=500)),
            db: AsyncSession = Depends(get_db),
        ):
            ...
    """

    def __init__(self, estimated_tokens: int = 500):
        self.estimated_tokens = estimated_tokens

    async def __call__(self, request: Request, db: AsyncSession = Depends(get_db)):
        user_id_str = request.headers.get("X-User-ID") or request.query_params.get("user_id")
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Missing user identity (X-User-ID header)")

        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")

        allowed = await check_and_increment_usage(db, user_id, self.estimated_tokens, model="pre-check")
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "usage_limit_exceeded",
                    "message": "You have reached your monthly usage limit. Please upgrade your plan.",
                    "upgrade_url": "/billing/plans",
                },
            )
        return user_id


async def soft_usage_check(user_id: UUID, db: AsyncSession) -> dict:
    """
    Non-blocking check — returns usage status without incrementing.
    Use this to show warnings before a request, not to block it.
    """
    from sqlalchemy import select, text
    from datetime import date

    today = date.today()
    result = await db.execute(
        text("""
            SELECT u.plan,
                   us.tokens_used,
                   us.request_count,
                   pl.tokens_per_month,
                   pl.requests_per_month
            FROM users u
            LEFT JOIN usage us ON us.user_id = u.id
                AND us.period_start <= :today AND us.period_end >= :today
            LEFT JOIN plan_limits pl ON pl.plan = u.plan
            WHERE u.id = :uid
            LIMIT 1
        """),
        {"uid": str(user_id), "today": today},
    )
    row = result.fetchone()
    if not row:
        return {"status": "unknown"}

    tokens_pct = None
    if row.tokens_per_month and row.tokens_per_month != -1:
        tokens_pct = round(((row.tokens_used or 0) / row.tokens_per_month) * 100, 1)

    return {
        "plan": row.plan,
        "tokens_used": row.tokens_used or 0,
        "tokens_limit": row.tokens_per_month,
        "tokens_percent": tokens_pct,
        "near_limit": tokens_pct is not None and tokens_pct >= 80,
        "at_limit": tokens_pct is not None and tokens_pct >= 100,
    }