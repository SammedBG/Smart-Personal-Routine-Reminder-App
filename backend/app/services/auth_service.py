from datetime import UTC, datetime

from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from backend.app.models.user import User
from backend.app.repositories.user_repository import UserRepository
from backend.app.schemas.user import TokenPair, UserCreate, UserLogin
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)

    async def register(self, data: UserCreate) -> User:
        existing = await self.users.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )

        user = User(
            email=data.email,
            full_name=data.full_name,
            password_hash=get_password_hash(data.password),
            timezone=data.timezone,
        )
        await self.users.create(user)
        return user

    async def login(self, data: UserLogin) -> TokenPair:
        user = await self.users.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        user.last_login_at = datetime.now(UTC)
        await self.users.save(user)

        access = create_access_token(str(user.id), user.token_version)
        refresh = create_refresh_token(str(user.id), user.token_version)
        return TokenPair(access_token=access, refresh_token=refresh)

    async def refresh(self, user: User) -> TokenPair:
        access = create_access_token(str(user.id), user.token_version)
        refresh = create_refresh_token(str(user.id), user.token_version)
        return TokenPair(access_token=access, refresh_token=refresh)

    async def revoke_tokens(self, user: User) -> None:
        user.token_version += 1
        await self.users.save(user)
