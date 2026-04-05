from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Query, Request

from backend.app.api.v1.auth import limiter
from backend.app.core.dependencies import (
    CompletionServiceDep,
    CurrentUser,
    ReminderServiceDep,
)
from backend.app.schemas.completion import (
    CompletionCreate,
    CompletionRead,
    StreakInfo,
)


router = APIRouter(prefix="/completions", tags=["completions"])


@router.post("/", response_model=CompletionRead, summary="Record a completion action")
@limiter.limit("60/minute")
async def record_completion(
    request: Request,
    data: CompletionCreate,
    current_user: CurrentUser,
    service: CompletionServiceDep,
) -> CompletionRead:
    record = await service.record_completion(str(current_user.id), data)
    return CompletionRead.model_validate(record)


@router.get(
    "/today", response_model=List[CompletionRead], summary="Get today's completions"
)
async def get_today_completions(
    current_user: CurrentUser,
    service: CompletionServiceDep,
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=100, ge=1, le=500, description="Max records to return"),
) -> List[CompletionRead]:
    records = await service.get_today_completions(
        str(current_user.id), skip=skip, limit=limit
    )
    return [CompletionRead.model_validate(r) for r in records]


@router.get(
    "/streak", response_model=StreakInfo, summary="Get streak and analytics info"
)
async def get_streak_info(
    current_user: CurrentUser,
    completion_service: CompletionServiceDep,
    reminder_service: ReminderServiceDep,
) -> StreakInfo:
    all_reminders = await reminder_service.list_reminders(current_user.id)
    # Count only reminders that are active and actually scheduled for today
    today = datetime.now(timezone.utc).date()
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
    return await completion_service.get_streak_info(str(current_user.id), total_today)
