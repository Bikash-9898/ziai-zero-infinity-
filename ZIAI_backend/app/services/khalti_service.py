import os
import uuid
import httpx
from dotenv import load_dotenv

load_dotenv()

KHALTI_SECRET = os.getenv("KHALTI_SECRET_KEY")
KHALTI_BASE_URL = os.getenv(
    "KHALTI_BASE_URL",
    "https://dev.khalti.com/api/v2"
)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def get_headers():
    if not KHALTI_SECRET:
        raise Exception("KHALTI_SECRET_KEY is missing")

    return {
        "Authorization": f"Key {KHALTI_SECRET}",
        "Content-Type": "application/json"
    }


async def initiate_khalti_payment(amount_npr: float, plan: str, user_id: str):

    payload = {
        "return_url": f"{BASE_URL}/api/billing/khalti/return",
        "website_url": FRONTEND_URL,
        "amount": int(amount_npr * 100),      # paisa
        "purchase_order_id": str(uuid.uuid4()),
        "purchase_order_name": f"{plan.title()} Plan",
        "customer_info": {
            "name": user_id,
            "email": "test@khalti.com",
            "phone": "9800000002"
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.post(
            f"{KHALTI_BASE_URL}/epayment/initiate/",
            json=payload,
            headers=get_headers()
        )

        print("STATUS :", response.status_code)
        print("BODY :", response.text)

        response.raise_for_status()

        return response.json()


async def verify_khalti_payment(pidx: str):

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.post(
            f"{KHALTI_BASE_URL}/epayment/lookup/",
            json={
                "pidx": pidx
            },
            headers=get_headers()
        )

        print(response.status_code)
        print(response.text)

        response.raise_for_status()

        return response.json()


def is_khalti_payment_successful(data: dict) -> bool:
    """Return True if Khalti verification response indicates a successful payment."""
    status = str(data.get("status", "") or "").lower()
    state = str(data.get("state", "") or "").lower()
    if status in {"completed", "success", "successful"}:
        return True
    if state in {"completed", "success", "successful"}:
        return True
    return False