from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import CurrentUser
from backend.app.core.security import decode_token
from backend.app.db.session import get_db
from backend.app.schemas.user import TokenPair, UserCreate, UserLogin, UserRead
from backend.app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, summary="Register a new user")
async def register_user(
    data: UserCreate, db: AsyncSession = Depends(get_db)
) -> UserRead:
    service = AuthService(db)
    user = await service.register(data)
    return UserRead.from_orm(user)


@router.post("/login", response_model=TokenPair, summary="Login and obtain tokens")
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenPair:
    service = AuthService(db)
    return await service.login(data)


@router.post(
    "/refresh", response_model=TokenPair, summary="Refresh access and refresh tokens"
)
async def refresh_tokens(
    refresh_token: str, db: AsyncSession = Depends(get_db)
) -> TokenPair:
    payload = decode_token(refresh_token, token_type="refresh")
    user_id = payload.get("sub")
    token_version = payload.get("tv", 0)

    # Reuse CurrentUser logic by injecting a fake access token is complicated;
    # instead, query user directly here to validate token_version.
    from uuid import UUID

    from sqlalchemy import select

    from backend.app.models.user import User

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active or user.token_version != token_version:
        from fastapi import HTTPException, status

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

