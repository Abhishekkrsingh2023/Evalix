"""Tests for team management endpoints."""
import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import get_auth_cookies


@pytest.mark.asyncio
async def test_admin_create_team(client: AsyncClient, admin_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.post(
        "/api/v1/admin/teams",
        json={"team_id": "INNOV8-TEST-001", "team_name": "Test Team", "leader_name": "Leader One"},
        cookies=cookies,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["team_id"] == "INNOV8-TEST-001"
    assert data["team_name"] == "Test Team"


@pytest.mark.asyncio
async def test_duplicate_team_id_rejected(client: AsyncClient, admin_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    payload = {"team_id": "INNOV8-DUP", "team_name": "Dup Team", "leader_name": "Someone"}

    # First creation
    r1 = await client.post("/api/v1/admin/teams", json=payload, cookies=cookies)
    assert r1.status_code == 201

    # Duplicate
    r2 = await client.post("/api/v1/admin/teams", json=payload, cookies=cookies)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_judge_cannot_create_team(client: AsyncClient, judge_user: User):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.post(
        "/api/v1/admin/teams",
        json={"team_id": "INNOV8-JUDGE", "team_name": "J Team", "leader_name": "Judge"},
        cookies=cookies,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_judge_can_list_teams(client: AsyncClient, judge_user: User, sample_team):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.get("/api/v1/teams", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_team_by_id(client: AsyncClient, judge_user: User, sample_team):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.get(f"/api/v1/teams/{sample_team.team_id}", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["team_id"] == "INNOV8-001"
    assert data["team_name"] == "Neural Ninjas"


@pytest.mark.asyncio
async def test_get_nonexistent_team(client: AsyncClient, judge_user: User):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.get("/api/v1/teams/INNOV8-NONE", cookies=cookies)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_team_id_invalid_chars(client: AsyncClient, admin_user: User):
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.post(
        "/api/v1/admin/teams",
        json={"team_id": "bad id!", "team_name": "Bad", "leader_name": "Bad"},
        cookies=cookies,
    )
    assert response.status_code == 422
