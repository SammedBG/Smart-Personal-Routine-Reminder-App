from backend.app.core.dependencies import CurrentUser
from backend.app.core.security import get_password_hash, verify_password
from backend.app.db.session import get_db
from backend.app.schemas.user import PasswordChange, UserRead, UserUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead, summary="Get current user profile")
async def get_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead, summary="Update current user profile")
async def update_me(
    payload: UserUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.add(current_user)
    await db.flush()
    return UserRead.model_validate(current_user)


@router.post("/me/password", status_code=status.HTTP_200_OK, summary="Change password")
async def change_password(
    payload: PasswordChange,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    current_user.password_hash = get_password_hash(payload.new_password)
    db.add(current_user)
    await db.flush()
    return {"message": "Password updated successfully"}


@router.delete("/me", status_code=status.HTTP_200_OK, summary="Delete account")
async def delete_account(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await db.delete(current_user)
    await db.flush()
    return {"message": "Account deleted"}
