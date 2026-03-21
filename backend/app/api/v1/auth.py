from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import CurrentUser
from backend.app.core.security import decode_token
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.user import (
    RefreshTokenRequest,
    TokenPair,
    UserCreate,
    UserLogin,
    UserRead,
)
from backend.app.services.auth_service import AuthService

limiter = Limiter(key_func=get_remote_address)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, summary="Register a new user")
@limiter.limit("5/minute")
async def register_user(
    request: Request, data: UserCreate, db: AsyncSession = Depends(get_db)
) -> UserRead:
    service = AuthService(db)
    user = await service.register(data)
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenPair, summary="Login and obtain tokens")
@limiter.limit("5/minute")
async def login(
    request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    service = AuthService(db)
    return await service.login(data)


@router.post(
    "/refresh", response_model=TokenPair, summary="Refresh access and refresh tokens"
)
@limiter.limit("10/minute")
async def refresh_tokens(
    request: Request, data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    payload = decode_token(data.refresh_token, token_type="refresh")
    user_id = payload.get("sub")
    token_version = payload.get("tv", 0)

    # Use string comparison — User.id is String(36) in SQLite
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active or user.token_version != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    service = AuthService(db)
    return await service.refresh(user)


@router.post("/logout", summary="Logout and revoke tokens")
async def logout(current_user: CurrentUser, db: AsyncSession = Depends(get_db)) -> dict:
    service = AuthService(db)
    await service.revoke_tokens(current_user)
    return {"detail": "Logged out"}
