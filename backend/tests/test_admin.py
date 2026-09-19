"""Tests for judge management (admin operations)."""
import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import get_auth_cookies


@pytest.mark.asyncio
async def test_admin_create_judge(client: AsyncClient, admin_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.post(
        "/api/v1/admin/judges",
        json={"name": "New Judge", "email": "newjudge@test.com", "password": "password123"},
        cookies=cookies,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "JUDGE"
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_admin_create_duplicate_judge_rejected(client: AsyncClient, admin_user: User, judge_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.post(
        "/api/v1/admin/judges",
        json={"name": "Dup Judge", "email": "judge@test.com", "password": "password123"},
        cookies=cookies,
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_admin_list_judges(client: AsyncClient, admin_user: User, judge_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.get("/api/v1/admin/judges", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_admin_deactivate_judge(client: AsyncClient, admin_user: User, judge_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.patch(
        f"/api/v1/admin/judges/{judge_user.id}/status",
        json={"is_active": False},
        cookies=cookies,
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


@pytest.mark.asyncio
async def test_deactivated_judge_cannot_login(
    client: AsyncClient, admin_user: User, judge_user: User, db
):
    # Deactivate
    judge_user.is_active = False
    await db.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "judge@test.com", "password": "judgepass123"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_dashboard(client: AsyncClient, admin_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.get("/api/v1/admin/dashboard", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert "total_teams" in data
    assert "total_judges" in data
