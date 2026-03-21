from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from backend.app.core.dependencies import CurrentUser, ReminderServiceDep
from backend.app.schemas.reminder import (
    ReminderCreate,
    ReminderRead,
    ReminderSyncResponse,
    ReminderUpdate,
)


router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("/", response_model=List[ReminderRead])
async def list_reminders(
    current_user: CurrentUser,
    service: ReminderServiceDep,
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=200, description="Max records to return"),
) -> List[ReminderRead]:
    reminders = await service.list_reminders(current_user.id, skip=skip, limit=limit)
    return [ReminderRead.model_validate(r) for r in reminders]


@router.post("/", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    data: ReminderCreate,
    current_user: CurrentUser,
    service: ReminderServiceDep,
) -> ReminderRead:
    reminder = await service.create_reminder(current_user.id, data)
    return ReminderRead.model_validate(reminder)


@router.get("/sync", response_model=ReminderSyncResponse)
async def sync_reminders(
    current_user: CurrentUser,
    service: ReminderServiceDep,
    since: Optional[datetime] = Query(default=None),
) -> ReminderSyncResponse:
    reminders = await service.list_changed_since(current_user.id, since)
    now = datetime.now(timezone.utc)
    return ReminderSyncResponse(
        reminders=[ReminderRead.model_validate(r) for r in reminders],
        last_sync_at=now,
    )


@router.get("/{reminder_id}", response_model=ReminderRead)
async def get_reminder(
    reminder_id: UUID,
    current_user: CurrentUser,
    service: ReminderServiceDep,
) -> ReminderRead:
    reminder = await service.get_reminder(current_user.id, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return ReminderRead.model_validate(reminder)


@router.patch("/{reminder_id}", response_model=ReminderRead)
async def update_reminder(
    reminder_id: UUID,
    data: ReminderUpdate,
    current_user: CurrentUser,
    service: ReminderServiceDep,
) -> ReminderRead:
    reminder = await service.get_reminder(current_user.id, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder = await service.update_reminder(reminder, data)
    return ReminderRead.model_validate(reminder)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: UUID,
    current_user: CurrentUser,
    service: ReminderServiceDep,
) -> None:
    reminder = await service.get_reminder(current_user.id, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    await service.delete_reminder(reminder)
    return None


@router.post("/{reminder_id}/toggle", response_model=ReminderRead)
async def toggle_reminder(
    reminder_id: UUID,
    current_user: CurrentUser,
    service: ReminderServiceDep,
) -> ReminderRead:
    reminder = await service.get_reminder(current_user.id, reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder.is_active = not reminder.is_active
    reminder = await service.update_reminder(reminder, ReminderUpdate())
    return ReminderRead.model_validate(reminder)
