from __future__ import annotations

import enum
import uuid
from datetime import date, datetime, time
from typing import TYPE_CHECKING, Optional

from backend.app.db.base import Base, TimestampMixin
from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from backend.app.models.user import User


class ReminderType(enum.StrEnum):
    MEDICINE = "medicine"
    FOOD = "food"
    WATER = "water"
    SLEEP = "sleep"
    EXERCISE = "exercise"
    CUSTOM = "custom"


class RepeatType(enum.StrEnum):
    ONCE = "once"
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"


class Reminder(TimestampMixin, Base):
    __tablename__ = "reminders"
    __table_args__ = (
        Index(
            "ix_reminders_user_idempotency_key",
            "user_id",
            "idempotency_key",
            unique=True,
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1024))

    idempotency_key: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    reminder_type: Mapped[ReminderType] = mapped_column(
        Enum(ReminderType, name="reminder_type"), nullable=False
    )

    time_of_day: Mapped[time] = mapped_column(Time(timezone=False), nullable=False)

    repeat_type: Mapped[RepeatType] = mapped_column(
        Enum(RepeatType, name="repeat_type"), nullable=False
    )
    # For weekly/custom: list of weekday numbers [0-6] or similar, stored as JSON
    custom_days: Mapped[Optional[dict]] = mapped_column(JSON)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Schedule boundaries
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Medicine-specific fields (JSON blob for flexibility)
    # { "dosage": "500mg", "quantity": 1, "before_food": true, "duration_days": 30 }
    medicine_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Exercise-specific fields
    # { "exercise_type": "cardio", "duration_minutes": 30, "intensity": "moderate" }
    exercise_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    next_trigger_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), index=True)
    last_triggered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    user: Mapped[User] = relationship("User", back_populates="reminders")
