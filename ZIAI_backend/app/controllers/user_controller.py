# app/controllers/user_controller.py
"""
Handles user CRUD operations.
- Get all users (admin only)
- Create a new user
- Get all users (root/debug)
"""

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.schemas import UserCreate


# ── Get All Users ─────────────────────────────────────────────────────────────

async def get_all_users(db: AsyncSession) -> list[User]:
    """
    Return all users from the database.
    Called by: GET /api/users  (admin only)
    Called by: GET /           (root debug)
    """
    result = await db.execute(select(User))
    return result.scalars().all()


# ── Create User ───────────────────────────────────────────────────────────────

async def create_user(payload: UserCreate, db: AsyncSession) -> User:
    """
    Create a new user if email is not already registered.
    Called by: POST /api/users
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    from app.services import settings_service
    free_trial_tokens = await settings_service.get_free_trial_tokens(db)

    new_user = User(
        email=payload.email,
        username=payload.username,
        plan=payload.plan,
        is_active=True,
        trial_tokens_remaining=free_trial_tokens,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user
