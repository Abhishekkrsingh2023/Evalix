import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class ScoreSubmit(BaseModel):
    team_id: str = Field(description="The team's team_id string (e.g. INNOV8-001)")
    round: int = Field(ge=1, le=2, description="Judging round: 1 or 2")
    qa_score: int = Field(ge=0, le=10, description="Q&A score (0-10)")
    innovation_score: int = Field(ge=0, le=10, description="Innovation & Originality score (0-10)")
    execution_score: int = Field(ge=0, le=10, description="Execution & MVP score (0-10)")

    # Note: total_score is NOT accepted from client — computed server-side


class ScoreResponse(BaseModel):
    id: uuid.UUID
    judge_id: uuid.UUID
    judge_name: str
    team_id: uuid.UUID
    team_identifier: str  # The human-readable team_id string
    team_name: str
    round: int
    qa_score: int
    innovation_score: int
    execution_score: int
    total_score: int
    submitted_at: datetime

    model_config = {"from_attributes": True}


class RoundScoreStatus(BaseModel):
    round: int
    submitted: bool
    score: Optional[ScoreResponse] = None


class TeamScoreStatus(BaseModel):
    """Status of judging for a team from a specific judge's perspective."""
    team_id: str
    team_name: str
    leader_name: str
    round_1: RoundScoreStatus
    round_2: RoundScoreStatus
