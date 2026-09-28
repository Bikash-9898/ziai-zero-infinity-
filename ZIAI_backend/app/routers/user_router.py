# app/routers/user_router.py
from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.schemas import UserCreate, UserOut
from app.Dependencies import require_admin
from app.controllers.user_controller import get_all_users, create_user

router = APIRouter(prefix="/api/users", tags=["users"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[UserOut], dependencies=[Depends(require_admin)])
async def get_users(db: AsyncSession = Depends(get_db)):
    return await get_all_users(db)


@router.post("/", response_model=UserOut)
async def create_new_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    return await create_user(payload, db)
