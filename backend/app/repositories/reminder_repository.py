from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.reminder import Reminder


class ReminderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query(self, user_id: UUID) -> Select:
        return (
            select(Reminder)
            .where(Reminder.user_id == user_id, Reminder.deleted_at.is_(None))
            .order_by(Reminder.time_of_day, Reminder.created_at)
        )

    async def list_for_user(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> List[Reminder]:
        result = await self.db.execute(
            self._base_query(user_id).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_for_user(
        self, user_id: UUID, reminder_id: UUID
    ) -> Optional[Reminder]:
        result = await self.db.execute(
            self._base_query(user_id).where(Reminder.id == str(reminder_id))
        )
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(
        self, user_id: UUID, idempotency_key: str
    ) -> Optional[Reminder]:
        result = await self.db.execute(
            select(Reminder).where(
                Reminder.user_id == user_id,
                Reminder.idempotency_key == idempotency_key,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, reminder: Reminder) -> Reminder:
        self.db.add(reminder)
        await self.db.flush()
        return reminder

    async def save(self, reminder: Reminder) -> Reminder:
        self.db.add(reminder)
        await self.db.flush()
        return reminder

    async def soft_delete(self, reminder: Reminder) -> None:
        reminder.deleted_at = datetime.now(timezone.utc)
        self.db.add(reminder)
        await self.db.flush()

    async def list_changed_since(
        self, user_id: UUID, since: Optional[datetime], skip: int = 0, limit: int = 50
    ) -> tuple[List[Reminder], int]:
        # Include soft-deleted records so clients can detect server-side deletions
        base_query = select(Reminder).where(Reminder.user_id == user_id)
        if since is not None:
            base_query = base_query.where(Reminder.updated_at >= since)

        count_query = select(func.count()).select_from(Reminder).where(
            Reminder.user_id == user_id
        )
        if since is not None:
            count_query = count_query.where(Reminder.updated_at >= since)

        total_count = (await self.db.execute(count_query)).scalar_one()
        result = await self.db.execute(
            base_query.order_by(Reminder.updated_at).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), int(total_count)
