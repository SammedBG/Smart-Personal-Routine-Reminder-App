from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.reminder import Reminder
from backend.app.repositories.reminder_repository import ReminderRepository
from backend.app.schemas.reminder import ReminderCreate, ReminderUpdate


def compute_next_trigger(
    time_of_day: time,
    repeat_type: str,
    custom_days: dict | None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> datetime | None:
    """Compute the next trigger datetime based on the reminder schedule."""
    now = datetime.now(timezone.utc)
    today = now.date()

    # If end_date is in the past, no more triggers
    if end_date and end_date < today:
        return None

    # Earliest allowed date
    effective_today = max(today, start_date) if start_date else today
    trigger_time = datetime.combine(effective_today, time_of_day, tzinfo=timezone.utc)

    # Helper: check candidate is within date bounds
    def _in_bounds(dt: datetime) -> bool:
        d = dt.date()
        if start_date and d < start_date:
            return False
        if end_date and d > end_date:
            return False
        return True

    if repeat_type == "once":
        # "once" reminders only fire if the trigger time is still in the future.
        # They should NOT auto-advance to the next day.
        if trigger_time > now and _in_bounds(trigger_time):
            return trigger_time
        return None

    if repeat_type == "daily":
        candidate = (
            trigger_time if trigger_time > now else trigger_time + timedelta(days=1)
        )
        return candidate if _in_bounds(candidate) else None

    if repeat_type in ("weekly", "custom") and custom_days:
        days = custom_days.get("days", [])
        if not days:
            candidate = (
                trigger_time if trigger_time > now else trigger_time + timedelta(days=1)
            )
            return candidate if _in_bounds(candidate) else None

        # days list uses: 0=Sun,1=Mon,...,6=Sat  (JS convention)
        # Python weekday:  0=Mon,1=Tue,...,6=Sun
        js_today = (effective_today.weekday() + 1) % 7

        # Check if effective_today is a scheduled day and trigger time is still in the future
        if js_today in days and trigger_time > now:
            if _in_bounds(trigger_time):
                return trigger_time

        # Find the next scheduled day
        for offset in range(1, 8):
            candidate_js = (js_today + offset) % 7
            if candidate_js in days:
                candidate = datetime.combine(
                    effective_today + timedelta(days=offset),
                    time_of_day,
                    tzinfo=timezone.utc,
                )
                if _in_bounds(candidate):
                    return candidate
        return None

    # Fallback
    candidate = trigger_time if trigger_time > now else trigger_time + timedelta(days=1)
    return candidate if _in_bounds(candidate) else None


class ReminderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ReminderRepository(db)

    async def list_reminders(self, user_id: UUID, skip: int = 0, limit: int = 50):
        return await self.repo.list_for_user(user_id, skip=skip, limit=limit)

    async def get_reminder(self, user_id: UUID, reminder_id: UUID) -> Reminder | None:
        return await self.repo.get_for_user(user_id, reminder_id)

    async def create_reminder(self, user_id: UUID, data: ReminderCreate) -> Reminder:
        if data.idempotency_key:
            existing = await self.repo.get_by_idempotency_key(
                user_id, data.idempotency_key
            )
            if existing:
                return existing

        next_trigger = compute_next_trigger(
            data.time_of_day,
            data.repeat_type.value,
            data.custom_days,
            start_date=data.start_date,
            end_date=data.end_date,
        )
        reminder = Reminder(
            user_id=user_id,
            title=data.title,
            description=data.description,
            idempotency_key=data.idempotency_key,
            reminder_type=data.reminder_type,
            time_of_day=data.time_of_day,
            repeat_type=data.repeat_type,
            custom_days=data.custom_days,
            is_active=data.is_active,
            next_trigger_at=next_trigger,
            start_date=data.start_date,
            end_date=data.end_date,
            medicine_details=data.medicine_details.model_dump()
            if data.medicine_details
            else None,
            exercise_details=data.exercise_details.model_dump()
            if data.exercise_details
            else None,
        )
        await self.repo.create(reminder)
        return reminder

    async def update_reminder(
        self, reminder: Reminder, data: ReminderUpdate
    ) -> Reminder:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            # Convert nested pydantic objects to dicts for JSON columns
            if field in ("medicine_details", "exercise_details") and value is not None:
                if hasattr(value, "model_dump"):
                    setattr(reminder, field, value.model_dump())
                elif isinstance(value, dict):
                    setattr(reminder, field, value)
                else:
                    setattr(reminder, field, value)
            else:
                setattr(reminder, field, value)
        reminder.version += 1
        reminder.updated_at = datetime.now(timezone.utc)

        # Recompute next_trigger_at if schedule-related fields changed
        reminder.next_trigger_at = compute_next_trigger(
            reminder.time_of_day,
            reminder.repeat_type.value
            if hasattr(reminder.repeat_type, "value")
            else reminder.repeat_type,
            reminder.custom_days,
            start_date=reminder.start_date,
            end_date=reminder.end_date,
        )

        await self.repo.save(reminder)
        return reminder

    async def delete_reminder(self, reminder: Reminder) -> None:
        await self.repo.soft_delete(reminder)

    async def list_changed_since(
        self, user_id: UUID, since: datetime | None, skip: int = 0, limit: int = 50
    ):
        return await self.repo.list_changed_since(user_id, since, skip=skip, limit=limit)
