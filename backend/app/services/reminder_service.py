from datetime import datetime, time, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.reminder import Reminder
from backend.app.repositories.reminder_repository import ReminderRepository
from backend.app.schemas.reminder import ReminderCreate, ReminderUpdate


def compute_next_trigger(
    time_of_day: time,
    repeat_type: str,
    custom_days: dict | None,
) -> datetime | None:
    """Compute the next trigger datetime based on the reminder schedule."""
    now = datetime.utcnow()
    today = now.date()
    trigger_time = datetime.combine(today, time_of_day)

    if repeat_type == "daily":
        return trigger_time if trigger_time > now else trigger_time + timedelta(days=1)

    if repeat_type == "once":
        return trigger_time if trigger_time > now else trigger_time + timedelta(days=1)

    if repeat_type in ("weekly", "custom") and custom_days:
        days = custom_days.get("days", [])
        if not days:
            # No specific days configured → treat as daily
            return trigger_time if trigger_time > now else trigger_time + timedelta(days=1)

        # days list uses: 0=Sun,1=Mon,...,6=Sat  (JS convention)
        # Python weekday:  0=Mon,1=Tue,...,6=Sun
        # Convert Python weekday → JS convention
        js_today = (now.weekday() + 1) % 7

        # Check if today is a scheduled day and trigger time is still in the future
        if js_today in days and trigger_time > now:
            return trigger_time

        # Find the next scheduled day
        for offset in range(1, 8):
            candidate = (js_today + offset) % 7
            if candidate in days:
                return datetime.combine(today + timedelta(days=offset), time_of_day)

    # Fallback
    return trigger_time if trigger_time > now else trigger_time + timedelta(days=1)


class ReminderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ReminderRepository(db)

    async def list_reminders(self, user_id: UUID):
        return await self.repo.list_for_user(user_id)

    async def get_reminder(self, user_id: UUID, reminder_id: UUID) -> Reminder | None:
        return await self.repo.get_for_user(user_id, reminder_id)

    async def create_reminder(self, user_id: UUID, data: ReminderCreate) -> Reminder:
        next_trigger = compute_next_trigger(
            data.time_of_day, data.repeat_type.value, data.custom_days
        )
        reminder = Reminder(
            user_id=user_id,
            title=data.title,
            description=data.description,
            reminder_type=data.reminder_type,
            time_of_day=data.time_of_day,
            repeat_type=data.repeat_type,
            custom_days=data.custom_days,
            is_active=data.is_active,
            next_trigger_at=next_trigger,
            start_date=data.start_date,
            end_date=data.end_date,
            medicine_details=data.medicine_details.dict() if data.medicine_details else None,
            exercise_details=data.exercise_details.dict() if data.exercise_details else None,
        )
        await self.repo.create(reminder)
        return reminder

    async def update_reminder(
        self, reminder: Reminder, data: ReminderUpdate
    ) -> Reminder:
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            # Convert nested pydantic objects to dicts for JSON columns
            if field in ("medicine_details", "exercise_details") and value is not None:
                setattr(reminder, field, value)
            else:
                setattr(reminder, field, value)
        reminder.version += 1
        reminder.updated_at = datetime.utcnow()

        # Recompute next_trigger_at if schedule-related fields changed
        reminder.next_trigger_at = compute_next_trigger(
            reminder.time_of_day,
            reminder.repeat_type.value
            if hasattr(reminder.repeat_type, "value")
            else reminder.repeat_type,
            reminder.custom_days,
        )

        await self.repo.save(reminder)
        return reminder

    async def delete_reminder(self, reminder: Reminder) -> None:
        await self.repo.soft_delete(reminder)

    async def list_changed_since(self, user_id: UUID, since: datetime | None):
        return await self.repo.list_changed_since(user_id, since)

