# app/controllers/auth_controller.py
"""
Handles all authentication logic:
- Google OAuth2 login (returns JWT to frontend)
- Admin username/password login
"""

import bcrypt
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.admin import Admin
from app.auth_utils import verify_google_token
from app.auth_jwt import create_access_token
from app.services import settings_service


# ── Guest Auth (no sign-in) ─────────────────────────────────────────────────

async def guest_login(client_guest_id: str, db: AsyncSession) -> dict:
    """
    Find-or-create a lightweight guest User row for this browser and return
    a normal JWT — from here on, a guest behaves exactly like a signed-in
    user to every other endpoint (wallet, chat, etc), just with is_guest=True
    and a smaller trial. client_guest_id is a UUID the frontend generates
    once and persists in localStorage, so repeat visits reuse the same guest
    identity (and remaining trial) instead of minting a new one every load.
    Called by: POST /api/auth/guest
    """
    if not client_guest_id or len(client_guest_id) > 100:
        raise HTTPException(status_code=400, detail="Invalid client_guest_id")

    result = await db.execute(select(User).where(User.client_guest_id == client_guest_id))
    db_user = result.scalar_one_or_none()

    if not db_user:
        guest_trial_tokens = await settings_service.get_guest_trial_tokens(db)
        db_user = User(
            email=f"guest+{client_guest_id}@ziai.local",
            username="Guest",
            plan="free",
            is_active=True,
            is_guest=True,
            client_guest_id=client_guest_id,
            trial_tokens_remaining=guest_trial_tokens,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

    access_token = create_access_token(
        user_id=str(db_user.id),
        email=db_user.email,
    )

    return {
        "verified":     True,
        "access_token": access_token,
        "token_type":   "bearer",
        "user": {
            "id":         str(db_user.id),
            "email":      db_user.email,
            "username":   db_user.username,
            "plan":       db_user.plan,
            "is_guest":   db_user.is_guest,
        },
    }


# ── Google Auth ───────────────────────────────────────────────────────────────

async def google_login(token: str, db: AsyncSession) -> dict:
    """
    Verify Google access token, create user if new, return JWT.
    Called by: POST /api/auth/google
    """
    result_auth = verify_google_token(token)
    if not result_auth["success"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Google Token: {result_auth['error']}"
        )

    user_info = result_auth["data"]

    result = await db.execute(select(User).where(User.email == user_info["email"]))
    db_user = result.scalar_one_or_none()

    if not db_user:
        free_trial_tokens = await settings_service.get_free_trial_tokens(db)
        db_user = User(
            email=user_info["email"],
            username=user_info["username"],
            plan="free",
            is_active=True,
            trial_tokens_remaining=free_trial_tokens,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

    access_token = create_access_token(
        user_id=str(db_user.id),
        email=db_user.email,
    )

    return {
        "verified":     True,
        "access_token": access_token,
        "token_type":   "bearer",
        "user": {
            "id":        str(db_user.id),
            "email":     db_user.email,
            "username":  db_user.username,
            "plan":      db_user.plan,
            "is_active": db_user.is_active,
        },
    }


# ── Get Current User ──────────────────────────────────────────────────────────
 
async def get_me(current_user: User) -> dict:
    """
    Return fresh user profile from DB — frontend calls this on mount
    to sync plan and profile changes without requiring re-login.
    Called by: GET /api/auth/me
    """
    return {
        "user": {
            "id":        str(current_user.id),
            "email":     current_user.email,
            "username":  current_user.username,
            "plan":      current_user.plan,
            "is_active": current_user.is_active,
            "is_guest":  current_user.is_guest,
        }
    }


# ── Admin Login ───────────────────────────────────────────────────────────────

async def admin_login(loginusername: str, password: str, db: AsyncSession) -> dict:
    """
    Verify admin credentials, return success/failure response.
    Called by: POST /api/admin/login
    """
    result = await db.execute(select(Admin).where(Admin.username == loginusername))
    admin = result.scalar_one_or_none()

    if not admin or not bcrypt.checkpw(password.encode(), admin.password_hash.encode()):
        return {
            "success": False,
            "message": "Invalid username or password.",
            "user":    None,
        }

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id":       str(admin.id),
            "username": admin.username,
            "role":     "admin",
        },
    }
