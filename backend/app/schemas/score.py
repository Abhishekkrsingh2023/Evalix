import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


# ── Round 1 submit payload ───────────────────────────────────────────────────
class Round1ScoreSubmit(BaseModel):
    innovation_creativity_score: int = Field(ge=0, le=10, description="Innovation & Creativity score (0-10)")
    technical_implementation_score: int = Field(ge=0, le=10, description="Technical Implementation score (0-10)")
    ui_ux_score: int = Field(ge=0, le=10, description="UI & UX score (0-10)")
    impact_scope_score: int = Field(ge=0, le=10, description="Impact & Scope score (0-10)")
    research_development_score: int = Field(ge=0, le=10, description="Research & Development score (0-10)")


# ── Round 2 submit payload ───────────────────────────────────────────────────
class Round2ScoreSubmit(BaseModel):
    project_completeness_score: int = Field(ge=0, le=10, description="Project Completeness score (0-10)")
    deployment_github_score: int = Field(ge=0, le=10, description="Deployment & GitHub Source Code score (0-10)")
    qa_score: int = Field(ge=0, le=10, description="Q&A score (0-10)")
    testing_prototype_score: int = Field(ge=0, le=10, description="Testing & Working Prototype score (0-10)")
    documentation_score: int = Field(ge=0, le=10, description="Documentation score (0-10)")


class ScoreSubmit(BaseModel):
    team_id: str = Field(description="The team's team_id string (e.g. INNOV8-001)")
    round: int = Field(ge=1, le=2, description="Judging round: 1 or 2")

    # Round 1 criteria (required only for round=1, default 0 for round=2)
    innovation_creativity_score: int = Field(default=0, ge=0, le=10, description="Innovation & Creativity (Round 1)")
    technical_implementation_score: int = Field(default=0, ge=0, le=10, description="Technical Implementation (Round 1)")
    ui_ux_score: int = Field(default=0, ge=0, le=10, description="UI & UX (Round 1)")
    impact_scope_score: int = Field(default=0, ge=0, le=10, description="Impact & Scope (Round 1)")
    research_development_score: int = Field(default=0, ge=0, le=10, description="Research & Development (Round 1)")

    # Round 2 criteria (required only for round=2, default 0 for round=1)
    project_completeness_score: int = Field(default=0, ge=0, le=10, description="Project Completeness (Round 2)")
    deployment_github_score: int = Field(default=0, ge=0, le=10, description="Deployment & GitHub Source Code (Round 2)")
    qa_score: int = Field(default=0, ge=0, le=10, description="Q&A (Round 2)")
    testing_prototype_score: int = Field(default=0, ge=0, le=10, description="Testing & Working Prototype (Round 2)")
    documentation_score: int = Field(default=0, ge=0, le=10, description="Documentation (Round 2)")

    # Note: total_score is NOT accepted from client — computed server-side


class ScoreResponse(BaseModel):
    id: uuid.UUID
    judge_id: uuid.UUID
    judge_name: str
    team_id: uuid.UUID
    team_identifier: str  # The human-readable team_id string
    team_name: str
    round: int

    # Round 1 criteria
    innovation_creativity_score: int
    technical_implementation_score: int
    ui_ux_score: int
    impact_scope_score: int
    research_development_score: int

    # Round 2 criteria
    project_completeness_score: int
    deployment_github_score: int
    qa_score: int
    testing_prototype_score: int
    documentation_score: int

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
