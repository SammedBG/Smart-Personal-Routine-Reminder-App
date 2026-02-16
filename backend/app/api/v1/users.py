from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import CurrentUser
from backend.app.db.session import get_db
from backend.app.schemas.user import UserRead


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead, summary="Get current user profile")
async def get_me(current_user: CurrentUser) -> UserRead:
    return UserRead.from_orm(current_user)


@router.patch("/me", response_model=UserRead, summary="Update current user profile")
async def update_me(
    payload: dict,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    allowed_fields = {"full_name"}
    for key, value in payload.items():
        if key in allowed_fields:
            setattr(current_user, key, value)
    db.add(current_user)
    await db.flush()
    return UserRead.from_orm(current_user)

