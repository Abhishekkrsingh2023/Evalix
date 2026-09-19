from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_admin
from app.models.user import User
from app.schemas.team import TeamCreate, TeamListResponse, TeamResponse
from app.services import team_service

router = APIRouter(prefix="/teams", tags=["Teams"])


@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new team (Admin only)",
)
async def create_team(
    data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> TeamResponse:
    """Register a new team. team_id must be unique (e.g. INNOV8-001)."""
    team = await team_service.create_team(db, data)
    return TeamResponse.model_validate(team)


@router.get(
    "",
    response_model=TeamListResponse,
    summary="List all teams",
)
async def list_teams(
    search: Optional[str] = Query(default=None, description="Search by team_id, name, or leader"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),  # Any authenticated user
) -> TeamListResponse:
    """List all registered teams. Accessible by admins and judges."""
    teams, total = await team_service.list_teams(db, search=search, skip=skip, limit=limit)
    return TeamListResponse(
        teams=[TeamResponse.model_validate(t) for t in teams],
        total=total,
    )


@router.get(
    "/{team_id}",
    response_model=TeamResponse,
    summary="Get team by team_id",
)
async def get_team(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> TeamResponse:
    """Retrieve a team by its human-readable team_id (e.g. INNOV8-001)."""
    team = await team_service.get_team_by_team_id(db, team_id)
    return TeamResponse.model_validate(team)
