import uuid
from typing import Optional

from fastapi import APIRouter, Body, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_admin
from app.models.user import User
from app.schemas.admin import (
    DashboardStats,
    JudgeCreate,
    JudgeResponse,
    JudgeStats,
    JudgeUpdate,
    LeaderboardResponse,
    TeamDetailWithScores,
)
from app.schemas.team import TeamCreate, TeamListResponse, TeamResponse
from app.services import admin_service, score_service, team_service

router = APIRouter(prefix="/admin", tags=["Admin"])


# --- Dashboard ---
@router.get(
    "/dashboard",
    response_model=DashboardStats,
    summary="Admin dashboard statistics",
)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> DashboardStats:
    """Overall hackathon statistics."""
    return await admin_service.get_dashboard_stats(db)


# --- Leaderboard ---
@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    summary="Final leaderboard / results",
)
async def leaderboard(
    round: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> LeaderboardResponse:
    """
    Sorted leaderboard by overall average score or round (1, 2, final).
    Aggregation: average of all submitted scores per round, then combined.
    READ-ONLY — scores cannot be modified.
    """
    return await admin_service.get_leaderboard(db, round_filter=round)


# --- Team management ---
@router.post(
    "/teams",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new team",
)
async def create_team(
    data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> TeamResponse:
    """Register a new hackathon team."""
    team = await team_service.create_team(db, data)
    return TeamResponse.model_validate(team)


@router.get(
    "/teams",
    response_model=TeamListResponse,
    summary="List all teams with scores summary",
)
async def list_teams(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> TeamListResponse:
    """List all registered teams."""
    teams, total = await team_service.list_teams(db, search=search, skip=skip, limit=limit)
    return TeamListResponse(
        teams=[TeamResponse.model_validate(t) for t in teams],
        total=total,
    )


@router.get(
    "/teams/{team_id}",
    response_model=TeamDetailWithScores,
    summary="Team detail with all judge scores",
)
async def team_detail(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> TeamDetailWithScores:
    """
    Full team detail: per-judge, per-round scores + aggregated averages.
    READ-ONLY view — no modification is possible.
    """
    return await score_service.get_team_detail_with_scores(db, team_id)


# --- Judge management ---
@router.get(
    "/judges",
    response_model=list[JudgeStats],
    summary="List all judges with stats",
)
async def list_judges(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list[JudgeStats]:
    """List all judges with their scoring statistics."""
    judges = await admin_service.list_judges(db)
    result = []
    for judge in judges:
        stats = await admin_service.get_judge_stats(db, judge.id)
        result.append(stats)
    return result


@router.post(
    "/judges",
    response_model=JudgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new judge",
)
async def create_judge(
    data: JudgeCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> JudgeResponse:
    """Create a new judge account."""
    judge = await admin_service.create_judge(db, data)
    return JudgeResponse.model_validate(judge)


@router.patch(
    "/judges/{judge_id}/status",
    response_model=JudgeResponse,
    summary="Activate or deactivate a judge",
)
async def update_judge_status(
    judge_id: uuid.UUID,
    data: JudgeUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> JudgeResponse:
    """Enable or disable a judge's login access."""
    judge = await admin_service.update_judge_status(db, judge_id, data.is_active)
    return JudgeResponse.model_validate(judge)


@router.post(
    "/judges/{judge_id}/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Reset a judge's password",
)
async def reset_judge_password(
    judge_id: uuid.UUID,
    new_password: str = Body(embed=True, min_length=8),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> None:
    """Reset a judge's password. Admin use only."""
    await admin_service.reset_judge_password(db, judge_id, new_password)
