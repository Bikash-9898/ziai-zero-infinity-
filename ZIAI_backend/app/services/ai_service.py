# app/services/ai_service.py
"""
AI service — supports HuggingFace, OpenAI (ChatGPT), and Anthropic (Claude).

Sync calls are run inside a thread-pool executor so they never block
the FastAPI async event loop.

Model routing + pricing now come from the ai_models DB table (see
app.services.model_service) instead of a hardcoded dict — this is what
lets admins add/reprice/disable models without a deploy.
"""
import asyncio
import base64
import os
import re
from decimal import Decimal
from functools import partial

from sqlalchemy.ext.asyncio import AsyncSession

from app.pricing import calculate_cost_usd_from_rates
from app.services import api_key_service, model_service
from app.services.voice_prompt import PromptBuilder

# ── HuggingFace ───────────────────────────────────────────────────────────────
from huggingface_hub import InferenceClient

_hf_clients: dict[str, InferenceClient] = {}


def _get_hf_client(api_key: str | None) -> InferenceClient:
    key = api_key or os.getenv("HF_API_KEY")
    if key not in _hf_clients:
        _hf_clients[key] = InferenceClient(provider="auto", api_key=key)
    return _hf_clients[key]

# ── OpenAI (via LangChain) ──────────────────────────────────────────────────
# https://docs.langchain.com/oss/python/integrations/chat/openai
from langchain_openai import ChatOpenAI

# Clients are cached by (model_id, api_key) so an admin rotating the key in
# the api_keys table takes effect on the next request without a restart.
_openai_llms: dict[tuple[str, str], ChatOpenAI] = {}


def _get_openai_llm(model_id: str, api_key: str | None = None) -> ChatOpenAI:
    key = api_key or os.getenv("OPENAI_API_KEY") or ""
    cache_key = (model_id, key)
    if cache_key not in _openai_llms:
        _openai_llms[cache_key] = ChatOpenAI(
            model=model_id,
            api_key=key,
            # stream_usage=True,   # not needed here — we call .invoke(), not .stream()
            # max_retries=2,
            # base_url="...",     # only if routing through a proxy/gateway
        )
    return _openai_llms[cache_key]

# ── Anthropic ─────────────────────────────────────────────────────────────────
import anthropic

_anthropic_clients: dict[str, anthropic.Anthropic] = {}


def _get_anthropic_client(api_key: str | None = None) -> anthropic.Anthropic:
    key = api_key or os.getenv("ANTHROPIC_API_KEY") or ""
    if key not in _anthropic_clients:
        _anthropic_clients[key] = anthropic.Anthropic(api_key=key)
    return _anthropic_clients[key]

# ── Google (Gemini, via LangChain) ──────────────────────────────────────────
from langchain_google_genai import ChatGoogleGenerativeAI

_google_llms: dict[tuple[str, str], ChatGoogleGenerativeAI] = {}


def _get_google_llm(model_id: str, api_key: str | None = None) -> ChatGoogleGenerativeAI:
    key = api_key or os.getenv("GOOGLE_API_KEY") or ""
    cache_key = (model_id, key)
    if cache_key not in _google_llms:
        _google_llms[cache_key] = ChatGoogleGenerativeAI(
            model=model_id,
            google_api_key=key,
            max_retries=2,
        )
    return _google_llms[cache_key]

# ── NVIDIA (NIM, OpenAI-compatible endpoint) ─────────────────────────────────
from openai import OpenAI

NVIDIA_DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"

_nvidia_clients: dict[str, OpenAI] = {}


def _get_nvidia_client(api_key: str | None = None) -> OpenAI:
    key = api_key or os.getenv("NVIDIA_API_KEY") or ""
    if key not in _nvidia_clients:
        _nvidia_clients[key] = OpenAI(
            base_url=os.getenv("NVIDIA_BASE_URL", NVIDIA_DEFAULT_BASE_URL),
            api_key=key,
        )
    return _nvidia_clients[key]

DEFAULT_MODEL = model_service.DEFAULT_MODEL_ID  # "llama3"

_voice_prompt_builder = PromptBuilder()


def build_voice_prompt(user_message: str, language: str = "en", recent_messages: list | None = None) -> str:
    """Create a compact prompt intended for voice-mode conversations
    (used by app.routers.voice_router)."""
    return _voice_prompt_builder.build(
        user_message=user_message,
        language=language,
        recent_messages=recent_messages,
    )


# ── Library attachment extraction ─────────────────────────────────────────────
# Chat messages can reference files a user uploaded via the Library feature
# (app.routers.library_router) as markdown links/images pointing at
# /uploads/<file>. Before sending a user turn to a provider, pull the text
# out of any referenced PDF/TXT/CSV and collect any referenced images so
# vision-capable models can see them.

_DOC_LINK_RE = re.compile(r'\[.*?\]\((?:https?://[^/]+)?/uploads/([^)]+\.(?:pdf|txt|csv))\)')
_IMG_LINK_RE = re.compile(r'!\[.*?\]\((?:https?://[^/]+)?/uploads/([^)]+\.(?:png|jpg|jpeg|webp|gif))\)')


def _extract_text_from_documents(content: str) -> str:
    """Appends extracted PDF/TXT/CSV text for any /uploads/ links found in content."""
    docs_text = []

    def replacer(match):
        filename = match.group(1)
        filepath = os.path.join("uploads", filename)
        if os.path.exists(filepath):
            ext = os.path.splitext(filename)[1].lower()
            try:
                if ext == ".pdf":
                    import fitz  # PyMuPDF
                    doc = fitz.open(filepath)
                    text = "\n".join(page.get_text() for page in doc)
                    docs_text.append(f"\n\n--- Contents of {filename} ---\n{text[:15000]}\n--- End of {filename} ---")
                elif ext in (".txt", ".csv"):
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        docs_text.append(f"\n\n--- Contents of {filename} ---\n{f.read()[:15000]}\n--- End of {filename} ---")
            except Exception:
                pass
        return match.group(0)  # keep the link visible in the prompt

    new_content = _DOC_LINK_RE.sub(replacer, content)
    if docs_text:
        new_content += "".join(docs_text)
    return new_content


def _extract_images_from_content(content: str):
    """Returns (text_without_image_markdown, [{'media_type','data'} ...])."""
    images = []

    def replacer(match):
        filename = match.group(1)
        filepath = os.path.join("uploads", filename)
        if os.path.exists(filepath):
            with open(filepath, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")
                ext = os.path.splitext(filename)[1].lower().strip(".")
                if ext == "jpg":
                    ext = "jpeg"
                images.append({"media_type": f"image/{ext}", "data": encoded})
        return ""

    new_content = _IMG_LINK_RE.sub(replacer, content)
    return new_content.strip(), images


def _process_messages_for_provider(provider: str, messages: list, model_cfg=None) -> list:
    """Resolves /uploads/ attachment links in user turns into inline text/image
    content, shaped per-provider. Uses model_cfg.supports_images to decide
    whether to forward images as vision content blocks or drop them with an
    informative note for the user."""
    processed = []
    for m in messages:
        if m["role"] != "user":
            processed.append(m)
            continue

        content_with_docs = _extract_text_from_documents(m["content"])
        text, images = _extract_images_from_content(content_with_docs)

        if not images:
            processed.append({"role": "user", "content": text or "..."})
            continue

        # Check the model's supports_images flag first, fall back to provider
        has_vision = False
        if model_cfg is not None:
            has_vision = getattr(model_cfg, "supports_images", False)
        else:
            # Fallback: infer from provider when model_cfg isn't available
            has_vision = provider in ("openai", "anthropic", "google")

        if has_vision:
            if provider == "anthropic":
                content_array = []
                for img in images:
                    content_array.append({
                        "type": "image",
                        "source": {"type": "base64", "media_type": img["media_type"], "data": img["data"]},
                    })
                if text:
                    content_array.append({"type": "text", "text": text})
                processed.append({"role": "user", "content": content_array})
            elif provider in ("openai", "google"):
                content_array = [{"type": "text", "text": text}] if text else []
                for img in images:
                    content_array.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{img['media_type']};base64,{img['data']}"},
                    })
                processed.append({"role": "user", "content": content_array})
            else:
                # Vision-capable provider we don't have a specific handler for
                processed.append({"role": "user", "content": text or "..."})
        else:
            # Model doesn't support images — inform the user clearly
            model_label = getattr(model_cfg, "label", None) or getattr(model_cfg, "id", "this model")
            note = (
                f"\n\n[System Note: You attached {len(images)} image(s), but **{model_label}** "
                f"does not support image input. To analyze images, switch to a vision-capable "
                f"model (e.g. GPT-4o, Claude, or Gemini) via the Model Selector.]"
            )
            processed.append({"role": "user", "content": (text or "...") + note})

    return processed


# ── Provider-specific sync calls ──────────────────────────────────────────────

def _call_huggingface(model_id: str, messages: list, max_tokens: int = 1024, api_key: str | None = None) -> dict:
    response = _get_hf_client(api_key).chat.completions.create(
        model=model_id,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return {
        "content":       response.choices[0].message.content,
        "model":         model_id,
        "tokens":        response.usage.total_tokens if response.usage else 0,
        "tokens_input":  response.usage.prompt_tokens if response.usage else 0,
        "tokens_output": response.usage.completion_tokens if response.usage else 0,
    }


def _call_openai(model_id: str, messages: list, max_tokens: int = 1024, api_key: str | None = None) -> dict:
    llm = _get_openai_llm(model_id, api_key)

    # `messages` here is our existing OpenAI-shaped list of role/content dicts
    # (see _process_messages_for_provider) — LangChain's .invoke() accepts
    # that format directly and converts it to BaseMessage objects internally.
    invoke_kwargs = dict(max_tokens=max_tokens)
    # Reasoning models (gpt-5.x / o-series) reject `temperature` — only the
    # older non-reasoning models accept it.
    if not re.match(r"^(o\d|gpt-5)", model_id):
        invoke_kwargs["temperature"] = 0.7

    response = llm.invoke(messages, **invoke_kwargs)

    usage = response.usage_metadata or {}
    input_tokens = usage.get("input_tokens", 0)
    output_tokens = usage.get("output_tokens", 0)

    return {
        "content":       response.content,
        "model":         model_id,
        "tokens":        input_tokens + output_tokens,
        "tokens_input":  input_tokens,
        "tokens_output": output_tokens,
    }


# Some Gemini models call for a specific default temperature/behavior —
# override here per provider_model_id; anything not listed falls back to
# the same 0.7 the other providers use.
_GOOGLE_MODEL_TEMPERATURE = {
    "gemini-2.5-flash": 0,
}

 
def _call_google(model_id: str, messages: list, max_tokens: int = 1024, api_key: str | None = None) -> dict:
    llm = _get_google_llm(model_id, api_key)
    temperature = _GOOGLE_MODEL_TEMPERATURE.get(model_id, 0.7)

    response = llm.invoke(messages, max_tokens=max_tokens)

    usage = response.usage_metadata or {}
    input_tokens = usage.get("input_tokens", 0)
    output_tokens = usage.get("output_tokens", 0)

    return {
        "content":       response.content,
        "model":         model_id,
        "tokens":        input_tokens + output_tokens,
        "tokens_input":  input_tokens,
        "tokens_output": output_tokens,
    }


# Nemotron is a reasoning model: it spends part of its token budget thinking
# before it writes the answer, and the two draw from the SAME max_tokens pool.
#
# This used to be `"reasoning_budget": max_tokens`, which handed the entire
# budget to the thinking phase. Whenever the model reasoned at length it
# exhausted max_tokens before emitting an answer, and the API returned
# finish_reason="length" with a stub like "Here" — which reached the chat UI as
# a nonsense one-word reply. It reproduced on roughly 1 in 6 ordinary prompts
# (e.g. "I have 3 apples, buy 5 more, give 2 away, then buy a dozen").
#
# Cap the thinking phase to a fraction of the budget so an answer always has
# room, and treat a length-truncated response as an error worth surfacing
# rather than passing a fragment off as the model's reply.
_NVIDIA_REASONING_BUDGET_RATIO = 0.5
_NVIDIA_MIN_REASONING_BUDGET = 256
_NVIDIA_MAX_REASONING_BUDGET = 1024

# Ceiling for the one-shot budget-doubling retry. Raising max_tokens does reduce
# truncation, but it isn't a true fix: a reasoning model simply thinks longer
# when given more room, so a budget large enough for today's hardest prompt can
# still be too small for tomorrow's. The retry keeps the common case fast and
# pays the extra latency only on the prompts that actually need it.
_NVIDIA_RETRY_MAX_TOKENS = 4096


class _NvidiaTruncated(Exception):
    """The combined thinking + answer budget ran out mid-response."""


def _nvidia_reasoning_budget(max_tokens: int) -> int:
    """Thinking-phase budget: at most half of max_tokens, so the answer phase
    always has the other half. Never zero — Nemotron still needs a floor to
    produce a coherent reply."""
    budget = int(max_tokens * _NVIDIA_REASONING_BUDGET_RATIO)
    return max(_NVIDIA_MIN_REASONING_BUDGET, min(budget, _NVIDIA_MAX_REASONING_BUDGET, max_tokens))


def _nvidia_once(model_id: str, messages: list, max_tokens: int, api_key: str | None) -> dict:
    response = _get_nvidia_client(api_key).chat.completions.create(
        model=model_id,
        messages=messages,
        temperature=1,
        top_p=0.95,
        max_tokens=max_tokens,
        extra_body={
            "chat_template_kwargs": {"enable_thinking": True},
            "reasoning_budget": _nvidia_reasoning_budget(max_tokens),
        },
    )

    choice    = response.choices[0]
    message   = choice.message
    content   = message.content or ""
    reasoning = getattr(message, "reasoning_content", None) or ""

    # finish_reason="length" means the combined thinking + answer budget ran
    # out. content is then a fragment, not a reply. Surfacing that as-is is
    # what made this look like "the API doesn't work".
    if choice.finish_reason == "length":
        raise _NvidiaTruncated(max_tokens)

    if not content:
        # Thinking-only response: the model reasoned but never got to an answer.
        content = reasoning

    input_tokens  = response.usage.prompt_tokens if response.usage else 0
    output_tokens = response.usage.completion_tokens if response.usage else 0

    return {
        "content":       content,
        "model":         model_id,
        "tokens":        response.usage.total_tokens if response.usage else 0,
        "tokens_input":  input_tokens,
        "tokens_output": output_tokens,
    }


def _call_nvidia(model_id: str, messages: list, max_tokens: int = 1024, api_key: str | None = None) -> dict:
    """Call Nemotron, retrying once with a doubled budget if it truncated.

    Only retries our own truncation signal — a genuine provider error (auth,
    rate limit, network) propagates immediately so it isn't paid for twice.
    """
    budget = max_tokens
    for attempt in range(2):
        try:
            return _nvidia_once(model_id, messages, budget, api_key)
        except _NvidiaTruncated:
            if attempt == 1 or budget >= _NVIDIA_RETRY_MAX_TOKENS:
                raise ValueError(
                    f"NVIDIA model '{model_id}' used up its {_NVIDIA_RETRY_MAX_TOKENS}-token "
                    f"budget while reasoning and returned an incomplete answer. "
                    f"Try rephrasing, or ask for a shorter response."
                ) from None
            budget = min(budget * 2, _NVIDIA_RETRY_MAX_TOKENS)



def _call_anthropic(model_id: str, messages: list, max_tokens: int = 1024, api_key: str | None = None) -> dict:
    # Anthropic separates the system prompt from the messages list.
    system_prompt = None
    filtered = []
    for m in messages:
        if m["role"] == "system":
            system_prompt = m["content"]
        else:
            filtered.append(m)

    kwargs = dict(
        model=model_id,
        max_tokens=max_tokens,
        messages=filtered,
    )
    if system_prompt:
        kwargs["system"] = system_prompt

    response = _get_anthropic_client(api_key).messages.create(**kwargs)

    input_tokens  = response.usage.input_tokens if response.usage else 0
    output_tokens = response.usage.output_tokens if response.usage else 0

    return {
        "content":       response.content[0].text,
        "model":         model_id,
        "tokens":        input_tokens + output_tokens,
        "tokens_input":  input_tokens,
        "tokens_output": output_tokens,
    }


# ── Dispatcher ────────────────────────────────────────────────────────────────

def _sync_call(provider: str, provider_model_id: str, messages: list, max_tokens: int = 1024, model_cfg=None, api_key: str | None = None) -> dict:
    """Blocking dispatcher — always run via run_in_executor, never directly.
    Pure provider call, no DB access (can't do async DB I/O from a thread-pool
    worker) — pricing/model lookup happens in get_ai_response before this runs.
    """
    processed_messages = _process_messages_for_provider(provider, messages, model_cfg=model_cfg)

    if provider == "openai":
        return _call_openai(provider_model_id, processed_messages, max_tokens, api_key)
    elif provider == "anthropic":
        return _call_anthropic(provider_model_id, processed_messages, max_tokens, api_key)
    elif provider == "google":
        return _call_google(provider_model_id, processed_messages, max_tokens, api_key)
    elif provider == "nvidia":
        return _call_nvidia(provider_model_id, processed_messages, max_tokens, api_key)
    else:
        return _call_huggingface(provider_model_id, processed_messages, max_tokens, api_key)


# ── Public async interface ────────────────────────────────────────────────────

async def get_ai_response(messages: list, model: str, db: AsyncSession) -> dict:
    """
    Non-blocking wrapper — runs the blocking provider call in a thread pool
    so FastAPI's async event loop stays responsive.

    `model` is the stable ai_models.id (e.g. "llama3", "gpt-4o"), looked up
    in the DB for its provider/provider_model_id/pricing before dispatching.
    """
    model_cfg = await model_service.get_model(db, model)
    if not model_cfg or not model_cfg.is_active:
        # Unknown or disabled model — fall back to the default rather than
        # failing the whole request outright.
        model_cfg = await model_service.get_model(db, DEFAULT_MODEL)

    if not model_cfg:
        raise Exception(
            "No AI models configured — run app.services.model_service.seed_default_models"
        )

    model_key = model_cfg.id

    async def _dispatch(cfg) -> dict:
        loop = asyncio.get_event_loop()
        api_key = await api_key_service.get_provider_api_key(db, cfg.provider)
        result = await loop.run_in_executor(
            None,
            partial(_sync_call, cfg.provider, cfg.provider_model_id, messages,
                    api_key=api_key, model_cfg=cfg),
        )

        result["model_key"] = cfg.id
        result["cost_usd"] = calculate_cost_usd_from_rates(
            cfg.input_price_per_million,
            cfg.output_price_per_million,
            result.get("tokens_input", 0),
            result.get("tokens_output", 0),
        )
        return result

    try:
        return await _dispatch(model_cfg)

    except Exception as e:
        error_msg = str(e)
        error_fallback_extra = {"model_key": model_key, "cost_usd": Decimal("0")}

        # The provider rejected this model outright (not routed/enabled for
        # the account, renamed, or removed). Retry once on the default active
        # model so a broken/just-disabled entry never hard-fails a chat.
        model_rejected = any(s in error_msg.lower() for s in (
            "model_not_supported",
            "not supported by any provider",
            "invalid model",
            "model_not_found",
            "does not exist",
        ))
        if model_rejected:
            default_cfg = await model_service.get_model(db, DEFAULT_MODEL)
            if default_cfg and default_cfg.is_active and default_cfg.id != model_cfg.id:
                try:
                    return await _dispatch(default_cfg)
                except Exception:
                    pass

        if "loading" in error_msg.lower() or "503" in error_msg:
            return {
                "content":       "⏳ Model is warming up, please try again in 20 seconds.",
                "model":         model_key,
                "tokens":        0,
                "tokens_input":  0,
                "tokens_output": 0,
                **error_fallback_extra,
            }
        if "429" in error_msg or "rate" in error_msg.lower():
            return {
                "content":       "⚠️ Rate limit reached. Please wait a moment and try again.",
                "model":         model_key,
                "tokens":        0,
                "tokens_input":  0,
                "tokens_output": 0,
                **error_fallback_extra,
            }
        if "authentication" in error_msg.lower() or "api_key" in error_msg.lower() or "401" in error_msg:
            return {
                "content":       "🔑 API key error. Please check your environment variables.",
                "model":         model_key,
                "tokens":        0,
                "tokens_input":  0,
                "tokens_output": 0,
                **error_fallback_extra,
            }

        raise Exception(f"AI error: {error_msg}")