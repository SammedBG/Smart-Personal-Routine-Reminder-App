from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class Platform(enum.StrEnum):
    ANDROID = "android"
    IOS = "ios"


class Device(TimestampMixin, Base):
    __tablename__ = "devices"
    __table_args__ = (UniqueConstraint("user_id", "device_id", name="uq_devices_user_device"),)

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )

    device_id: Mapped[str] = mapped_column(String(255), nullable=False)
    fcm_token: Mapped[str] = mapped_column(String(512), nullable=False)
    platform: Mapped[Platform] = mapped_column(String(32), nullable=False)
    app_version: Mapped[Optional[str]] = mapped_column(String(64))

    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped[User] = relationship("User", back_populates="devices")
