import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.reminder import Reminder


class CompletionStatus(enum.StrEnum):
    DONE = "done"
    SKIPPED = "skipped"
    MISSED = "missed"
    SNOOZED = "snoozed"


class CompletionRecord(TimestampMixin, Base):
    __tablename__ = "completion_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reminder_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("reminders.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    status: Mapped[CompletionStatus] = mapped_column(
        Enum(CompletionStatus, name="completion_status"), nullable=False
    )

    # For snooze: the new scheduled time
    snoozed_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Denormalized for easier analytics queries
    date_key: Mapped[str] = mapped_column(String(10), index=True, nullable=False)  # YYYY-MM-DD

    reminder: Mapped["Reminder"] = relationship("Reminder")

    __table_args__ = (
        Index("ix_completion_user_reminder_date", "user_id", "reminder_id", "date_key"),
    )
