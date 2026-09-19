import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.team import Team
from app.schemas.team import TeamCreate


async def create_team(db: AsyncSession, data: TeamCreate) -> Team:
    """Create a new team. Raises 409 if team_id already exists."""
    result = await db.execute(select(Team).where(Team.team_id == data.team_id))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Team ID '{data.team_id}' already exists.",
        )
    team = Team(
        team_id=data.team_id,
        team_name=data.team_name,
        leader_name=data.leader_name,
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


async def get_team_by_team_id(db: AsyncSession, team_id: str) -> Team:
    """Fetch a team by its human-readable team_id. Raises 404 if not found."""
    result = await db.execute(
        select(Team).where(Team.team_id == team_id.upper())
    )
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team '{team_id}' not found.",
        )
    return team


async def get_team_by_uuid(db: AsyncSession, team_uuid: uuid.UUID) -> Team:
    """Fetch a team by its internal UUID."""
    result = await db.execute(select(Team).where(Team.id == team_uuid))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )
    return team


async def list_teams(
    db: AsyncSession,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Team], int]:
    """List teams with optional search and pagination."""
    query = select(Team)
    if search:
        query = query.where(
            Team.team_id.ilike(f"%{search}%")
            | Team.team_name.ilike(f"%{search}%")
            | Team.leader_name.ilike(f"%{search}%")
        )
    query = query.order_by(Team.team_id)
    result = await db.execute(query.offset(skip).limit(limit))
    teams = list(result.scalars().all())

    # Count
    from sqlalchemy import func, select as sel
    count_query = sel(func.count()).select_from(Team)
    if search:
        count_query = count_query.where(
            Team.team_id.ilike(f"%{search}%")
            | Team.team_name.ilike(f"%{search}%")
            | Team.leader_name.ilike(f"%{search}%")
        )
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    return teams, total
