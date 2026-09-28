# app/controllers/khalti_controller.py
"""
Handles Khalti payment operations:
- Initiate payment
- Handle return callback
- Verify payment (API)
"""

import os
import logging
from uuid import UUID

from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.payment import Payment
from app.services.khalti_service import (
	initiate_khalti_payment,
	verify_khalti_payment,
	is_khalti_payment_successful,
)
from app.services.billing_service import create_pending_payment, activate_subscription

log = logging.getLogger(__name__)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

PLAN_PRICES = {
	"basic": 299,
	"pro": 999,
	"enterprise": 2999,
}


async def initiate_payment(plan: str, user_id: str, db: AsyncSession) -> dict:
	"""Initiate a Khalti payment and create a pending Payment record."""
	if plan not in PLAN_PRICES:
		raise ValueError(f"Invalid plan '{plan}'")

	amount = PLAN_PRICES[plan]
	payload = await initiate_khalti_payment(amount, plan, user_id)

	await create_pending_payment(
		db=db,
		user_id=UUID(user_id),
		provider="khalti",
		plan=plan,
		amount=float(amount),
		ref_id=payload.get("pidx") or payload.get("transaction_uuid"),
	)

	return payload


async def handle_return(params: dict, db: AsyncSession) -> RedirectResponse:
	"""Handle Khalti return (frontend redirect) flow."""
	pidx = params.get("pidx") or params.get("payment_id")
	if not pidx:
		return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=missing_pidx", 302)

	payment_result = await db.execute(
		select(Payment).where(Payment.ref_id == pidx, Payment.status == "pending")
	)
	payment = payment_result.scalar_one_or_none()

	if not payment:
		result2 = await db.execute(select(Payment).where(Payment.ref_id == pidx))
		existing = result2.scalar_one_or_none()
		if existing and existing.status == "success":
			return RedirectResponse(f"{FRONTEND_URL}/billing?payment=success&plan={existing.plan}", 302)
		return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=payment_not_found", 302)

	try:
		verification = await verify_khalti_payment(pidx)
		if not is_khalti_payment_successful(verification):
			payment.status = "failed"
			await db.commit()
			return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason=payment_not_completed", 302)

		await activate_subscription(
			db=db,
			user_id=payment.user_id,
			plan=payment.plan,
			provider="khalti",
			transaction_id=pidx,
			amount=float(payment.amount),
		)
	except Exception as exc:
		log.error("Khalti return handling error: %s", exc)
		return RedirectResponse(f"{FRONTEND_URL}/billing?payment=failed&reason={str(exc)}", 302)

	return RedirectResponse(f"{FRONTEND_URL}/billing?payment=success&plan={payment.plan}", 302)


async def verify_payment(payload: dict, db: AsyncSession) -> dict:
	"""API endpoint-style verification: verify and activate subscription."""
	pidx = payload.get("pidx") or payload.get("transaction_uuid")
	if not pidx:
		return {"verified": False, "detail": "Missing pidx"}

	payment_result = await db.execute(
		select(Payment).where(Payment.ref_id == pidx, Payment.status == "pending")
	)
	payment = payment_result.scalar_one_or_none()
	if not payment:
		return {"verified": False, "detail": "No pending payment found for this transaction"}

	try:
		verification = await verify_khalti_payment(pidx)
		if not is_khalti_payment_successful(verification):
			return {"verified": False, "detail": "Khalti payment is not completed"}

		await activate_subscription(
			db=db,
			user_id=payment.user_id,
			plan=payment.plan,
			provider="khalti",
			transaction_id=pidx,
			amount=float(payment.amount),
		)
	except Exception as exc:
		log.error("Khalti verify error: %s", exc)
		return {"verified": False, "detail": str(exc)}

	return {"verified": True, "detail": "Khalti payment verified"}