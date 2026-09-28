# app/dependencies.py
"""
Shared FastAPI dependencies used across routers.
Kept separate from main.py to avoid circular imports.
"""
import os
from typing import Optional
from fastapi import Header, HTTPException


async def require_admin(x_admin_key: Optional[str] = Header(None)):
    secret = os.getenv("ADMIN_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=500, detail="ADMIN_SECRET_KEY not configured")
    if x_admin_key != secret:
        raise HTTPException(status_code=403, detail="Admin access required")