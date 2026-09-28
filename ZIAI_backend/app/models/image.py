from pydantic import BaseModel
from typing import Optional
# from datetime import datetime

class ImageGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    model: str = "flux"
    width: int = 1024
    height: int = 1024
    user_id: Optional[str] = None       # ← accepts email string, not UUID

class ImageGenerateResponse(BaseModel):
    id: str
    image_url: str
    prompt: str
    model: str
    generation_time_ms: Optional[int] = None
    created_at: str

class ImageHistoryResponse(BaseModel):
    images: list[ImageGenerateResponse]