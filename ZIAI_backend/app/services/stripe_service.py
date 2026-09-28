import os
import stripe
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv

load_dotenv()

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "usd").lower()
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

stripe.api_key = STRIPE_SECRET_KEY


def _ensure_stripe_secret() -> None:
    if not STRIPE_SECRET_KEY:
        raise RuntimeError("STRIPE_SECRET_KEY environment variable is not set")


def _build_price_data(amount: float, plan: str) -> dict:
    return {
        "currency": STRIPE_CURRENCY,
        "product_data": {
            "name": f"{plan.title()} Plan",
        },
        "unit_amount": int(round(amount * 100)),
    }


def _create_checkout_session(amount: float, plan: str, user_id: str) -> dict:
    _ensure_stripe_secret()

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": _build_price_data(amount, plan),
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=f"{BASE_URL}/api/billing/stripe/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{BASE_URL}/billing?payment=failed",
        metadata={"user_id": user_id, "plan": plan},
    )

    checkout_url = getattr(session, "url", None)
    if not checkout_url and hasattr(session, "get"):
        checkout_url = session.get("url")
    if not checkout_url and hasattr(session, "get"):
        checkout_url = session.get("checkout_url")
    if not checkout_url:
        raise RuntimeError("Stripe checkout session created but checkout URL is missing")

    session_id = getattr(session, "id", None)
    if not session_id and hasattr(session, "get"):
        session_id = session.get("id")
    if not session_id:
        raise RuntimeError("Stripe checkout session created but session ID is missing")

    return {
        "url": checkout_url,
        "checkout_url": checkout_url,
        "payment_url": checkout_url,
        "session_id": session_id,
    }


def _retrieve_checkout_session(session_id: str):
    _ensure_stripe_secret()
    return stripe.checkout.Session.retrieve(session_id, expand=["payment_intent"])


def is_stripe_payment_successful(session) -> bool:
    return getattr(session, "payment_status", "") == "paid"


def get_payment_intent_id(session) -> str | None:
    """
    session.payment_intent is a full expanded PaymentIntent object
    (because we requested expand=["payment_intent"]), not a string.
    This safely extracts the ID whether it's expanded or just a string.
    """
    payment_intent = getattr(session, "payment_intent", None)
    if payment_intent is None:
        return None
    if isinstance(payment_intent, str):
        return payment_intent
    return getattr(payment_intent, "id", None)


async def create_checkout_session(amount: float, plan: str, user_id: str) -> dict:
    return await run_in_threadpool(_create_checkout_session, amount, plan, user_id)


async def retrieve_checkout_session(session_id: str):
    return await run_in_threadpool(_retrieve_checkout_session, session_id)