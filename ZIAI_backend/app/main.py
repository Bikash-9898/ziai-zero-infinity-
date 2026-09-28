# app/main.py
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, Base
import app.models  # noqa: F401 — register all models before create_tables()

# ── Routers ───────────────────────────────────────────────────────────────────
from app.routers.auth_router    import router as auth_router
from app.routers.user_router    import router as user_router
from app.routers.chat_router    import router as chat_router
from app.routers.billing_router import router as billing_router
from app.routers.plans_router   import router as plans_router
from app.routers.image_router   import router as image_router
from app.routers.usage_router   import router as usage_router
from app.routers.admin_router   import router as admin_router
from app.routers.esewa_router   import router as esewa_router
from app.routers.khalti_router   import router as khalti_router
from app.routers.stripe_router   import router as stripe_router
from app.routers.library_router  import router as library_router
from app.routers.voice_router    import router as voice_router
# NOTE: no separate upload_router — chat attachments (src/api/upload.ts)
# POST to /api/library/upload, handled by library_router above. Don't add
# an upload_router import here unless that file actually gets created.


# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ── Create tables on startup ──────────────────────────────────────────────────
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Base.metadata.create_all only creates missing TABLES, not missing
        # COLUMNS on tables that already exist. The "tier" column (used by
        # app.services.routing_service for Auto-model routing) was added
        # after ai_models already existed in production, so backfill it here
        # rather than requiring a manual migration. Safe to run every boot.
        from sqlalchemy import text
        await conn.execute(text(
            "ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS tier VARCHAR NOT NULL DEFAULT 'balanced'"
        ))
        # One-time sensible backfill for known model ids that predate this
        # column (everything lands on 'balanced' from the ALTER above
        # otherwise). Only touches rows still sitting on that just-added
        # default, so it never overwrites a tier an admin already picked.
        from app.services.model_service import _DEFAULT_MODELS
        for entry in _DEFAULT_MODELS:
            await conn.execute(
                text("UPDATE ai_models SET tier = :tier WHERE id = :id AND tier = 'balanced'"),
                {"tier": entry["tier"], "id": entry["id"]},
            )

        # supports_images column — controls whether image attachments are
        # forwarded to the provider or dropped with an informative note.
        await conn.execute(text(
            "ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS supports_images BOOLEAN NOT NULL DEFAULT false"
        ))
        # Backfill known vision-capable models (safe to run every boot —
        # only touches rows still on the default `false`).
        _VISION_MODELS = {
            "gpt-4o-mini", "gpt-4o", "gpt-4-turbo",
            "claude-haiku", "claude-3-5-sonnet", "claude-3-opus",
            "gemini-3-6-flash",
        }
        for mid in _VISION_MODELS:
            await conn.execute(
                text("UPDATE ai_models SET supports_images = true WHERE id = :id AND supports_images = false"),
                {"id": mid},
            )


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ZI AI Backend")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
async def startup():
    await create_tables()

    # Seed the ai_models / image_models registries once (no-op if already
    # populated — never overwrites admin edits). See app.services.model_service
    # and app.services.image_model_service.
    from app.database import AsyncSessionLocal
    from app.services.model_service import seed_default_models
    from app.services.image_model_service import seed_default_image_models
    async with AsyncSessionLocal() as db:
        await seed_default_models(db)
        await seed_default_image_models(db)


# ── CORS ──────────────────────────────────────────────────────────────────────
# Added first so it executes first. Explicit origins + explicit methods
# (rather than "*") because allow_credentials=True requires it — the browser
# rejects a wildcard origin/method list when credentials are involved.
# Include both localhost and 127.0.0.1 to support the common Vite dev setup
# and avoid the browser turning a valid POST into a network-level "Failed to fetch".
#
# NOTE: This list is ONLY for browser-based frontends allowed to call this
# API (CORS = which origins your API accepts requests *from*). It must never
# contain URLs your backend calls *outbound* server-side (e.g. the Wikipedia
# API used in app/services/rag/website extraction) — those aren't subject to
# CORS at all, since CORS is a browser enforcement mechanism, not a
# server-to-server one. A previous version of this list accidentally
# concatenated such a URL onto the last origin (missing comma), which
# silently produced one garbled, non-matching origin string.
_default_origins = (
    "http://localhost:5173,http://localhost:5174,"
    "http://127.0.0.1:5173,http://127.0.0.1:5174"
)
_raw_origins = os.getenv("FRONTEND_URL", _default_origins)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
print(f"[DEBUG] CORS ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)


# ── COOP Middleware ───────────────────────────────────────────────────────────
class COOPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
        return response


app.add_middleware(COOPMiddleware)


# ── Register routers (must come after middleware) ────────────────────────────
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(billing_router)
app.include_router(plans_router)
app.include_router(image_router)
app.include_router(usage_router)
app.include_router(admin_router)
app.include_router(esewa_router)
app.include_router(khalti_router)
app.include_router(stripe_router)
app.include_router(library_router)
app.include_router(voice_router)


# ── Static files (Library uploads) ──────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "message": "ZI AI Backend running"}