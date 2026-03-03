from typing import List
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import CurrentUser
from backend.app.db.session import get_db
from backend.app.schemas.completion import (
    CompletionCreate,
    CompletionRead,
    StreakInfo,
)
from backend.app.services.completion_service import CompletionService
from backend.app.services.reminder_service import ReminderService


router = APIRouter(prefix="/completions", tags=["completions"])


@router.post("/", response_model=CompletionRead, summary="Record a completion action")
async def record_completion(
    data: CompletionCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CompletionRead:
    service = CompletionService(db)
    record = await service.record_completion(str(current_user.id), data)
    return CompletionRead.from_orm(record)


@router.get(
    "/today", response_model=List[CompletionRead], summary="Get today's completions"
)
async def get_today_completions(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> List[CompletionRead]:
    service = CompletionService(db)
    records = await service.get_today_completions(str(current_user.id))
    return [CompletionRead.from_orm(r) for r in records]


@router.get(
    "/streak", response_model=StreakInfo, summary="Get streak and analytics info"
)
async def get_streak_info(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> StreakInfo:
    reminder_service = ReminderService(db)
    all_reminders = await reminder_service.list_reminders(current_user.id)
    # Count only reminders that are active and actually scheduled for today
    today = date.today()
    js_today = (today.weekday() + 1) % 7  # JS convention: 0=Sun

    def _is_scheduled_today(r) -> bool:
        if not r.is_active:
            return False
        if r.start_date and today < r.start_date:
            return False
        if r.end_date and today > r.end_date:
            return False
        if r.repeat_type.value == "daily":
            return True
        if r.repeat_type.value == "once":
            return True
        if r.repeat_type.value in ("weekly", "custom"):
            days = (r.custom_days or {}).get("days", [])
            if not days:
                return True
            return js_today in days
        return True

    total_today = sum(1 for r in all_reminders if _is_scheduled_today(r))
    service = CompletionService(db)
    return await service.get_streak_info(str(current_user.id), total_today)
