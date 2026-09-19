import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TeamCreate(BaseModel):
    team_id: str = Field(min_length=1, max_length=50, pattern=r"^[A-Za-z0-9\-_]+$")
    team_name: str = Field(min_length=1, max_length=255)
    leader_name: str = Field(min_length=1, max_length=255)

    @field_validator("team_id")
    @classmethod
    def team_id_uppercase(cls, v: str) -> str:
        return v.upper()


class TeamResponse(BaseModel):
    id: uuid.UUID
    team_id: str
    team_name: str
    leader_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TeamListResponse(BaseModel):
    teams: list[TeamResponse]
    total: int
