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
        # Validate score ranges
        CheckConstraint("qa_score >= 0 AND qa_score <= 10", name="ck_qa_score"),
        CheckConstraint(
            "innovation_score >= 0 AND innovation_score <= 10", name="ck_innovation_score"
        ),
        CheckConstraint(
            "execution_score >= 0 AND execution_score <= 10", name="ck_execution_score"
        ),
        CheckConstraint(
            "total_score = qa_score + innovation_score + execution_score",
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
    qa_score: Mapped[int] = mapped_column(Integer, nullable=False)
    innovation_score: Mapped[int] = mapped_column(Integer, nullable=False)
    execution_score: Mapped[int] = mapped_column(Integer, nullable=False)
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
