import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.score import ScoreResponse
from app.schemas.team import TeamResponse


# --- Judge management ---
class JudgeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class JudgeUpdate(BaseModel):
    is_active: bool


class JudgeResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class JudgeStats(BaseModel):
    judge: JudgeResponse
    total_scores_submitted: int
    round_1_count: int
    round_2_count: int


# --- Admin dashboard ---
class DashboardStats(BaseModel):
    total_teams: int
    total_judges: int
    round_1_submissions: int
    round_2_submissions: int
    completed_teams: int  # Teams with both rounds from at least 1 judge
    pending_teams: int


# --- Leaderboard ---
class TeamLeaderboardEntry(BaseModel):
    rank: int
    team_id: str
    team_name: str
    leader_name: str
    round_1_avg: Optional[float] = None
    round_2_avg: Optional[float] = None
    overall_avg: Optional[float] = None
    judges_completed: int
    total_submissions: int
    status: str  # "complete", "partial", "pending"


class LeaderboardResponse(BaseModel):
    entries: list[TeamLeaderboardEntry]
    total_teams: int
    total_judges: int


# --- Team detail with judge scores ---
class JudgeRoundScore(BaseModel):
    round: int
    qa_score: int
    innovation_score: int
    execution_score: int
    total_score: int
    submitted_at: datetime


class JudgeScoreDetail(BaseModel):
    judge_id: uuid.UUID
    judge_name: str
    judge_email: str
    round_1: Optional[JudgeRoundScore] = None
    round_2: Optional[JudgeRoundScore] = None
    judge_total: Optional[int] = None


class TeamDetailWithScores(BaseModel):
    team: TeamResponse
    judge_scores: list[JudgeScoreDetail]
    round_1_avg: Optional[float] = None
    round_2_avg: Optional[float] = None
    overall_avg: Optional[float] = None
    total_submissions: int
