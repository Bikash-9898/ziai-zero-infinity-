# app/services/wallet_service.py
"""
Pay-as-you-go wallet logic.

Spend order for every request:
  1. Burn from trial_tokens_remaining first (free trial, tracked in raw tokens)
  2. Once trial is exhausted, deduct cost (NPR) from credit_balance
  3. If credit_balance would go negative, the request should be blocked
     BEFORE calling the AI provider — see has_sufficient_balance().

Every balance change writes a CreditTransaction row so the ledger is
auditable (this is what "usage limitation" and billing accuracy depend on).
"""

import uuid
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.wallet import CreditTransaction
from app.pricing import calculate_cost_usd_from_rates, usd_to_npr
from app.services import model_service
from app.services import settings_service


async def _calculate_cost_npr(db: AsyncSession, model_key: str, tokens_input: int, tokens_output: int) -> Decimal:
    """Look up the model's rates in the DB and convert to NPR using the live admin-set FX rate."""
    model_cfg = await model_service.get_model(db, model_key)
    if not model_cfg:
        model_cfg = await model_service.get_model(db, model_service.DEFAULT_MODEL_ID)

    cost_usd = calculate_cost_usd_from_rates(
        model_cfg.input_price_per_million if model_cfg else Decimal("1.00"),
        model_cfg.output_price_per_million if model_cfg else Decimal("5.00"),
        tokens_input,
        tokens_output,
    )
    rate = await settings_service.get_usd_to_npr_rate(db)
    return usd_to_npr(cost_usd, rate)


async def get_wallet_status(db: AsyncSession, user_id: UUID) -> dict | None:
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        return None
    trial_total = (
        await settings_service.get_guest_trial_tokens(db)
        if getattr(user, "is_guest", False)
        else await settings_service.get_free_trial_tokens(db)
    )
    return {
        "user_id":                str(user.id),
        "trial_tokens_remaining":  user.trial_tokens_remaining,
        "trial_tokens_total":      trial_total,
        "on_trial":                user.trial_tokens_remaining > 0,
        "credit_balance":          float(user.credit_balance),
    }


async def has_sufficient_balance(
    db: AsyncSession,
    user: User,
    estimated_tokens_input: int,
    estimated_tokens_output: int,
    model_key: str,
) -> bool:
    """
    Pre-flight check before calling the AI provider. If the user still has
    trial tokens, always allow (trial covers it, even if it dips negative on
    the last request — acceptable since trial budgets are small).
    Otherwise require a positive credit balance covering the estimated cost.
    """
    if user.trial_tokens_remaining > 0:
        return True

    estimated_cost = await _calculate_cost_npr(db, model_key, estimated_tokens_input, estimated_tokens_output)
    return user.credit_balance >= estimated_cost


async def deduct_for_usage(
    user_id: UUID,
    model_key: str,
    tokens_input: int,
    tokens_output: int,
    related_request_id: UUID | None = None,
    db: AsyncSession | None = None,
) -> dict:
    """
    Called after a completed AI request. If db is not provided, opens its
    own session — this is the required pattern for background tasks, since
    FastAPI closes the request session as soon as the response is sent
    (see chat_controller._write_usage for the same fix applied there).
    Burns trial tokens first, then falls back to credit_balance for overflow.
    Returns the updated wallet state.
    """
    if db is None:
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as owned_db:
            return await deduct_for_usage(
                user_id=user_id,
                model_key=model_key,
                tokens_input=tokens_input,
                tokens_output=tokens_output,
                related_request_id=related_request_id,
                db=owned_db,
            )

    # FOR UPDATE locks this user's row until commit, so two concurrent
    # requests can't both read the same balance and both deduct against it
    # (the second one to arrive here blocks until the first commits, then
    # sees the already-updated balance). This is the actual guard against
    # double-spend on concurrent requests — the pre-flight check in
    # has_sufficient_balance() is only a fast, unlocked first pass.
    user = (await db.execute(
        select(User).where(User.id == user_id).with_for_update()
    )).scalar_one_or_none()
    if not user:
        return {"error": "user not found"}

    total_tokens = tokens_input + tokens_output
    cost_npr = await _calculate_cost_npr(db, model_key, tokens_input, tokens_output)

    if user.trial_tokens_remaining > 0:
        # Burn trial tokens; if this request exceeds what's left, the
        # remainder is billed against credit_balance.
        covered_by_trial = min(user.trial_tokens_remaining, total_tokens)
        overflow_tokens   = total_tokens - covered_by_trial
        user.trial_tokens_remaining -= covered_by_trial

        db.add(CreditTransaction(
            id=uuid.uuid4(),
            user_id=user_id,
            type="trial_usage",
            amount=Decimal("0.00"),
            balance_after=user.credit_balance,
            related_request_id=related_request_id,
            description=f"Trial tokens used: {covered_by_trial} (model={model_key})",
        ))

        if overflow_tokens > 0:
            # Proportional overflow cost — rough but fair.
            overflow_ratio = overflow_tokens / total_tokens if total_tokens else 0
            overflow_cost = (cost_npr * Decimal(overflow_ratio)).quantize(Decimal("0.01"))
            user.credit_balance -= overflow_cost
            db.add(CreditTransaction(
                id=uuid.uuid4(),
                user_id=user_id,
                type="deduction",
                amount=-overflow_cost,
                balance_after=user.credit_balance,
                related_request_id=related_request_id,
                description=f"Trial exhausted mid-request, {overflow_tokens} tokens billed (model={model_key})",
            ))
    else:
        user.credit_balance -= cost_npr
        db.add(CreditTransaction(
            id=uuid.uuid4(),
            user_id=user_id,
            type="deduction",
            amount=-cost_npr,
            balance_after=user.credit_balance,
            related_request_id=related_request_id,
            description=f"{total_tokens} tokens (model={model_key})",
        ))

    await db.commit()

    return {
        "trial_tokens_remaining": user.trial_tokens_remaining,
        "credit_balance":         float(user.credit_balance),
        "cost_npr":               float(cost_npr),
    }


async def add_credits(
    db: AsyncSession,
    user_id: UUID,
    amount_npr: Decimal,
    source: str = "topup",
    description: str | None = None,
) -> dict:
    """
    Top up a user's wallet. Call this after a successful eSewa/Khalti
    payment (amount_npr = payment.amount), or manually from the admin panel.
    """
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        return {"error": "user not found"}

    user.credit_balance += amount_npr
    db.add(CreditTransaction(
        id=uuid.uuid4(),
        user_id=user_id,
        type=source,
        amount=amount_npr,
        balance_after=user.credit_balance,
        description=description or f"Wallet top-up via {source}",
    ))
    await db.commit()

    return {"credit_balance": float(user.credit_balance)}
