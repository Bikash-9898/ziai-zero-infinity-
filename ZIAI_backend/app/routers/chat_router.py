# app/routers/chat_router.py
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth_jwt import get_current_user
from app.models.user import User
from app.controllers.chat_controller import (
    send_message,
    get_conversations,
    get_messages,
    delete_conversation,
    get_available_models,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


# ── Schema ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    # "auto" triggers routing_service (see chat_controller.send_message) —
    # DEFAULT_MODEL_ID in model_service.py stays a real model ("llama3"),
    # since that's the technical last-resort fallback if routing itself
    # fails; this is just what the API assumes if a caller omits `model`
    # entirely (frontend always sends it explicitly now).
    model: Optional[str] = "auto"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/send")
async def send_message_route(
    req: ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await send_message(
        req.message,
        req.conversation_id,
        req.model,
        background_tasks,
        db,
        current_user,
    )


@router.get("/conversations")
async def get_conversations_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_conversations(db, current_user)


@router.get("/messages/{conversation_id}")
async def get_messages_route(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_messages(conversation_id, db, current_user)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_route(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await delete_conversation(conversation_id, db, current_user)


@router.get("/models")
async def get_available_models_route(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Which model keys this user (guest or full) may pick from — drives ModelSelector."""
    return await get_available_models(db, current_user)
