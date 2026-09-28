# app/services/routing_service.py
"""
Context-based chat routing ("Auto" model).

When a user sends a message with model == AUTO_MODEL_ID, chat_controller
calls route_message() instead of using their raw model choice. This picks
a real ai_models.id to actually call, using a hybrid classifier:

  1. Heuristics score the message for difficulty (length, code blocks,
     keyword signals, conversation depth) — instant, free, no network call.
  2. If the heuristic score lands in a confident zone, we trust it and
     stop there (this is the overwhelming majority of messages).
  3. If the score is ambiguous (near a tier boundary), we fall back to a
     single cheap classification call on a "fast" tier model to break the
     tie — this only fires for genuinely unclear cases.

Difficulty -> capability tier -> model:
  simple  -> "fast"      (cheapest models that can still answer well)
  medium  -> "balanced"
  complex -> "flagship"

The user's plan caps how high routing is allowed to reach (see PLAN_TIER_CAP)
so a free-tier user asking a "complex" question gets routed to the best
tier they're allowed, not necessarily the most expensive model that exists —
this folds importance/tier and cost-optimization into the same lookup.
"""

import re
import logging
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services import model_service
from app.services.model_service import TIER_ORDER

logger = logging.getLogger(__name__)

AUTO_MODEL_ID = "auto"

# Difficulty tier a message maps to by default.
DIFFICULTY_TO_TIER = {
    "simple":  "fast",
    "medium":  "balanced",
    "complex": "flagship",
}

# Highest capability tier each plan is allowed to be auto-routed into.
# Free/basic users asking a "complex" question still get routed to the best
# tier they're eligible for rather than being blocked — they just don't
# reach "flagship". Tune freely; this doesn't touch the wallet/billing checks,
# which still run normally against whatever model is finally chosen.
PLAN_TIER_CAP = {
    "free":       "balanced",
    "basic":      "balanced",
    "pro":        "flagship",
    "enterprise": "flagship",
}
DEFAULT_PLAN_TIER_CAP = "balanced"

# ── Heuristic signal keywords ───────────────────────────────────────────────

_COMPLEX_PATTERNS = [
    r"\bexplain in detail\b", r"\bstep by step\b", r"\barchitecture\b",
    r"\balgorithm\b", r"\bprove\b", r"\bderive\b", r"\boptimi[sz]e\b",
    r"\brefactor\b", r"\bdebug\b", r"\banaly[sz]e\b", r"\bcompare and contrast\b",
    r"\bwrite (a|an) (essay|report|paper)\b", r"\bcomprehensive\b",
    r"\bin depth\b", r"\bwhy does\b", r"\bhow does\b.*\bwork\b",
    r"\bdesign a\b", r"\bpros and cons\b", r"\btrade-?offs?\b",
    r"\bmulti-?step\b", r"\bedge cases?\b",
]
_SIMPLE_PATTERNS = [
    r"^\s*(hi|hello|hey|yo)\b", r"\bthanks?\b", r"\bthank you\b",
    r"^\s*(ok|okay|cool|got it|sure)\s*[!.]?\s*$", r"\bwhat is\b",
    r"\bdefine\b", r"\btranslate\b", r"^\s*(yes|no)\s*[!.]?\s*$",
]

_COMPLEX_RE = re.compile("|".join(_COMPLEX_PATTERNS), re.IGNORECASE)
_SIMPLE_RE  = re.compile("|".join(_SIMPLE_PATTERNS), re.IGNORECASE)


@dataclass
class ClassificationResult:
    difficulty: str      # "simple" | "medium" | "complex"
    confidence: str      # "heuristic" | "llm_fallback"
    score: float


def _heuristic_score(message: str, history_len: int) -> float:
    """Higher score = harder question. Roughly centered so ~0 is 'medium'."""
    text = message.strip()
    score = 0.0

    length = len(text)
    if length < 60:
        score -= 2
    elif length < 300:
        score += 0
    elif length < 800:
        score += 2
    else:
        score += 4

    if "```" in text:
        score += 3

    complex_hits = len(_COMPLEX_RE.findall(text))
    score += min(complex_hits, 3) * 1.5

    simple_hits = len(_SIMPLE_RE.findall(text))
    if length < 200:
        score -= min(simple_hits, 2) * 2

    question_marks = text.count("?")
    if question_marks > 1:
        score += question_marks - 1

    # Deep conversations tend to carry more context/nuance to track.
    if history_len > 20:
        score += 1

    return score


def _score_to_difficulty(score: float) -> tuple[str, bool]:
    """Returns (difficulty, is_confident). Ambiguous band is [-0.5, 2.5]
    on either side of the two cut points (0 and 3) — deliberately wide so
    the LLM fallback only fires on genuinely borderline cases."""
    if score < -0.5:
        return "simple", True
    if score > 3.5:
        return "complex", True
    if -0.5 <= score <= 0.5 or 2.5 <= score <= 3.5:
        # right on a boundary — ambiguous
        return ("simple" if score < 2 else "complex"), False
    return "medium", True


async def _llm_classify(db: AsyncSession, message: str) -> str | None:
    """Single cheap-model call to break a tie the heuristics couldn't
    resolve confidently. Returns None (caller falls back to heuristics)
    on any failure — this must never break the chat flow."""
    try:
        from app.services import model_service as _ms
        fast_models = await _ms.list_models_by_tier(db, "fast")
        if not fast_models:
            return None
        classifier_model = fast_models[0]

        from app.services.ai_service import _sync_call
        import asyncio
        from functools import partial

        prompt = [
            {"role": "system", "content": (
                "Classify the difficulty of the user's message as exactly one "
                "word: simple, medium, or complex. simple = greetings, small "
                "talk, one-line factual lookups. medium = normal questions "
                "needing some explanation. complex = multi-step reasoning, "
                "code, math, deep analysis, or long structured output. "
                "Reply with only the single word."
            )},
            {"role": "user", "content": message[:2000]},
        ]

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            partial(_sync_call, classifier_model.provider, classifier_model.provider_model_id, prompt, 5),
        )
        answer = (result.get("content") or "").strip().lower()
        for tier_word in ("simple", "medium", "complex"):
            if tier_word in answer:
                return tier_word
        return None
    except Exception as e:
        logger.warning("routing_service: LLM fallback classification failed: %s", e)
        return None


async def classify_difficulty(db: AsyncSession, message: str, history_len: int = 0) -> ClassificationResult:
    score = _heuristic_score(message, history_len)
    difficulty, confident = _score_to_difficulty(score)

    if confident:
        return ClassificationResult(difficulty=difficulty, confidence="heuristic", score=score)

    llm_result = await _llm_classify(db, message)
    if llm_result:
        return ClassificationResult(difficulty=llm_result, confidence="llm_fallback", score=score)

    # LLM fallback failed — trust the heuristic's best guess rather than fail the request.
    return ClassificationResult(difficulty=difficulty, confidence="heuristic", score=score)


def _effective_tier(difficulty: str, user_plan: str) -> str:
    """Difficulty says what the message needs; the plan caps how high we're
    allowed to reach. min() over TIER_ORDER indices picks the lower of the two."""
    needed = DIFFICULTY_TO_TIER.get(difficulty, "balanced")
    cap = PLAN_TIER_CAP.get(user_plan, DEFAULT_PLAN_TIER_CAP)

    needed_idx = TIER_ORDER.index(needed) if needed in TIER_ORDER else 1
    cap_idx    = TIER_ORDER.index(cap) if cap in TIER_ORDER else 1
    return TIER_ORDER[min(needed_idx, cap_idx)]


async def _pick_model_for_tier(db: AsyncSession, tier: str):
    """Cheapest active model in `tier`; if that tier is empty (e.g. admin
    hasn't tagged any models that way yet), step down through weaker tiers
    before finally falling back to the global default model."""
    tier_idx = TIER_ORDER.index(tier) if tier in TIER_ORDER else 1
    for idx in range(tier_idx, -1, -1):
        candidates = await model_service.list_models_by_tier(db, TIER_ORDER[idx])
        if candidates:
            return candidates[0]
    # Nothing tagged at all — last resort, the global default.
    return await model_service.get_model(db, model_service.DEFAULT_MODEL_ID)


async def route_message(db: AsyncSession, message: str, user: User, history_len: int = 0) -> dict:
    """
    Called by chat_controller when model == AUTO_MODEL_ID.
    Returns {"model_id", "difficulty", "tier", "method"} — model_id is the
    real ai_models.id to actually call; the rest is for logging/response.
    """
    result = await classify_difficulty(db, message, history_len)
    tier = _effective_tier(result.difficulty, getattr(user, "plan", "free"))
    model_row = await _pick_model_for_tier(db, tier)

    if not model_row:
        raise Exception("No AI models configured — cannot auto-route")

    return {
        "model_id":   model_row.id,
        "difficulty": result.difficulty,
        "tier":       tier,
        "method":     result.confidence,
    }
