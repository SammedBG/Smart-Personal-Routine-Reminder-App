from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.asyncio.session import async_sessionmaker

from backend.app.config import get_settings
from backend.app.models.completion import CompletionRecord, CompletionStatus
from backend.app.models.device import Device
from backend.app.models.reminder import Reminder, RepeatType
from backend.app.notifications.fcm import send_notification_to_devices
from backend.app.services.reminder_service import compute_next_trigger


settings = get_settings()

engine = create_async_engine(str(settings.database_url), future=True)
SessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine, expire_on_commit=False
)


async def process_due_reminders() -> None:
    now = datetime.now(timezone.utc)
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

    # Handle "once" type: disable after firing
    if reminder.repeat_type == RepeatType.ONCE:
        reminder.is_active = False
        reminder.next_trigger_at = None
    else:
        repeat_value = (
            reminder.repeat_type.value
            if hasattr(reminder.repeat_type, "value")
            else reminder.repeat_type
        )
        reminder.next_trigger_at = compute_next_trigger(
            time_of_day=reminder.time_of_day,
            repeat_type=repeat_value,
            custom_days=reminder.custom_days,
            start_date=reminder.start_date,
            end_date=reminder.end_date,
        )
    session.add(reminder)


# Grace period (minutes) after a reminder's trigger time before marking as missed
MISSED_GRACE_MINUTES = 30


async def mark_missed_completions() -> None:
    """Create 'missed' completion records for reminders that were triggered
    but received no user action within the grace period."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=MISSED_GRACE_MINUTES)

    async with SessionLocal() as session:
        # Reminders that were triggered before the cutoff and have already
        # advanced their next_trigger_at (meaning the notification was sent).
        result = await session.execute(
            select(Reminder).where(
                and_(
                    Reminder.is_active.is_(True),
                    Reminder.deleted_at.is_(None),
                    Reminder.last_triggered_at.is_not(None),
                    Reminder.last_triggered_at <= cutoff,
                )
            ).limit(500)
        )
        reminders = list(result.scalars().all())
        if not reminders:
            return

        for reminder in reminders:
            date_key = reminder.last_triggered_at.strftime("%Y-%m-%d")

            # Check if a completion record already exists for this
            # reminder + user + date (any status counts).
            existing = await session.execute(
                select(func.count()).select_from(CompletionRecord).where(
                    and_(
                        CompletionRecord.reminder_id == reminder.id,
                        CompletionRecord.user_id == reminder.user_id,
                        CompletionRecord.date_key == date_key,
                    )
                )
            )
            if existing.scalar_one() > 0:
                continue

            record = CompletionRecord(
                reminder_id=reminder.id,
                user_id=reminder.user_id,
                scheduled_at=reminder.last_triggered_at,
                completed_at=now,
                status=CompletionStatus.MISSED,
                date_key=date_key,
            )
            session.add(record)
            logger.info(
                "Marked reminder {} as missed for {}",
                reminder.id,
                date_key,
            )

        await session.commit()


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(process_due_reminders, "interval", minutes=1, id="due-reminders")
    scheduler.add_job(
        mark_missed_completions, "interval", minutes=5, id="mark-missed"
    )
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
