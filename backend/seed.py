#!/usr/bin/env python3
"""
Seed script: creates the initial SUPER_ADMIN user.

Usage:
    uv run python seed.py

Credentials are read from environment variables:
    ADMIN_EMAIL    (default: admin@innov8.local)
    ADMIN_PASSWORD (default: changeme)
    ADMIN_NAME     (default: Super Admin)

IMPORTANT: Change these in production via .env file.
"""
import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole


async def seed() -> None:
    # Create tables if they don't exist (for quick dev setup)
    # For production, use alembic upgrade head instead
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        result = await db.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"✓ Super admin already exists: {settings.ADMIN_EMAIL}")
        else:
            admin = User(
                name=settings.ADMIN_NAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            print(f"✓ Created super admin: {settings.ADMIN_EMAIL}")
            print(f"  Name: {settings.ADMIN_NAME}")
            print(f"  Role: SUPER_ADMIN")
            print()
            print("⚠  IMPORTANT: Change the default password in .env before going to production!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
