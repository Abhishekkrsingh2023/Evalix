from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=UserResponse, summary="Login and receive auth cookies")
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Authenticate with email/password.
    Sets HttpOnly cookies: `access_token` (15min) and `refresh_token` (7d).
    """
    user = await auth_service.login(db, response, data.email, data.password)
    return UserResponse.model_validate(user)


@router.post("/refresh", response_model=UserResponse, summary="Refresh access token")
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None),
) -> UserResponse:
    """
    Use the refresh token cookie to obtain a new access token.
    Implements token rotation — the old refresh token is invalidated.
    """
    if not refresh_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided.")
    user = await auth_service.refresh_tokens(db, response, refresh_token)
    return UserResponse.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Logout and clear cookies")
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None),
) -> None:
    """Revoke refresh token and clear auth cookies."""
    await auth_service.logout(db, response, refresh_token)


@router.get("/me", response_model=UserResponse, summary="Get current user info")
async def me(current_user=Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
