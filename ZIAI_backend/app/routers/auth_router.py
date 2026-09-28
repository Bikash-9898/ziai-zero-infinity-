# app/routers/auth_router.py
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.auth_jwt import get_current_user
from app.models.user import User
from app.controllers.auth_controller import google_login, admin_login, get_me, guest_login

router  = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


# ── Schemas ───────────────────────────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    token: str

class GuestAuthRequest(BaseModel):
    client_guest_id: str

class AdminLoginRequest(BaseModel):
    loginusername: str
    password: str

class AdminLoginResponse(BaseModel):
    success: bool
    message: str
    user: dict | None = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/google")
@limiter.limit("20/minute")
async def google_auth(
    request: Request,
    data: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    return await google_login(data.token, db)


@router.post("/guest")
@limiter.limit("10/minute")
async def guest_auth(
    request: Request,
    data: GuestAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """Auto-provision (or resume) a per-browser guest session — no sign-in required."""
    return await guest_login(data.client_guest_id, db)

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    """
    Returns fresh user profile from DB.
    Frontend calls this on mount to sync plan without re-login.
    Requires: Authorization: Bearer <token>
    """
    return await get_me(current_user)

@router.post("/admin/login", response_model=AdminLoginResponse)
@limiter.limit("10/minute")
async def admin_login_route(
    request: Request,
    body: AdminLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    return await admin_login(body.loginusername, body.password, db)
