from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole
import uuid
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"

    model_config = {"from_attributes": True}


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None
