# app/services/esewa_service.py

import hmac
import hashlib
import base64
import os
import uuid
import json

ESEWA_SECRET       = os.getenv("ESEWA_SECRET_KEY")
ESEWA_PRODUCT_CODE = os.getenv("ESEWA_PRODUCT_CODE")
ESEWA_BASE_URL     = os.getenv("ESEWA_BASE_URL", "https://rc-epay.esewa.com.np")


def _check_env():
    if not ESEWA_SECRET:
        raise RuntimeError("ESEWA_SECRET_KEY environment variable is not set")
    if not ESEWA_PRODUCT_CODE:
        raise RuntimeError("ESEWA_PRODUCT_CODE environment variable is not set")


def _sign(message: str) -> str:
    _check_env()
    key = ESEWA_SECRET.encode()  # type: ignore[union-attr]
    return base64.b64encode(
        hmac.new(key, message.encode(), hashlib.sha256).digest()
    ).decode()


def _fmt_amount(amount: float) -> str:
    """
    Format amount for the INITIATION payload (what we send TO eSewa).
    Used in build_esewa_payload and generate_esewa_signature only.

    NOTE: This is NOT used during verification — eSewa sends back the amount
    as "499.0" (always one decimal place) regardless of what we sent.
    During verification we use decoded["total_amount"] directly from the
    eSewa response instead of reformatting our stored amount.

    OLD BUG: _fmt_amount was also used in verify_esewa_signature for total_amount,
    producing "499" — which mismatched eSewa's "499.0", causing signature failure.
    """
    return str(int(amount)) if amount == int(amount) else str(amount)


def generate_esewa_signature(total_amount: float, transaction_uuid: str) -> str:
    """
    Generate HMAC-SHA256 signature for the INITIATION form payload.
    Uses 3 fields: total_amount, transaction_uuid, product_code.
    This is what we sign when sending the form TO eSewa.
    """
    _check_env()
    message = (
        f"total_amount={_fmt_amount(total_amount)},"
        f"transaction_uuid={transaction_uuid},"
        f"product_code={ESEWA_PRODUCT_CODE}"
    )
    return _sign(message)


def build_esewa_payload(amount: float, plan: str, user_id: str) -> dict:
    """
    Build the complete eSewa form POST payload.
    transaction_uuid is stored as ref_id in the payments table so the
    success callback can look up the pending payment.
    """
    _check_env()

    transaction_uuid = str(uuid.uuid4())
    signature        = generate_esewa_signature(amount, transaction_uuid)
    base_url         = os.getenv("BASE_URL", "http://localhost:8000")

    return {
        "form_url": f"{ESEWA_BASE_URL}/api/epay/main/v2/form",
        "payload": {
            "amount":                  _fmt_amount(amount),
            "tax_amount":              "0",
            "total_amount":            _fmt_amount(amount),
            "transaction_uuid":        transaction_uuid,
            "product_code":            ESEWA_PRODUCT_CODE,
            "product_service_charge":  "0",
            "product_delivery_charge": "0",
            "success_url":             f"{base_url}/api/billing/esewa/success",
            "failure_url":             f"{base_url}/api/billing/esewa/failure",
            "signed_field_names":      "total_amount,transaction_uuid,product_code",
            "signature":               signature,
        },
        "transaction_uuid": transaction_uuid,
        "metadata": {"plan": plan, "user_id": user_id},
    }


def decode_esewa_response(params: dict) -> dict:
    """Decode the base64 JSON that eSewa sends in the ?data= query param."""
    decoded = base64.b64decode(params["data"]).decode()
    return json.loads(decoded)


def verify_esewa_signature(decoded: dict, stored_amount: float) -> bool:
    """
    Verify the HMAC-SHA256 signature on eSewa's success callback response.

    KEY RULE: Read signed_field_names FROM the decoded response — eSewa
    signs 6 fields on the response (transaction_code, status, total_amount,
    transaction_uuid, product_code, signed_field_names), not the 3 fields
    we used at initiation.

    FIX: For total_amount, use decoded["total_amount"] directly — the raw
    string eSewa put in its response ("499.0") — NOT _fmt_amount(stored_amount)
    which produces "499". eSewa always signs with its own formatted value.

    stored_amount is still used as a sanity check to confirm the amount
    eSewa claims matches what we stored — preventing amount tampering.

    OLD CODE (broken):
        if field == "total_amount":
            val = _fmt_amount(float(stored_amount))   # produces "499", mismatch!
        else:
            val = str(decoded.get(field, ""))

    NEW CODE (correct):
        val = str(decoded.get(field, ""))   # uses "499.0" as-is from eSewa
        # then separately confirm amount matches stored value
    """
    _check_env()
    try:
        if decoded.get("status") != "COMPLETE":
            return False

        signed_field_names = decoded.get("signed_field_names", "")
        if not signed_field_names:
            return False

        fields = [f.strip() for f in signed_field_names.split(",")]

        # FIX: Use all field values directly from the decoded response.
        # This includes total_amount as "499.0" — exactly what eSewa signed.
        # OLD CODE used _fmt_amount(stored_amount) for total_amount → "499" → mismatch.
        parts        = [f"{field}={decoded.get(field, '')}" for field in fields]
        message      = ",".join(parts)
        expected_sig = _sign(message)
        actual_sig   = decoded.get("signature", "")

        if not hmac.compare_digest(expected_sig, actual_sig):
            return False

        # Sanity check: confirm eSewa's claimed amount matches what we stored.
        # Guards against replaying a valid signature for a different amount.
        # Compare as floats so "499.0" == 499.0 works correctly.
        esewa_amount = float(decoded.get("total_amount", 0))
        if abs(esewa_amount - stored_amount) > 0.01:
            return False

        return True

    except Exception:
        return False
