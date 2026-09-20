from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse, UserResponse
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
    Also returns tokens in response body for clients that block cross-site cookies (e.g. iOS WebKit).
    """
    user, access_token, refresh_token = await auth_service.login(db, response, data.email, data.password)
    res = UserResponse.model_validate(user)
    res.access_token = access_token
    res.refresh_token = refresh_token
    return res


@router.post("/refresh", response_model=UserResponse, summary="Refresh access token")
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None),
    data: Optional[RefreshRequest] = None,
) -> UserResponse:
    """
    Use the refresh token cookie or request body to obtain a new access token.
    Implements token rotation — the old refresh token is invalidated.
    """
    token_to_use = refresh_token or (data.refresh_token if data else None)
    if not token_to_use:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided.")
    user, new_access_token, new_refresh_token = await auth_service.refresh_tokens(db, response, token_to_use)
    res = UserResponse.model_validate(user)
    res.access_token = new_access_token
    res.refresh_token = new_refresh_token
    return res


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Logout and clear cookies")
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None),
    data: Optional[RefreshRequest] = None,
) -> None:
    """Revoke refresh token and clear auth cookies."""
    token_to_revoke = refresh_token or (data.refresh_token if data else None)
    await auth_service.logout(db, response, token_to_revoke)


@router.get("/me", response_model=UserResponse, summary="Get current user info")
async def me(current_user=Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
