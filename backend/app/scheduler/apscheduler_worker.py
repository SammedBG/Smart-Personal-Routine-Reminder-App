from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.asyncio.session import async_sessionmaker

from backend.app.config import get_settings
from backend.app.models.device import Device
from backend.app.models.reminder import Reminder, RepeatType
from backend.app.notifications.fcm import send_notification_to_devices


settings = get_settings()

engine = create_async_engine(str(settings.database_url), future=True)
SessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)


async def process_due_reminders() -> None:
    now = datetime.utcnow()
    async with SessionLocal() as session:  # type: AsyncSession
        logger.debug("Checking for due reminders at {}", now)
        result = await session.execute(
            select(Reminder)
            .where(
                and_(
                    Reminder.is_active.is_(True),
                    Reminder.deleted_at.is_(None),
                    Reminder.next_trigger_at.is_not(None),
                    Reminder.next_trigger_at <= now,
                )
            )
            .limit(500)
        )
        reminders = list(result.scalars().all())
        if not reminders:
            return

        logger.info("Found {} due reminders", len(reminders))

        # Group by user
        for reminder in reminders:
            await _notify_for_reminder(session, reminder, now)

        await session.commit()


async def _notify_for_reminder(
    session: AsyncSession, reminder: Reminder, now: datetime
) -> None:
    # Fetch active devices for user
    result = await session.execute(
        select(Device).where(
            Device.user_id == reminder.user_id,
            Device.is_active.is_(True),
        )
    )
    devices = list(result.scalars().all())

    title = reminder.title
    body = reminder.description or f"Reminder: {reminder.reminder_type.value}"
    data = {
        "reminder_id": str(reminder.id),
        "reminder_type": reminder.reminder_type.value,
    }

    send_notification_to_devices(devices, title=title, body=body, data=data)

    # Update reminder next_trigger_at / last_triggered_at
    reminder.last_triggered_at = now
    reminder.next_trigger_at = _compute_next_trigger(reminder, now)
    session.add(reminder)


def _compute_next_trigger(reminder: Reminder, from_time: datetime) -> datetime | None:
    """Simple next trigger computation based on repeat_type and time_of_day."""
    base_date = from_time.date()
    time_of_day = reminder.time_of_day

    # Enforce end_date: if past end_date, no more triggers
    if reminder.end_date and base_date > reminder.end_date:
        return None

    # Enforce start_date: don't trigger before start_date
    effective_base = base_date
    if reminder.start_date and effective_base < reminder.start_date:
        effective_base = reminder.start_date

    next_dt = datetime.combine(effective_base, time_of_day)
    if next_dt <= from_time:
        next_dt += timedelta(days=1)

    def _in_bounds(dt: datetime) -> bool:
        if reminder.start_date and dt.date() < reminder.start_date:
            return False
        if reminder.end_date and dt.date() > reminder.end_date:
            return False
        return True

    if reminder.repeat_type == RepeatType.ONCE:
        # Only trigger once; after firing, disable
        reminder.is_active = False
        return None
    elif reminder.repeat_type == RepeatType.DAILY:
        return next_dt if _in_bounds(next_dt) else None
    elif reminder.repeat_type in (RepeatType.WEEKLY, RepeatType.CUSTOM):
        days = (reminder.custom_days or {}).get("days")
        if not days:
            return next_dt if _in_bounds(next_dt) else None
        python_days = [((d - 1) % 7) for d in days]
        for offset in range(0, 8):
            candidate = next_dt + timedelta(days=offset)
            if candidate.weekday() in python_days and candidate > from_time:
                if _in_bounds(candidate):
                    return candidate
        return None
    else:
        return next_dt if _in_bounds(next_dt) else None


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(process_due_reminders, "interval", minutes=1, id="due-reminders")
    return scheduler


def main() -> None:
    import asyncio

    scheduler = create_scheduler()
    scheduler.start()
    logger.info("APScheduler worker started")
    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler shutting down")
        scheduler.shutdown()


if __name__ == "__main__":
    main()
