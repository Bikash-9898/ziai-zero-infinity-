import os
import uuid
import shutil
import mimetypes
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.auth_jwt import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.library import LibraryItem

router = APIRouter(prefix="/api/library", tags=["library"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".txt", ".csv", ".xlsx", ".pptx",
    ".png", ".jpg", ".jpeg", ".webp", ".gif",
    ".mp3", ".mp4", ".zip", ".json", ".xml"
}

REJECTED_EXTENSIONS = {".exe", ".bat", ".cmd", ".apk", ".sh"}

MAX_FILE_SIZE_PRO = 100 * 1024 * 1024  # 100 MB
MAX_FILE_SIZE_FREE = 10 * 1024 * 1024  # 10 MB


def is_safe_filename(filename: str) -> bool:
    ext = os.path.splitext(filename.lower())[1]
    if ext in REJECTED_EXTENSIONS:
        return False
    return ext in ALLOWED_EXTENSIONS


def mime_to_category(mime_type: str | None) -> str:
    if not mime_type:
        return "files"
    if mime_type.startswith("image/"):
        return "images"
    if mime_type.startswith("video/"):
        return "videos"
    if mime_type.startswith("audio/"):
        return "audio"
    return "files"


@router.get("/")
async def get_library_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(LibraryItem)
        .where(LibraryItem.user_id == current_user.id)
        .order_by(LibraryItem.created_at.desc())
    )
    items = result.scalars().all()
    return [
        {
            "id": str(item.id),
            "original_name": item.original_name,
            "filename": item.filename,
            "url": item.url,
            "mime_type": item.mime_type,
            "category": item.category,
            "size": int(item.size),
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in items
    ]


@router.post("/upload")
async def upload_library_items(
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = current_user.plan.lower()
    max_files = 10 if plan == "free" else (100 if plan == "pro" else float("inf"))
    if len(files) > max_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You've reached the {plan.capitalize()} plan limit of {max_files} attached files. Upgrade to Pro for larger uploads and higher limits."
        )

    uploaded_items = []
    for file in files:
        original_name = file.filename or "uploaded_file"
        if not is_safe_filename(original_name):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"File type not allowed or is executable: {original_name}"
            )

        contents = await file.read()
        file_size = len(contents)
        max_size = MAX_FILE_SIZE_PRO if plan in ["pro", "enterprise"] else MAX_FILE_SIZE_FREE
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File {original_name} exceeds maximum allowed size of {max_size // (1024*1024)}MB."
            )

        ext = os.path.splitext(original_name)[1]
        secure_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, secure_name)

        try:
            with open(file_path, "wb") as buffer:
                buffer.write(contents)
        except Exception:
            raise HTTPException(status_code=500, detail="Could not save file")

        mime_type, _ = mimetypes.guess_type(original_name)
        category = mime_to_category(mime_type)
        url = f"/uploads/{secure_name}"

        item = LibraryItem(
            user_id=current_user.id,
            original_name=original_name,
            filename=secure_name,
            url=url,
            mime_type=mime_type or "application/octet-stream",
            category=category,
            size=file_size,
        )
        db.add(item)
        uploaded_items.append(item)

    await db.commit()
    for item in uploaded_items:
        await db.refresh(item)

    return {
        "items": [
            {
                "id": str(item.id),
                "original_name": item.original_name,
                "filename": item.filename,
                "url": item.url,
                "mime_type": item.mime_type,
                "category": item.category,
                "size": int(item.size),
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in uploaded_items
        ]
    }


@router.delete("/{item_id}")
async def delete_library_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await db.get(LibraryItem, UUID(item_id))
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library item not found")
    db.delete(item)
    await db.commit()
    return {"message": "Item deleted"}
