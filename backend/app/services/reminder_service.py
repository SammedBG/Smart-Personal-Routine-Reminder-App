from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.reminder import Reminder
from backend.app.repositories.reminder_repository import ReminderRepository
from backend.app.schemas.reminder import ReminderCreate, ReminderUpdate


class ReminderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ReminderRepository(db)

    async def list_reminders(self, user_id: UUID):
        return await self.repo.list_for_user(user_id)

    async def get_reminder(self, user_id: UUID, reminder_id: UUID) -> Reminder | None:
        return await self.repo.get_for_user(user_id, reminder_id)

    async def create_reminder(self, user_id: UUID, data: ReminderCreate) -> Reminder:
        reminder = Reminder(
            user_id=user_id,
            title=data.title,
            description=data.description,
            reminder_type=data.reminder_type,
            time_of_day=data.time_of_day,
            repeat_type=data.repeat_type,
            custom_days=data.custom_days,
            is_active=data.is_active,
        )
        # next_trigger_at will be computed later by scheduler or helper
        await self.repo.create(reminder)
        return reminder

    async def update_reminder(
        self, reminder: Reminder, data: ReminderUpdate
    ) -> Reminder:
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(reminder, field, value)
        reminder.version += 1
        reminder.updated_at = datetime.utcnow()
        await self.repo.save(reminder)
        return reminder

    async def delete_reminder(self, reminder: Reminder) -> None:
        await self.repo.soft_delete(reminder)

    async def list_changed_since(self, user_id: UUID, since: datetime | None):
        return await self.repo.list_changed_since(user_id, since)

