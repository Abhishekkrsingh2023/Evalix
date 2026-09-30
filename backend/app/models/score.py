import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
    event,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = (
        # Core immutability constraint: one score per judge per team per round
        UniqueConstraint("judge_id", "team_id", "round", name="uq_judge_team_round"),
        # Validate round values
        CheckConstraint("round IN (1, 2)", name="ck_valid_round"),

        # ── Round 1 criteria (max 10 each) ──────────────────────────────────
        CheckConstraint(
            "innovation_creativity_score >= 0 AND innovation_creativity_score <= 10",
            name="ck_innovation_creativity_score",
        ),
        CheckConstraint(
            "technical_implementation_score >= 0 AND technical_implementation_score <= 10",
            name="ck_technical_implementation_score",
        ),
        CheckConstraint(
            "ui_ux_score >= 0 AND ui_ux_score <= 10",
            name="ck_ui_ux_score",
        ),
        CheckConstraint(
            "impact_scope_score >= 0 AND impact_scope_score <= 10",
            name="ck_impact_scope_score",
        ),
        CheckConstraint(
            "research_development_score >= 0 AND research_development_score <= 10",
            name="ck_research_development_score",
        ),

        # ── Round 2 criteria (max 10 each) ──────────────────────────────────
        CheckConstraint(
            "project_completeness_score >= 0 AND project_completeness_score <= 10",
            name="ck_project_completeness_score",
        ),
        CheckConstraint(
            "deployment_github_score >= 0 AND deployment_github_score <= 10",
            name="ck_deployment_github_score",
        ),
        CheckConstraint(
            "qa_score >= 0 AND qa_score <= 10",
            name="ck_qa_score",
        ),
        CheckConstraint(
            "testing_prototype_score >= 0 AND testing_prototype_score <= 10",
            name="ck_testing_prototype_score",
        ),
        CheckConstraint(
            "documentation_score >= 0 AND documentation_score <= 10",
            name="ck_documentation_score",
        ),

        # Total must equal the sum of whichever round's criteria are used
        # Round 1: innovation_creativity + technical_implementation + ui_ux + impact_scope + research_development
        # Round 2: project_completeness + deployment_github + qa + testing_prototype + documentation
        CheckConstraint(
            """
            (round = 1 AND total_score = innovation_creativity_score + technical_implementation_score + ui_ux_score + impact_scope_score + research_development_score)
            OR
            (round = 2 AND total_score = project_completeness_score + deployment_github_score + qa_score + testing_prototype_score + documentation_score)
            """,
            name="ck_total_score",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    judge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    round: Mapped[int] = mapped_column(Integer, nullable=False)

    # ── Round 1 criteria ────────────────────────────────────────────────────
    innovation_creativity_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    technical_implementation_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ui_ux_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    impact_scope_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    research_development_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Round 2 criteria ────────────────────────────────────────────────────
    project_completeness_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    deployment_github_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    qa_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    testing_prototype_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    documentation_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    total_score: Mapped[int] = mapped_column(Integer, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    judge: Mapped["User"] = relationship("User", back_populates="scores", lazy="joined")
    team: Mapped["Team"] = relationship("Team", back_populates="scores", lazy="joined")

    def __repr__(self) -> str:
        return f"<Score judge={self.judge_id} team={self.team_id} round={self.round} total={self.total_score}>"
