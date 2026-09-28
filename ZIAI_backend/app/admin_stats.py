# app/admin_stats.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.usage_model import AiRequest
from app.Dependencies import require_admin  # ← avoids circular import with main.py

router = APIRouter()


@router.get("/api/admin/stats", dependencies=[Depends(require_admin)])
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    last_24h        = datetime.utcnow() - timedelta(hours=24)

    # COALESCE guards against NULL + NULL = NULL in postgres arithmetic
    total_tokens_result = await db.execute(
        select(
            func.sum(
                func.coalesce(AiRequest.tokens_input,  0) +
                func.coalesce(AiRequest.tokens_output, 0)
            )
        )
    )
    total_tokens = total_tokens_result.scalar() or 0

    new_users_result = await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= thirty_days_ago)
    )
    new_users = new_users_result.scalar() or 0

    active_reqs_result = await db.execute(
        select(func.count()).select_from(AiRequest).where(AiRequest.created_at >= last_24h)
    )
    active_reqs = active_reqs_result.scalar() or 0

    latency_result = await db.execute(
        select(AiRequest.model, func.avg(AiRequest.latency_ms)).group_by(AiRequest.model)
    )
    latency_list = [
        {"model": model, "avg_latency": round(float(avg), 1)}
        for model, avg in latency_result.all()
        if avg is not None
    ]

    return {
        "active_requests":  active_reqs,
        "total_tokens":     total_tokens,
        "new_users":        new_users,
        "quota_used":       total_tokens,
        "quota_max":        10_000_000,
        "model_latencies":  latency_list,
    }