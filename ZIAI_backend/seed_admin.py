# seed_admin.py
import asyncio, bcrypt
from app.database import engine, Base
from app.models.admin import Admin  # importing Admin registers it with Base.metadata
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed():
    # ✅ Create the admins table first
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        hashed = bcrypt.hashpw(b"admin01", bcrypt.gensalt()).decode()
        admin = Admin(username="admin", password_hash=hashed)
        db.add(admin)
        await db.commit()
        print("✅ Admin seeded successfully!")

asyncio.run(seed())