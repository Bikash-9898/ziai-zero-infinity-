from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    plan: str = "Free"

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    plan: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True # Allows Pydantic to read SQLAlchemy models