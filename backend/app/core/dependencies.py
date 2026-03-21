from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.core.security import decode_token
from backend.app.db.session import get_db
from backend.app.models.user import User


reusable_oauth2 = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(reusable_oauth2)],
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = credentials.credentials
    payload = decode_token(token, token_type="access")
    user_id_str: str = payload.get("sub")
    token_version: int = payload.get("tv", 0)

    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    result = await db.execute(select(User).where(User.id == user_id_str))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    if user.token_version != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# ---------------------------------------------------------------------------
# Service dependency factories — inject via Depends() for cleaner DI and
# easier testing (services can be overridden in app.dependency_overrides).
# ---------------------------------------------------------------------------

from backend.app.services.auth_service import AuthService  # noqa: E402
from backend.app.services.reminder_service import ReminderService  # noqa: E402
from backend.app.services.completion_service import CompletionService  # noqa: E402
from backend.app.services.device_service import DeviceService  # noqa: E402


async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


async def get_reminder_service(db: AsyncSession = Depends(get_db)) -> ReminderService:
    return ReminderService(db)


async def get_completion_service(
    db: AsyncSession = Depends(get_db),
) -> CompletionService:
    return CompletionService(db)


async def get_device_service(db: AsyncSession = Depends(get_db)) -> DeviceService:
    return DeviceService(db)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
ReminderServiceDep = Annotated[ReminderService, Depends(get_reminder_service)]
CompletionServiceDep = Annotated[CompletionService, Depends(get_completion_service)]
DeviceServiceDep = Annotated[DeviceService, Depends(get_device_service)]
