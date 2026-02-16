import enum
import uuid
from datetime import datetime, time
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base, TimestampMixin


class ReminderType(str, enum.Enum):
    MEDICINE = "medicine"
    FOOD = "food"
    WATER = "water"
    SLEEP = "sleep"
    CUSTOM = "custom"


class RepeatType(str, enum.Enum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"


class Reminder(TimestampMixin, Base):
    __tablename__ = "reminders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1024))

    reminder_type: Mapped[ReminderType] = mapped_column(
        Enum(ReminderType, name="reminder_type"), nullable=False
    )

    time_of_day: Mapped[time] = mapped_column(Time(timezone=False), nullable=False)

    repeat_type: Mapped[RepeatType] = mapped_column(
        Enum(RepeatType, name="repeat_type"), nullable=False
    )
    # For weekly/custom: list of weekday numbers [0-6] or similar, stored as JSON
    custom_days: Mapped[Optional[dict]] = mapped_column(JSONB)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    next_trigger_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), index=True
    )
    last_triggered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="reminders")

