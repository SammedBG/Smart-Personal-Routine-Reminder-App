from collections import defaultdict
from datetime import datetime, date, timedelta
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.completion import CompletionRecord, CompletionStatus
from backend.app.repositories.completion_repository import CompletionRepository
from backend.app.schemas.completion import (
    CompletionCreate,
    DailyStats,
    StreakInfo,
)


class CompletionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CompletionRepository(db)

    async def record_completion(
        self, user_id: str, data: CompletionCreate
    ) -> CompletionRecord:
        date_key = data.scheduled_at.strftime("%Y-%m-%d")

        # Check for existing record for this reminder on this date
        existing = await self.repo.get_for_reminder_date(
            user_id, data.reminder_id, date_key
        )
        if existing:
            # Update existing record
            existing.status = data.status
            existing.completed_at = (
                datetime.utcnow()
                if data.status in (CompletionStatus.DONE, CompletionStatus.SKIPPED)
                else None
            )
            existing.snoozed_to = data.snoozed_to
            self.db.add(existing)
            await self.db.flush()
            return existing

        record = CompletionRecord(
            reminder_id=data.reminder_id,
            user_id=user_id,
            scheduled_at=data.scheduled_at,
            completed_at=(
                datetime.utcnow()
                if data.status in (CompletionStatus.DONE, CompletionStatus.SKIPPED)
                else None
            ),
            status=data.status,
            snoozed_to=data.snoozed_to,
            date_key=date_key,
        )
        await self.repo.create(record)
        return record

    async def get_today_completions(self, user_id: str) -> List[CompletionRecord]:
        today_key = date.today().strftime("%Y-%m-%d")
        return await self.repo.list_for_date(user_id, today_key)

    async def get_streak_info(
        self, user_id: str, total_today_reminders: int
    ) -> StreakInfo:
        today = date.today()
        # Get last 30 days of data for streak computation
        start = today - timedelta(days=30)
        start_key = start.strftime("%Y-%m-%d")
        end_key = today.strftime("%Y-%m-%d")

        records = await self.repo.list_for_date_range(user_id, start_key, end_key)

        # Group by date
        by_date: dict[str, list[CompletionRecord]] = defaultdict(list)
        for r in records:
            by_date[r.date_key].append(r)

        # Today stats
        today_key = today.strftime("%Y-%m-%d")
        today_records = by_date.get(today_key, [])
        today_done = sum(1 for r in today_records if r.status == CompletionStatus.DONE)
        today_total = max(total_today_reminders, len(today_records))
        today_rate = today_done / today_total if today_total > 0 else 0.0

        # Weekly stats (last 7 days)
        weekly_stats: List[DailyStats] = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            dk = d.strftime("%Y-%m-%d")
            day_records = by_date.get(dk, [])
            total = len(day_records)
            done = sum(1 for r in day_records if r.status == CompletionStatus.DONE)
            skipped = sum(1 for r in day_records if r.status == CompletionStatus.SKIPPED)
            missed = sum(1 for r in day_records if r.status == CompletionStatus.MISSED)
            rate = done / total if total > 0 else 0.0
            weekly_stats.append(
                DailyStats(
                    date=dk,
                    total=total,
                    done=done,
                    skipped=skipped,
                    missed=missed,
                    completion_rate=round(rate, 2),
                )
            )

        # Streak: count consecutive days with 100% completion going backwards from yesterday
        current_streak = 0
        for i in range(1, 31):
            d = today - timedelta(days=i)
            dk = d.strftime("%Y-%m-%d")
            day_records = by_date.get(dk, [])
            if not day_records:
                break
            all_done = all(r.status == CompletionStatus.DONE for r in day_records)
            if all_done:
                current_streak += 1
            else:
                break

        # If today is also 100%, include it
        if today_records and all(
            r.status == CompletionStatus.DONE for r in today_records
        ):
            current_streak += 1

        # Longest streak (simplified from the 30-day window)
        longest_streak = 0
        streak = 0
        for i in range(30, -1, -1):
            d = today - timedelta(days=i)
            dk = d.strftime("%Y-%m-%d")
            day_records = by_date.get(dk, [])
            if day_records and all(
                r.status == CompletionStatus.DONE for r in day_records
            ):
                streak += 1
                longest_streak = max(longest_streak, streak)
            else:
                streak = 0

        return StreakInfo(
            current_streak=current_streak,
            longest_streak=longest_streak,
            today_done=today_done,
            today_total=today_total,
            today_rate=round(today_rate, 2),
            weekly_stats=weekly_stats,
        )
