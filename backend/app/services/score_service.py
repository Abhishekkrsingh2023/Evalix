import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.score import Score
from app.models.team import Team
from app.models.user import User
from app.schemas.score import ScoreSubmit, ScoreResponse, RoundScoreStatus, TeamScoreStatus
from app.schemas.admin import (
    JudgeRoundScore,
    JudgeScoreDetail,
    TeamDetailWithScores,
)
from app.services.team_service import get_team_by_team_id


def _build_score_response(score: Score) -> ScoreResponse:
    return ScoreResponse(
        id=score.id,
        judge_id=score.judge_id,
        judge_name=score.judge.name,
        team_id=score.team_id,
        team_identifier=score.team.team_id,
        team_name=score.team.team_name,
        round=score.round,
        qa_score=score.qa_score,
        innovation_score=score.innovation_score,
        execution_score=score.execution_score,
        total_score=score.total_score,
        submitted_at=score.submitted_at,
    )


async def submit_score(
    db: AsyncSession,
    judge: User,
    data: ScoreSubmit,
) -> ScoreResponse:
    """
    Submit a score for a team/round.
    
    Immutability enforcement:
    1. Service-layer duplicate check → 409 before DB hit
    2. DB UNIQUE(judge_id, team_id, round) constraint as final guard
    3. No PUT/PATCH/DELETE endpoints exist for scores
    """
    # Resolve team
    team = await get_team_by_team_id(db, data.team_id)

    # Check for existing score (service-layer immutability guard)
    existing = await db.execute(
        select(Score).where(
            Score.judge_id == judge.id,
            Score.team_id == team.id,
            Score.round == data.round,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You have already submitted scores for {team.team_id} Round {data.round}. Scores are immutable.",
        )

    # Enforce sequential round scoring: Round 1 (Day 1) must be submitted before Round 2 (Day 2)
    if data.round == 2:
        r1_score = await db.execute(
            select(Score).where(
                Score.judge_id == judge.id,
                Score.team_id == team.id,
                Score.round == 1,
            )
        )
        if not r1_score.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You must submit Round 1 (Day 1) scores before scoring Round 2 (Day 2) for {team.team_id}.",
            )

    # Compute total server-side (never trust frontend)
    total = data.qa_score + data.innovation_score + data.execution_score

    score = Score(
        judge_id=judge.id,
        team_id=team.id,
        round=data.round,
        qa_score=data.qa_score,
        innovation_score=data.innovation_score,
        execution_score=data.execution_score,
        total_score=total,
    )
    db.add(score)

    try:
        await db.commit()
    except Exception as exc:
        await db.rollback()
        # Handle DB unique constraint violation (race condition guard)
        if "uq_judge_team_round" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"You have already submitted scores for {team.team_id} Round {data.round}.",
            )
        raise

    await db.refresh(score)

    # Reload with relationships
    result = await db.execute(
        select(Score)
        .where(Score.id == score.id)
        .options(selectinload(Score.judge), selectinload(Score.team))
    )
    score = result.scalar_one()
    return _build_score_response(score)


async def get_my_scores(db: AsyncSession, judge: User) -> list[ScoreResponse]:
    """Get all scores submitted by this judge."""
    result = await db.execute(
        select(Score)
        .where(Score.judge_id == judge.id)
        .options(selectinload(Score.judge), selectinload(Score.team))
        .order_by(Score.submitted_at.desc())
    )
    scores = result.scalars().all()
    return [_build_score_response(s) for s in scores]


async def get_team_scores(db: AsyncSession, team_id: str) -> list[ScoreResponse]:
    """Get all scores for a team across all judges and rounds."""
    team = await get_team_by_team_id(db, team_id)
    result = await db.execute(
        select(Score)
        .where(Score.team_id == team.id)
        .options(selectinload(Score.judge), selectinload(Score.team))
        .order_by(Score.round, Score.submitted_at)
    )
    scores = result.scalars().all()
    return [_build_score_response(s) for s in scores]


async def get_team_round_score(
    db: AsyncSession, judge: User, team_id: str, round_num: int
) -> Optional[ScoreResponse]:
    """Get this judge's score for a specific team/round."""
    team = await get_team_by_team_id(db, team_id)
    result = await db.execute(
        select(Score)
        .where(
            Score.judge_id == judge.id,
            Score.team_id == team.id,
            Score.round == round_num,
        )
        .options(selectinload(Score.judge), selectinload(Score.team))
    )
    score = result.scalar_one_or_none()
    return _build_score_response(score) if score else None


async def get_team_score_status(
    db: AsyncSession, judge: User, team_id: str
) -> TeamScoreStatus:
    """Get full scoring status for a team from this judge's perspective."""
    team = await get_team_by_team_id(db, team_id)

    r1_score = await get_team_round_score(db, judge, team_id, 1)
    r2_score = await get_team_round_score(db, judge, team_id, 2)

    return TeamScoreStatus(
        team_id=team.team_id,
        team_name=team.team_name,
        leader_name=team.leader_name,
        round_1=RoundScoreStatus(round=1, submitted=r1_score is not None, score=r1_score),
        round_2=RoundScoreStatus(round=2, submitted=r2_score is not None, score=r2_score),
    )


async def get_team_detail_with_scores(
    db: AsyncSession, team_id: str
) -> TeamDetailWithScores:
    """
    Admin view: all judge scores for a team, with aggregated averages.
    Aggregation: average of all judge totals per round.
    """
    from app.schemas.team import TeamResponse

    team = await get_team_by_team_id(db, team_id)

    result = await db.execute(
        select(Score)
        .where(Score.team_id == team.id)
        .options(selectinload(Score.judge), selectinload(Score.team))
    )
    all_scores = result.scalars().all()

    # Group by judge
    judge_map: dict[uuid.UUID, JudgeScoreDetail] = {}
    for score in all_scores:
        jid = score.judge_id
        if jid not in judge_map:
            judge_map[jid] = JudgeScoreDetail(
                judge_id=jid,
                judge_name=score.judge.name,
                judge_email=score.judge.email,
            )
        round_score = JudgeRoundScore(
            round=score.round,
            qa_score=score.qa_score,
            innovation_score=score.innovation_score,
            execution_score=score.execution_score,
            total_score=score.total_score,
            submitted_at=score.submitted_at,
        )
        if score.round == 1:
            judge_map[jid].round_1 = round_score
        else:
            judge_map[jid].round_2 = round_score

    # Compute judge totals
    judge_details = list(judge_map.values())
    for jd in judge_details:
        r1 = jd.round_1.total_score if jd.round_1 else None
        r2 = jd.round_2.total_score if jd.round_2 else None
        if r1 is not None and r2 is not None:
            jd.judge_total = r1 + r2
        elif r1 is not None:
            jd.judge_total = r1
        elif r2 is not None:
            jd.judge_total = r2

    # Calculate averages
    r1_totals = [s.total_score for s in all_scores if s.round == 1]
    r2_totals = [s.total_score for s in all_scores if s.round == 2]
    all_totals = r1_totals + r2_totals

    r1_avg = sum(r1_totals) / len(r1_totals) if r1_totals else None
    r2_avg = sum(r2_totals) / len(r2_totals) if r2_totals else None
    overall_avg = sum(all_totals) / len(all_totals) if all_totals else None

    return TeamDetailWithScores(
        team=TeamResponse.model_validate(team),
        judge_scores=judge_details,
        round_1_avg=round(r1_avg, 2) if r1_avg is not None else None,
        round_2_avg=round(r2_avg, 2) if r2_avg is not None else None,
        overall_avg=round(overall_avg, 2) if overall_avg is not None else None,
        total_submissions=len(all_scores),
    )
