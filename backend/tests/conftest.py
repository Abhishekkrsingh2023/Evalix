"""
Shared test fixtures for INNOV8 3.0 backend tests.

Uses SQLite (aiosqlite) for fast, isolated tests without requiring PostgreSQL.
Each test gets a fresh database via function-scoped fixture + rollback.
"""
import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.dependencies.db import get_db
from app.main import app
from app.models.user import User, UserRole
from app.models.team import Team


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    """Create a fresh in-memory SQLite engine for each test."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    session_factory = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client wired to the test DB."""
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db: AsyncSession) -> User:
    """Create a SUPER_ADMIN user."""
    user = User(
        name="Test Admin",
        email="admin@test.com",
        password_hash=hash_password("adminpass123"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def judge_user(db: AsyncSession) -> User:
    """Create a JUDGE user."""
    user = User(
        name="Test Judge",
        email="judge@test.com",
        password_hash=hash_password("judgepass123"),
        role=UserRole.JUDGE,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def judge_user_2(db: AsyncSession) -> User:
    """Create a second JUDGE user."""
    user = User(
        name="Test Judge 2",
        email="judge2@test.com",
        password_hash=hash_password("judgepass123"),
        role=UserRole.JUDGE,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def sample_team(db: AsyncSession) -> Team:
    """Create a sample team."""
    team = Team(
        team_id="INNOV8-001",
        team_name="Neural Ninjas",
        leader_name="Abhishek Kumar",
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


async def get_auth_cookies(client: AsyncClient, email: str, password: str) -> dict:
    """Helper to login and return cookies."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, f"Login failed ({response.status_code}): {response.text}"
    return dict(response.cookies)
