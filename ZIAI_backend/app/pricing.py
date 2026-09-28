# app/pricing.py
"""
Pure pricing math + fallback defaults.

Nothing in this file is the "live" value anymore — per-model rates live in
the ai_models DB table (app.services.model_service), and the settings below
(USD→NPR rate, trial sizes, guest-allowed models) are admin-configurable via
the app_settings table (app.services.settings_service). The DEFAULT_*
constants here only apply the very first time, before an admin has ever set
anything, or if a setting is ever missing.
"""

from decimal import Decimal


def calculate_cost_usd_from_rates(
    input_rate_per_million: Decimal,
    output_rate_per_million: Decimal,
    tokens_input: int,
    tokens_output: int,
) -> Decimal:
    """Pure cost calculation — caller supplies the per-model rates (from the DB)."""
    cost = (Decimal(tokens_input) / Decimal(1_000_000)) * Decimal(input_rate_per_million) \
         + (Decimal(tokens_output) / Decimal(1_000_000)) * Decimal(output_rate_per_million)
    return cost.quantize(Decimal("0.000001"))


def usd_to_npr(cost_usd: Decimal, rate: Decimal | None = None) -> Decimal:
    """
    Convert a USD cost into NPR. Pass the live admin-configured rate (via
    settings_service.get_usd_to_npr_rate) — falls back to DEFAULT_USD_TO_NPR
    only if the caller doesn't have one on hand.
    """
    effective_rate = rate if rate is not None else DEFAULT_USD_TO_NPR
    return (Decimal(cost_usd) * Decimal(effective_rate)).quantize(Decimal("0.01"))


# ── Fallback defaults (used until an admin configures real values) ─────────
DEFAULT_USD_TO_NPR = Decimal("135.00")

# Suggested default: ~$1 worth of tokens on a cheap model — generous enough
# for real evaluation but capped so it can't be used for production-scale
# free usage. Admin-editable via PUT /api/admin/settings/pricing.
DEFAULT_FREE_TRIAL_TOKENS = 300_000
FREE_TRIAL_MAX_REQUESTS = 50
FREE_TRIAL_MAX_DAYS = 7

# Guests get a smaller trial than signed-up users — auto-provisioned per
# browser, see auth_controller.guest_login.
DEFAULT_GUEST_TRIAL_TOKENS = 20_000

# Fallback if nothing's configured in app_settings yet.
GUEST_ALLOWED_MODELS = ["llama3"]
