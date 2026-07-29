from typing import List, Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.completion import CompletionRecord


class CompletionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, record: CompletionRecord) -> CompletionRecord:
        self.db.add(record)
        await self.db.flush()
        return record

    async def get_by_id(self, record_id: str) -> Optional[CompletionRecord]:
        result = await self.db.execute(
            select(CompletionRecord).where(CompletionRecord.id == record_id)
        )
        return result.scalar_one_or_none()

    async def list_for_date(
        self, user_id: str, date_key: str, skip: int = 0, limit: int = 100
    ) -> List[CompletionRecord]:
        result = await self.db.execute(
            select(CompletionRecord)
            .where(
                and_(
                    CompletionRecord.user_id == user_id,
                    CompletionRecord.date_key == date_key,
                )
            )
            .order_by(CompletionRecord.scheduled_at)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_for_date_range(
        self, user_id: str, start_key: str, end_key: str
    ) -> List[CompletionRecord]:
        result = await self.db.execute(
            select(CompletionRecord).where(
                and_(
                    CompletionRecord.user_id == user_id,
                    CompletionRecord.date_key >= start_key,
                    CompletionRecord.date_key <= end_key,
                )
            )
        )
        return list(result.scalars().all())

    async def get_for_reminder_date(
        self, user_id: str, reminder_id: str, date_key: str
    ) -> Optional[CompletionRecord]:
        result = await self.db.execute(
            select(CompletionRecord).where(
                and_(
                    CompletionRecord.user_id == user_id,
                    CompletionRecord.reminder_id == reminder_id,
                    CompletionRecord.date_key == date_key,
                )
            )
        )
        return result.scalar_one_or_none()
