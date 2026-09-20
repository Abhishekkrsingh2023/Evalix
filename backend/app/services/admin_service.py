import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.score import Score
from app.models.team import Team
from app.models.user import User, UserRole
from app.schemas.admin import (
    DashboardStats,
    JudgeCreate,
    JudgeResponse,
    JudgeStats,
    LeaderboardResponse,
    TeamLeaderboardEntry,
)


async def create_judge(db: AsyncSession, data: JudgeCreate) -> User:
    """Create a new judge user. Raises 409 if email exists."""
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{data.email}' is already registered.",
        )
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.JUDGE,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def list_judges(db: AsyncSession) -> list[User]:
    """List all judges."""
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.JUDGE)
        .order_by(User.name)
    )
    return list(result.scalars().all())


async def get_judge_stats(db: AsyncSession, judge_id: uuid.UUID) -> JudgeStats:
    """Get stats for a judge (score counts)."""
    result = await db.execute(select(User).where(User.id == judge_id, User.role == UserRole.JUDGE))
    judge = result.scalar_one_or_none()
    if not judge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Judge not found.")

    total_result = await db.execute(
        select(func.count()).select_from(Score).where(Score.judge_id == judge_id)
    )
    total = total_result.scalar_one()

    r1_result = await db.execute(
        select(func.count()).select_from(Score).where(Score.judge_id == judge_id, Score.round == 1)
    )
    r1_count = r1_result.scalar_one()

    r2_result = await db.execute(
        select(func.count()).select_from(Score).where(Score.judge_id == judge_id, Score.round == 2)
    )
    r2_count = r2_result.scalar_one()

    return JudgeStats(
        judge=JudgeResponse.model_validate(judge),
        total_scores_submitted=total,
        round_1_count=r1_count,
        round_2_count=r2_count,
    )


async def update_judge_status(
    db: AsyncSession, judge_id: uuid.UUID, is_active: bool
) -> User:
    """Activate or deactivate a judge."""
    result = await db.execute(
        select(User).where(User.id == judge_id, User.role == UserRole.JUDGE)
    )
    judge = result.scalar_one_or_none()
    if not judge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Judge not found.")
    judge.is_active = is_active
    await db.commit()
    await db.refresh(judge)
    return judge


async def reset_judge_password(
    db: AsyncSession, judge_id: uuid.UUID, new_password: str
) -> None:
    """Reset a judge's password."""
    result = await db.execute(
        select(User).where(User.id == judge_id, User.role == UserRole.JUDGE)
    )
    judge = result.scalar_one_or_none()
    if not judge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Judge not found.")
    judge.password_hash = hash_password(new_password)
    await db.commit()


async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
    """Admin dashboard aggregate statistics."""
    total_teams = (await db.execute(select(func.count()).select_from(Team))).scalar_one()
    total_judges = (
        await db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.JUDGE)
        )
    ).scalar_one()

    r1_subs = (
        await db.execute(select(func.count()).select_from(Score).where(Score.round == 1))
    ).scalar_one()
    r2_subs = (
        await db.execute(select(func.count()).select_from(Score).where(Score.round == 2))
    ).scalar_one()

    # Teams with at least 1 judge having submitted both rounds
    from sqlalchemy import and_, distinct
    subq = (
        select(Score.team_id)
        .group_by(Score.team_id, Score.judge_id)
        .having(
            func.count(distinct(Score.round)) == 2
        )
        .subquery()
    )
    completed_teams = (
        await db.execute(select(func.count(distinct(subq.c.team_id))))
    ).scalar_one()

    pending_teams = total_teams - completed_teams

    return DashboardStats(
        total_teams=total_teams,
        total_judges=total_judges,
        round_1_submissions=r1_subs,
        round_2_submissions=r2_subs,
        completed_teams=completed_teams,
        pending_teams=pending_teams,
    )


async def get_leaderboard(
    db: AsyncSession, round_filter: Optional[str] = None
) -> LeaderboardResponse:
    """
    Build the final leaderboard.
    Algorithm:
      - For each team, collect all Round 1 scores across all judges → average
      - Collect all Round 2 scores → average  
      - Overall = average of ALL submitted scores (rounds 1 and 2)
      - Sort by round_1_avg, round_2_avg, or overall_avg based on round_filter
    """
    teams_result = await db.execute(select(Team).order_by(Team.team_id))
    teams = list(teams_result.scalars().all())

    total_judges = (
        await db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.JUDGE)
        )
    ).scalar_one()

    entries: list[TeamLeaderboardEntry] = []

    for team in teams:
        scores_result = await db.execute(
            select(Score).where(Score.team_id == team.id)
        )
        scores = list(scores_result.scalars().all())

        r1 = [s.total_score for s in scores if s.round == 1]
        r2 = [s.total_score for s in scores if s.round == 2]
        all_s = r1 + r2

        r1_avg = round(sum(r1) / len(r1), 2) if r1 else None
        r2_avg = round(sum(r2) / len(r2), 2) if r2 else None
        overall_avg = round(sum(all_s) / len(all_s), 2) if all_s else None

        # Count unique judges who scored this team in both rounds
        judge_ids_with_both = set()
        from itertools import groupby
        judge_scores: dict[uuid.UUID, set[int]] = {}
        for s in scores:
            judge_scores.setdefault(s.judge_id, set()).add(s.round)
        judges_completed = sum(1 for rounds in judge_scores.values() if len(rounds) == 2)

        if not scores:
            st = "pending"
        elif r1 and r2:
            st = "complete"
        else:
            st = "partial"

        entries.append(
            TeamLeaderboardEntry(
                rank=0,  # filled below
                team_id=team.team_id,
                team_name=team.team_name,
                leader_name=team.leader_name,
                round_1_avg=r1_avg,
                round_2_avg=r2_avg,
                overall_avg=overall_avg,
                judges_completed=judges_completed,
                total_submissions=len(scores),
                status=st,
            )
        )

    # Sort based on round_filter (None goes last)
    if round_filter == "1":
        entries.sort(key=lambda e: e.round_1_avg if e.round_1_avg is not None else -1, reverse=True)
    elif round_filter == "2":
        entries.sort(key=lambda e: e.round_2_avg if e.round_2_avg is not None else -1, reverse=True)
    else:
        entries.sort(key=lambda e: e.overall_avg if e.overall_avg is not None else -1, reverse=True)

    for i, entry in enumerate(entries, start=1):
        entry.rank = i

    return LeaderboardResponse(
        entries=entries,
        total_teams=len(teams),
        total_judges=total_judges,
    )
