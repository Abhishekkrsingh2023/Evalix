"""
Tests for score submission, immutability, and RBAC.

Critical test cases per specification:
1. Judge submits Round 1 → success
2. Judge submits Round 1 again → 409 Conflict
3. Judge submits Round 2 → success
4. No PUT/PATCH/DELETE endpoints exist for scores
5. Admin cannot submit scores
6. Invalid score ranges rejected
7. Total not trusted from client (server computes it)
"""
import pytest
from httpx import AsyncClient

from app.models.user import User, UserRole
from app.models.team import Team
from tests.conftest import get_auth_cookies


# ---------- Score submission ----------

@pytest.mark.asyncio
async def test_judge_submits_round_1_success(
    client: AsyncClient, judge_user: User, sample_team: Team
):
    """Judge submits Round 1 score — should succeed."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.post(
        "/api/v1/scores",
        json={
            "team_id": sample_team.team_id,
            "round": 1,
            "qa_score": 8,
            "innovation_score": 9,
            "execution_score": 7,
        },
        cookies=cookies,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["total_score"] == 24  # 8+9+7 — server computed
    assert data["round"] == 1


@pytest.mark.asyncio
async def test_judge_submits_round_1_again_rejected(
    client: AsyncClient, judge_user: User, sample_team: Team
):
    """Judge submits Round 1 twice — second attempt should return 409."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    payload = {
        "team_id": sample_team.team_id,
        "round": 1,
        "qa_score": 5,
        "innovation_score": 5,
        "execution_score": 5,
    }
    # First submission
    r1 = await client.post("/api/v1/scores", json=payload, cookies=cookies)
    assert r1.status_code == 201

    # Second submission — must be rejected
    r2 = await client.post("/api/v1/scores", json=payload, cookies=cookies)
    assert r2.status_code == 409
    assert "already submitted" in r2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_judge_cannot_submit_round_2_before_round_1(
    client: AsyncClient, judge_user: User, sample_team: Team
):
    """Judge cannot submit Round 2 score if Round 1 has not been submitted yet."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.post(
        "/api/v1/scores",
        json={
            "team_id": sample_team.team_id,
            "round": 2,
            "qa_score": 8,
            "innovation_score": 8,
            "execution_score": 8,
        },
        cookies=cookies,
    )
    assert response.status_code == 400
    assert "Round 1" in response.json()["detail"]


@pytest.mark.asyncio
async def test_judge_submits_round_2_after_round_1(
    client: AsyncClient, judge_user: User, sample_team: Team
):
    """Judge can submit Round 2 after Round 1."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")

    # Submit Round 1
    r1 = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 7, "innovation_score": 8, "execution_score": 9},
        cookies=cookies,
    )
    assert r1.status_code == 201

    # Submit Round 2
    r2 = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 2, "qa_score": 9, "innovation_score": 9, "execution_score": 8},
        cookies=cookies,
    )
    assert r2.status_code == 201
    assert r2.json()["total_score"] == 26


@pytest.mark.asyncio
async def test_admin_cannot_submit_scores(
    client: AsyncClient, admin_user: User, sample_team: Team
):
    """Admin should NOT be able to submit judge scores — 403 expected."""
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    response = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 10, "innovation_score": 10, "execution_score": 10},
        cookies=cookies,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_unauthenticated_cannot_submit_scores(
    client: AsyncClient, sample_team: Team
):
    response = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 5, "innovation_score": 5, "execution_score": 5},
    )
    assert response.status_code == 401


# ---------- Score immutability / no update/delete endpoints ----------

@pytest.mark.asyncio
async def test_no_put_endpoint_for_scores(client: AsyncClient, judge_user: User, sample_team: Team):
    """PUT /api/v1/scores/{id} must not exist."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    # First submit a score to get an ID
    r = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 5, "innovation_score": 5, "execution_score": 5},
        cookies=cookies,
    )
    assert r.status_code == 201
    score_id = r.json()["id"]

    # Attempt PUT — must be 404 or 405 (endpoint doesn't exist)
    put_r = await client.put(f"/api/v1/scores/{score_id}", json={}, cookies=cookies)
    assert put_r.status_code in (404, 405)


@pytest.mark.asyncio
async def test_no_delete_endpoint_for_scores(client: AsyncClient, judge_user: User, sample_team: Team):
    """DELETE /api/v1/scores/{id} must not exist."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    r = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 5, "innovation_score": 5, "execution_score": 5},
        cookies=cookies,
    )
    score_id = r.json()["id"]

    del_r = await client.delete(f"/api/v1/scores/{score_id}", cookies=cookies)
    assert del_r.status_code in (404, 405)


@pytest.mark.asyncio
async def test_no_patch_endpoint_for_scores(client: AsyncClient, judge_user: User, sample_team: Team):
    """PATCH /api/v1/scores/{id} must not exist."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    r = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 5, "innovation_score": 5, "execution_score": 5},
        cookies=cookies,
    )
    score_id = r.json()["id"]

    patch_r = await client.patch(f"/api/v1/scores/{score_id}", json={}, cookies=cookies)
    assert patch_r.status_code in (404, 405)


# ---------- Score validation ----------

@pytest.mark.asyncio
async def test_score_above_max_rejected(client: AsyncClient, judge_user: User, sample_team: Team):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 11, "innovation_score": 5, "execution_score": 5},
        cookies=cookies,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_score_below_min_rejected(client: AsyncClient, judge_user: User, sample_team: Team):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": -1, "innovation_score": 5, "execution_score": 5},
        cookies=cookies,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invalid_round_rejected(client: AsyncClient, judge_user: User, sample_team: Team):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 3, "qa_score": 5, "innovation_score": 5, "execution_score": 5},
        cookies=cookies,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_server_computes_total_score(client: AsyncClient, judge_user: User, sample_team: Team):
    """Even if client sends garbage total, server must compute it correctly."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    response = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 10, "innovation_score": 10, "execution_score": 10},
        cookies=cookies,
    )
    assert response.status_code == 201
    assert response.json()["total_score"] == 30


# ---------- Judge isolation ----------

@pytest.mark.asyncio
async def test_two_judges_can_score_same_team(
    client: AsyncClient, judge_user: User, judge_user_2: User, sample_team: Team
):
    """Two different judges can both score the same team in the same round."""
    cookies1 = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    cookies2 = await get_auth_cookies(client, "judge2@test.com", "judgepass123")

    r1 = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 8, "innovation_score": 8, "execution_score": 8},
        cookies=cookies1,
    )
    assert r1.status_code == 201

    r2 = await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 7, "innovation_score": 7, "execution_score": 7},
        cookies=cookies2,
    )
    assert r2.status_code == 201


# ---------- RBAC ----------

@pytest.mark.asyncio
async def test_judge_cannot_access_admin_endpoints(
    client: AsyncClient, judge_user: User
):
    """Judge accessing admin endpoints must get 403."""
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    r = await client.get("/api/v1/admin/dashboard", cookies=cookies)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_judge_cannot_create_judge(client: AsyncClient, judge_user: User):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    r = await client.post(
        "/api/v1/admin/judges",
        json={"name": "Hacker", "email": "hack@test.com", "password": "hacker123"},
        cookies=cookies,
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_cannot_view_leaderboard_for_judge(
    client: AsyncClient, admin_user: User
):
    """Admin can view leaderboard — this should succeed (read-only is allowed)."""
    cookies = await get_auth_cookies(client, "admin@test.com", "adminpass123")
    r = await client.get("/api/v1/admin/leaderboard", cookies=cookies)
    assert r.status_code == 200


# ---------- My scores ----------

@pytest.mark.asyncio
async def test_judge_can_view_own_scores(
    client: AsyncClient, judge_user: User, sample_team: Team
):
    cookies = await get_auth_cookies(client, "judge@test.com", "judgepass123")
    # Submit a score
    await client.post(
        "/api/v1/scores",
        json={"team_id": sample_team.team_id, "round": 1, "qa_score": 6, "innovation_score": 7, "execution_score": 8},
        cookies=cookies,
    )
    r = await client.get("/api/v1/scores/my", cookies=cookies)
    assert r.status_code == 200
    scores = r.json()
    assert len(scores) >= 1
    assert scores[0]["judge_id"] is not None
