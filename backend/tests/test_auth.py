"""Tests for authentication endpoints."""
import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import get_auth_cookies


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "SUPER_ADMIN"
    assert "password_hash" not in data
    # Cookies should be set
    assert "access_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@test.com", "password": "whatever"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_endpoint(client: AsyncClient, admin_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.get("/api/v1/auth/me", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.post("/api/v1/auth/logout", cookies=cookies)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_inactive_user_cannot_login(client: AsyncClient, db, judge_user: User):
    judge_user.is_active = False
    await db.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "judge@test.com", "password": "judgepass123"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_bearer_token_authentication(client: AsyncClient, admin_user: User):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpass123"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token is not None

    # Request /me with Authorization: Bearer <token> and NO cookies (simulating iOS ITP)
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_refresh_with_body(client: AsyncClient, admin_user: User):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpass123"},
    )
    refresh_token = login_resp.json()["refresh_token"]
    assert refresh_token is not None

    # Refresh using body without cookies
    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    assert refresh_resp.json()["access_token"] is not None
