# app/controllers/chat_controller.py
"""
Handles chat operations:
- Send a message and get AI response
- Get all conversations for current user
- Get messages in a conversation
- Delete a conversation
"""

import time
from datetime import datetime, date
from uuid import UUID as _UUID
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Conversation, Message
from app.models.user import User
from app.services.ai_service import get_ai_response
from app.services import routing_service, model_service

MAX_CONTEXT_CHARS = 12_000


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_conversation_id(conversation_id: str | _UUID) -> _UUID:
    """Raise a clean 400 instead of a 500 on a malformed conversation_id."""
    try:
        return _UUID(conversation_id) if isinstance(conversation_id, str) else conversation_id
    except (ValueError, TypeError) as e:
        print(f"[ERROR] Invalid conversation_id format: {conversation_id}: {e}")
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")


def _trim_history(messages: list[dict], max_chars: int = MAX_CONTEXT_CHARS) -> list[dict]:
    """Keep as many recent messages as fit within max_chars."""
    total, kept = 0, []
    for msg in reversed(messages):
        total += len(msg["content"])
        if total > max_chars and kept:
            break
        kept.insert(0, msg)
    return kept


async def _write_usage(
    user_id: str,
    model: str,
    tokens_input: int,
    tokens_output: int,
    latency_ms: int,
    model_key: str | None = None,
):
    """
    Background task — opens its OWN DB session.

    CRITICAL FIX: Never pass the request db session to a BackgroundTask.
    FastAPI closes the request session when the response is sent.
    By the time the background task runs, the session is closed and any
    DB operation raises: sqlalchemy.exc.InvalidRequestError: Session is closed.

    This is why ai_requests and usage tables were always empty — the writes
    were silently failing with a closed session error.
    """
    from app.models.usage_model import AiRequest, Usage
    from app.database import AsyncSessionLocal
    from app.pricing import calculate_cost_usd_from_rates
    from app.services import model_service
    from app.services.wallet_service import deduct_for_usage
    import calendar
    import logging
    from uuid import UUID as _UUID

    pricing_key = model_key or model

    async with AsyncSessionLocal() as db:
        try:
            uid          = _UUID(user_id)
            period_start = date.today().replace(day=1)
            last_day     = calendar.monthrange(period_start.year, period_start.month)[1]
            period_end   = period_start.replace(day=last_day)
            total_tokens = tokens_input + tokens_output

            model_cfg = await model_service.get_model(db, pricing_key)
            if not model_cfg:
                model_cfg = await model_service.get_model(db, model_service.DEFAULT_MODEL_ID)
            cost_usd = calculate_cost_usd_from_rates(
                model_cfg.input_price_per_million if model_cfg else 1,
                model_cfg.output_price_per_million if model_cfg else 5,
                tokens_input,
                tokens_output,
            )

            # Write ai_requests row (cost is now populated — was always NULL before)
            new_request = AiRequest(
                user_id=uid,
                model=model,
                tokens_input=tokens_input,
                tokens_output=tokens_output,
                cost=cost_usd,
                latency_ms=latency_ms,
                status="success",
            )
            db.add(new_request)

            # Upsert usage row
            result = await db.execute(
                select(Usage).where(
                    Usage.user_id      == uid,
                    Usage.period_start == period_start,
                )
            )
            usage = result.scalar_one_or_none()

            if usage:
                usage.tokens_used   += total_tokens
                usage.request_count += 1
            else:
                db.add(Usage(
                    user_id=uid,
                    tokens_used=total_tokens,
                    request_count=1,
                    period_start=period_start,
                    period_end=period_end,
                ))

            await db.commit()
            await db.refresh(new_request)

        except Exception as e:
            logging.getLogger(__name__).error("_write_usage failed: %s", e)
            await db.rollback()
            return

    # Deduct wallet in its own session/commit — kept separate so a wallet
    # hiccup never rolls back the usage log we just wrote.
    try:
        await deduct_for_usage(
            user_id=_UUID(user_id),
            model_key=pricing_key,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            related_request_id=new_request.id,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("wallet deduction failed: %s", e)


# ── Send Message ──────────────────────────────────────────────────────────────

async def send_message(
    message: str,
    conversation_id: str | None,
    model: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession,
    current_user: User,
) -> dict:
    """
    Get or create a conversation, save user message,
    call AI, save response, return reply.
    Called by: POST /api/chat/send
    """
    # Guests (not signed in) are restricted server-side to admin-approved
    # cheap models, no matter what the frontend sent. Admin-configurable via
    # PUT /api/admin/settings/guest-models — see app.services.settings_service.
    # Guests never get "auto" — they're capped to the cheap allow-list already,
    # so there's nothing for routing to decide.
    if getattr(current_user, "is_guest", False):
        from app.services.settings_service import get_guest_allowed_models
        allowed_models = await get_guest_allowed_models(db)
        if model not in allowed_models:
            model = allowed_models[0]

    routing_info: dict | None = None

    if conversation_id:
        conv_uuid = _parse_conversation_id(conversation_id)

        conv = (await db.execute(
            select(Conversation).where(
                Conversation.id      == conv_uuid,
                Conversation.user_id == current_user.id,
            )
        )).scalar_one_or_none()
        if not conv:
            print(f"[DEBUG] Conversation {conv_uuid} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conv = Conversation(user_id=current_user.id, model=model, title="New Chat")
        db.add(conv)
        await db.flush()
        await db.commit()
        await db.refresh(conv)
        print(f"[DEBUG] Created conversation {conv.id} for user {current_user.id}")

    # Save user message
    db.add(Message(conversation_id=conv.id, role="user", content=message))
    await db.commit()

    # Check for image generation slash commands (/imagine or /image)
    stripped_msg = message.strip()
    if stripped_msg.startswith(("/imagine", "/image")):
        parts = stripped_msg.split(maxsplit=1)
        raw_args = parts[1].strip() if len(parts) > 1 else ""

        target_img_model = "flux"
        prompt_text = raw_args

        if "--model=" in raw_args:
            import re
            match = re.search(r'--model=([^\s]+)', raw_args)
            if match:
                target_img_model = match.group(1).strip()
                prompt_text = re.sub(r'--model=[^\s]+', '', raw_args).strip()

        if not prompt_text:
            reply_text = (
                "🎨 **AI Image Generation**\n\n"
                "To generate an image, type `/imagine` followed by your prompt.\n\n"
                "*Example:* `/imagine A realistic futuristic cyberpunk city in the mountains of Nepal, 4k, octane render`"
            )
        else:
            try:
                from app.models.image import ImageGenerateRequest
                from app.services.image_service import generate_image, save_generation, get_image_model_or_default

                img_model_cfg = await get_image_model_or_default(db, target_img_model)
                req = ImageGenerateRequest(
                    prompt=prompt_text,
                    model=img_model_cfg.id,
                    user_id=str(current_user.id),
                    width=1024,
                    height=1024,
                )
                img_result = await generate_image(req, img_model_cfg)
                await save_generation(
                    db, req, img_result["image_url"], img_result["generation_time_ms"],
                    credits_used=float(img_model_cfg.credits_per_image)
                )
                model_name = getattr(img_model_cfg, 'display_name', None) or getattr(img_model_cfg, 'name', None) or img_model_cfg.id
                reply_text = f"![{prompt_text}]({img_result['image_url']})\n\n✨ **Generated image for:** *\"{prompt_text}\"*\n*Model:* `{model_name}`"
            except Exception as err:
                print(f"[ERROR] Image generation via chat failed: {err}")
                reply_text = f"⚠️ Image generation failed: {str(err)}"

        db.add(Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply_text,
            tokens_used=0,
        ))

        if conv.title == "New Chat":
            conv.title = f"🎨 Image: {prompt_text[:35]}" if prompt_text else "🎨 Image Generation"
        conv.updated_at = datetime.utcnow()

        await db.commit()

        return {
            "conversation_id": str(conv.id),
            "reply":           reply_text,
            "model":           "image-gen",
            "tokens":          0,
        }

    # Build trimmed history
    raw_history = (await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
        .limit(40)
    )).scalars().all()

    ai_messages = _trim_history(
        [{"role": m.role, "content": m.content} for m in raw_history]
    )

    # Context-based routing: "auto" isn't a real ai_models.id, it's a
    # sentinel meaning "pick the best model for this message". Resolve it
    # to a concrete model *before* the wallet check so pricing/billing below
    # always sees a real model — see app.services.routing_service.
    if model == routing_service.AUTO_MODEL_ID:
        try:
            routing_info = await routing_service.route_message(
                db, message, current_user, history_len=len(raw_history)
            )
            model = routing_info["model_id"]
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("auto-routing failed, falling back to default: %s", e)
            model = model_service.DEFAULT_MODEL_ID

    # Wallet pre-flight check: block BEFORE spending money on a provider call.
    # Trial-token users always pass; credit-balance users need enough NPR to
    # cover a conservative token estimate.
    from app.services.wallet_service import has_sufficient_balance
    ESTIMATED_TOKENS_INPUT  = sum(len(m["content"]) // 4 for m in ai_messages)
    ESTIMATED_TOKENS_OUTPUT = 1024  # matches ai_service's default max_tokens
    if not await has_sufficient_balance(
        db, current_user, ESTIMATED_TOKENS_INPUT, ESTIMATED_TOKENS_OUTPUT, model
    ):
        raise HTTPException(
            status_code=402,
            detail={
                "error": "insufficient_balance",
                "message": "Your free trial and wallet balance are used up. Please top up credits to continue.",
                "topup_url": "/billing/wallet",
            },
        )

    # Call AI
    t0        = time.monotonic()
    # If the selected model is the web-search agent, use the search agent
    if model == "web-search":
        from app.services.search_agent import search_and_answer

        search_out = await search_and_answer(message, db, top_k=10, model=model_service.DEFAULT_MODEL_ID)
        # Compose a reply and include sources in the response payload
        ai_result = {
            "content": search_out.get("answer", ""),
            "model": model,
            "tokens": 0,
            "tokens_input": 0,
            "tokens_output": 0,
            "sources": search_out.get("sources", []),
        }
    else:
        ai_result = await get_ai_response(ai_messages, model, db)
        ai_result = {
            "content": ai_result.get("content", ""),
            "model": ai_result.get("model", model),
            "tokens": ai_result.get("tokens", 0),
            "tokens_input": ai_result.get("tokens_input", 0),
            "tokens_output": ai_result.get("tokens_output", 0),
        }
    latency   = int((time.monotonic() - t0) * 1000)

    # Save AI response
    db.add(Message(
        conversation_id=conv.id,
        role="assistant",
        content=ai_result["content"],
        tokens_used=ai_result["tokens"],
    ))

    # Auto-title + update timestamp
    if conv.title == "New Chat":
        conv.title = message[:50] + ("..." if len(message) > 50 else "")
    conv.updated_at = datetime.utcnow()

    await db.commit()

    # Pass only plain values — string ID, not the ORM User object or db session
    background_tasks.add_task(
        _write_usage,
        str(current_user.id),
        ai_result["model"],
        ai_result.get("tokens_input", 0),
        ai_result.get("tokens_output", 0),
        latency,
        ai_result.get("model_key", model),
    )

    response = {
        "conversation_id": str(conv.id),
        "reply":           ai_result["content"],
        "model":           ai_result["model"],
        "tokens":          ai_result["tokens"],
    }
    # Include web-search sources when provided by the agent
    if "sources" in ai_result:
        response["sources"] = ai_result["sources"]
    if routing_info:
        # Lets the frontend show e.g. "Routed to Claude Haiku (simple · heuristic)"
        response["routing"] = {
            "difficulty": routing_info["difficulty"],
            "tier":       routing_info["tier"],
            "method":     routing_info["method"],
            "model_id":   routing_info["model_id"],
        }
    return response


# ── Get Conversations ─────────────────────────────────────────────────────────

async def get_conversations(db: AsyncSession, current_user: User) -> list[dict]:
    """
    Return all conversations for the current user, newest first.
    Called by: GET /api/chat/conversations
    """
    convs = (await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )).scalars().all()

    return [
        {
            "id":         str(c.id),
            "title":      c.title,
            "model":      c.model,
            "created_at": c.created_at,
        }
        for c in convs
    ]


# ── Get Messages ──────────────────────────────────────────────────────────────

async def get_messages(
    conversation_id: str,
    db: AsyncSession,
    current_user: User,
) -> list[dict]:
    """
    Return all messages in a conversation (ownership verified).
    Called by: GET /api/chat/messages/{conversation_id}
    """
    conv_uuid = _parse_conversation_id(conversation_id)

    try:
        conv = (await db.execute(
            select(Conversation).where(
                Conversation.id      == conv_uuid,
                Conversation.user_id == current_user.id,
            )
        )).scalar_one_or_none()
    except Exception as e:
        print(f"[ERROR] Failed to query conversation {conv_uuid} for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Database query error")

    if not conv:
        print(f"[DEBUG] Conversation {conv_uuid} not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Conversation not found")

    try:
        messages = (await db.execute(
            select(Message)
            .where(Message.conversation_id == conv_uuid)
            .order_by(Message.created_at)
        )).scalars().all()
    except Exception as e:
        print(f"[ERROR] Failed to query messages for conversation {conv_uuid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to load messages")

    return [
        {
            "id":         str(m.id),
            "role":       m.role,
            "content":    m.content,
            "created_at": m.created_at,
        }
        for m in messages
    ]


# ── Delete Conversation ───────────────────────────────────────────────────────

async def delete_conversation(
    conversation_id: str,
    db: AsyncSession,
    current_user: User,
) -> dict:
    """
    Delete a conversation (ownership verified).
    Called by: DELETE /api/chat/conversations/{conversation_id}
    """
    conv_uuid = _parse_conversation_id(conversation_id)

    conv = (await db.execute(
        select(Conversation).where(
            Conversation.id      == conv_uuid,
            Conversation.user_id == current_user.id,
        )
    )).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conv)
    await db.commit()
    return {"deleted": True}


# ── Available models (drives ModelSelector) ──────────────────────────────────

async def get_available_models(db: AsyncSession, current_user: User) -> dict:
    """
    Returns which models this user is allowed to pick from (id + label),
    so the frontend no longer needs a static model list either. Guests get
    the admin-configured restricted subset; everyone else gets the full
    active set.
    Called by: GET /api/chat/models
    """
    from app.services import model_service

    active_models = await model_service.list_models(db, active_only=True)
    all_info = [{"id": m.id, "label": m.label, "supports_images": m.supports_images} for m in active_models]
    all_keys = [m.id for m in active_models]

    if getattr(current_user, "is_guest", False):
        from app.services.settings_service import get_guest_allowed_models
        allowed = await get_guest_allowed_models(db)
        # Guard against a stale admin-configured key that no longer exists
        allowed = [k for k in allowed if k in all_keys] or all_keys[:1]
        allowed_info = [m for m in all_info if m["id"] in allowed]
        # Guests skip "auto" — their allow-list is already the cheap tier,
        # so there's nothing for routing to decide.
        return {"models": allowed_info, "restricted": True}

    auto_option = {"id": routing_service.AUTO_MODEL_ID, "label": "✨ Auto (smart routing)"}
    return {"models": [auto_option] + all_info, "restricted": False}
