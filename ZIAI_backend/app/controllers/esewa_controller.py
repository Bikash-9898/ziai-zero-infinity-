# app/controllers/esewa_controller.py
"""
Handles eSewa payment operations:
- Initiate payment
- Handle success callback
- Handle failure callback
- Debug callback (dev only)
"""

import os
import logging
from uuid import UUID

from fastapi import HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.payment import Payment
from app.services.esewa_service import (
    build_esewa_payload,
    verify_esewa_signature,
    decode_esewa_response,
)
from app.services.billing_service import create_pending_payment, activate_subscription
from app.services.wallet_service import add_credits

log          = logging.getLogger(__name__)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DEBUG_ENABLED = os.getenv("ESEWA_DEBUG", "false").lower() == "true"

PLAN_PRICES = {
    "basic":      299,
    "pro":        999,
    "enterprise": 2999,
}

# Special "plan" value used for wallet top-ups. Kept distinct from the
# subscription plans above so handle_success can branch cleanly.
WALLET_TOPUP_PLAN = "wallet_topup"
MIN_TOPUP_NPR = 100
MAX_TOPUP_NPR = 50_000


# ── Initiate Wallet Top-up ────────────────────────────────────────────────────

async def initiate_wallet_topup(amount_npr: float, user_id: str, db: AsyncSession) -> dict:
    """
    Build eSewa form payload for a pay-as-you-go wallet top-up (arbitrary
    amount, not tied to a fixed subscription plan).
    Called by: POST /api/billing/esewa/topup/initiate
    """
    if amount_npr < MIN_TOPUP_NPR or amount_npr > MAX_TOPUP_NPR:
        raise HTTPException(
            status_code=400,
            detail=f"Top-up amount must be between NPR {MIN_TOPUP_NPR} and {MAX_TOPUP_NPR}",
        )

    payload_data = build_esewa_payload(amount_npr, WALLET_TOPUP_PLAN, user_id)

    await create_pending_payment(
        db=db,
        user_id=UUID(user_id),
        provider="esewa",
        plan=WALLET_TOPUP_PLAN,
        amount=amount_npr,
        ref_id=payload_data["transaction_uuid"],
    )
    return payload_data


# ── Initiate Payment ──────────────────────────────────────────────────────────

async def initiate_payment(plan: str, user_id: str, db: AsyncSession) -> dict:
    """
    Build eSewa form payload and create a pending payment record.
    Called by: POST /api/billing/esewa/initiate
    """
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail=f"Invalid plan '{plan}'")

    payload_data = build_esewa_payload(PLAN_PRICES[plan], plan, user_id)

    await create_pending_payment(
        db=db,
        user_id=UUID(user_id),
        provider="esewa",
        plan=plan,
        amount=float(PLAN_PRICES[plan]),
        ref_id=payload_data["transaction_uuid"],
    )
    return payload_data


# ── Success Callback ──────────────────────────────────────────────────────────

async def handle_success(params: dict, db: AsyncSession) -> RedirectResponse:
    """
    Verify eSewa signature, activate subscription, redirect frontend.
    Called by: GET /api/billing/esewa/success
    """
    if "data" not in params:
        return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=missing_data", 302)

    try:
        decoded = decode_esewa_response(params)
    except Exception as e:
        log.error("eSewa decode error: %s", e)
        return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=decode_error", 302)

    transaction_uuid = decoded.get("transaction_uuid")
    if not transaction_uuid:
        return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=missing_uuid", 302)

    # Load pending payment
    result = await db.execute(
        select(Payment).where(
            Payment.ref_id == transaction_uuid,
            Payment.status == "pending",
        )
    )
    payment = result.scalar_one_or_none()

    # Handle duplicate callback — already processed
    if not payment:
        result2  = await db.execute(select(Payment).where(Payment.ref_id == transaction_uuid))
        existing = result2.scalar_one_or_none()
        if existing and existing.status == "success":
            return RedirectResponse(
                f"{FRONTEND_URL}/billing?payment=success&plan={existing.plan}", 302
            )
        log.warning("No pending payment for transaction_uuid=%s", transaction_uuid)
        return RedirectResponse(
            f"{FRONTEND_URL}/billing?payment=failed&reason=payment_not_found", 302
        )

    log.info("Found payment: id=%s amount=%s plan=%s", payment.id, payment.amount, payment.plan)

    # Verify eSewa signature
    if not verify_esewa_signature(decoded, float(payment.amount)):
        log.error("Signature mismatch. decoded=%s stored_amount=%s", decoded, float(payment.amount))
        return RedirectResponse(
            f"{FRONTEND_URL}/billing?payment=failed&reason=invalid_signature", 302
        )

    # Wallet top-up: credit the wallet directly, skip subscription activation.
    if payment.plan == WALLET_TOPUP_PLAN:
        from decimal import Decimal
        payment.status         = "success"
        payment.transaction_id = decoded.get("transaction_code", transaction_uuid)
        payment.verified_at    = __import__("datetime").datetime.utcnow()
        await db.commit()

        await add_credits(
            db=db,
            user_id=payment.user_id,
            amount_npr=Decimal(str(payment.amount)),
            source="topup",
            description=f"eSewa top-up, txn={payment.transaction_id}",
        )
        log.info("Wallet topped up: user=%s amount=%s", payment.user_id, payment.amount)
        return RedirectResponse(
            f"{FRONTEND_URL}/billing?payment=success&topup={payment.amount}", 302
        )

    # Activate subscription using eSewa's real transaction_code
    try:
        await activate_subscription(
            db=db,
            user_id=payment.user_id,
            plan=payment.plan,
            provider="esewa",
            transaction_id=decoded.get("transaction_code", transaction_uuid),
            amount=float(payment.amount),
        )
    except ValueError as e:
        log.error("activate_subscription error: %s", e)
        return RedirectResponse(
            f"{FRONTEND_URL}/billing?payment=failed&reason={str(e)}", 302
        )

    log.info("Payment activated: user=%s plan=%s", payment.user_id, payment.plan)
    return RedirectResponse(
        f"{FRONTEND_URL}/billing?payment=success&plan={payment.plan}", 302
    )


# ── Failure Callback ──────────────────────────────────────────────────────────

async def handle_failure(params: dict, db: AsyncSession) -> RedirectResponse:
    """
    Mark pending payment as failed, redirect frontend.
    Called by: GET /api/billing/esewa/failure
    """
    if params.get("data"):
        try:
            decoded          = decode_esewa_response(params)
            transaction_uuid = decoded.get("transaction_uuid")
            if transaction_uuid:
                result = await db.execute(
                    select(Payment).where(
                        Payment.ref_id == transaction_uuid,
                        Payment.status == "pending",
                    )
                )
                payment = result.scalar_one_or_none()
                if payment:
                    payment.status = "failed"
                    await db.commit()
        except Exception as e:
            log.error("eSewa failure callback error: %s", e)

    return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed", 302)


# ── Debug Callback ────────────────────────────────────────────────────────────

async def handle_debug(params: dict) -> JSONResponse:
    """
    Inspect eSewa's raw callback — only active when ESEWA_DEBUG=true.
    Called by: GET /api/billing/esewa/debug
    """
    if not DEBUG_ENABLED:
        return JSONResponse(
            {"error": "Debug endpoint disabled. Set ESEWA_DEBUG=true to enable."},
            status_code=403,
        )

    import json as _json
    import base64 as _b64
    from app.services.esewa_service import _sign

    result: dict = {"raw_params": params}

    if "data" in params:
        try:
            raw     = _b64.b64decode(params["data"]).decode()
            decoded = _json.loads(raw)
            result["decoded"] = decoded

            total_amount  = decoded.get("total_amount", "")
            signed_fields = decoded.get(
                "signed_field_names",
                "total_amount,transaction_uuid,product_code",
            )
            fields = [f.strip() for f in signed_fields.split(",")]

            for amt_str in [
                total_amount,
                str(int(float(total_amount))),
                f"{float(total_amount):.2f}",
            ]:
                parts = [
                    f"{f}={amt_str if f == 'total_amount' else decoded.get(f, '')}"
                    for f in fields
                ]
                msg = ",".join(parts)
                sig = _sign(msg)
                result[f"sig_attempt_amount={amt_str}"] = {
                    "message":  msg,
                    "computed": sig,
                    "actual":   decoded.get("signature"),
                    "match":    sig == decoded.get("signature"),
                }
        except Exception as e:
            result["error"] = str(e)

    return JSONResponse(result)