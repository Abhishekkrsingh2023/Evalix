from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_judge
from app.models.user import User
from app.schemas.score import ScoreResponse, ScoreSubmit, TeamScoreStatus
from app.services import score_service

router = APIRouter(prefix="/scores", tags=["Scores"])

# NOTE: There are intentionally NO PUT, PATCH, or DELETE endpoints for scores.
# Score immutability is enforced at service + DB level.


@router.post(
    "",
    response_model=ScoreResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a score for a team/round (Judge only)",
)
async def submit_score(
    data: ScoreSubmit,
    db: AsyncSession = Depends(get_db),
    judge: User = Depends(require_judge),
) -> ScoreResponse:
    """
    Submit scores for a team in a specific round.
    
    **Immutability guarantee**: Once submitted, scores CANNOT be modified.
    - Service layer checks for existing score → 409 Conflict
    - Database UNIQUE(judge_id, team_id, round) prevents duplicates
    - No update/delete endpoints exist
    
    Total score is computed server-side from qa + innovation + execution.
    """
    return await score_service.submit_score(db, judge, data)


@router.get(
    "/my",
    response_model=list[ScoreResponse],
    summary="Get all scores submitted by the current judge",
)
async def my_scores(
    db: AsyncSession = Depends(get_db),
    judge: User = Depends(require_judge),
) -> list[ScoreResponse]:
    """Retrieve all scores submitted by the authenticated judge."""
    return await score_service.get_my_scores(db, judge)


@router.get(
    "/team/{team_id}",
    response_model=list[ScoreResponse],
    summary="Get all scores for a team (Judge sees own scores only; use admin endpoint for all)",
)
async def team_scores(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    judge: User = Depends(require_judge),
) -> list[ScoreResponse]:
    """Get this judge's submitted scores for a specific team."""
    scores = await score_service.get_my_scores(db, judge)
    from app.services import team_service
    team = await team_service.get_team_by_team_id(db, team_id)
    return [s for s in scores if s.team_id == team.id]


@router.get(
    "/team/{team_id}/status",
    response_model=TeamScoreStatus,
    summary="Get this judge's scoring status for a team",
)
async def team_score_status(
    team_id: str,
    db: AsyncSession = Depends(get_db),
    judge: User = Depends(require_judge),
) -> TeamScoreStatus:
    """Get scoring status (submitted or not) for each round for a team."""
    return await score_service.get_team_score_status(db, judge, team_id)


@router.get(
    "/team/{team_id}/round/{round_num}",
    response_model=ScoreResponse | None,
    summary="Get this judge's score for a specific team/round",
)
async def team_round_score(
    team_id: str,
    round_num: int,
    db: AsyncSession = Depends(get_db),
    judge: User = Depends(require_judge),
) -> ScoreResponse | None:
    """Get this judge's submitted score for a specific team and round. Returns null if not submitted."""
    if round_num not in (1, 2):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Round must be 1 or 2.")
    return await score_service.get_team_round_score(db, judge, team_id, round_num)
