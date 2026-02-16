from datetime import datetime, time
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from backend.app.models.reminder import ReminderType, RepeatType


class ReminderBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = Field(default=None, max_length=1024)
    reminder_type: ReminderType
    time_of_day: time
    repeat_type: RepeatType
    custom_days: Optional[Dict] = None
    is_active: bool = True


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1024)
    reminder_type: Optional[ReminderType] = None
    time_of_day: Optional[time] = None
    repeat_type: Optional[RepeatType] = None
    custom_days: Optional[Dict] = None
    is_active: Optional[bool] = None


class ReminderRead(ReminderBase):
    id: str
    next_trigger_at: Optional[datetime]
    last_triggered_at: Optional[datetime]
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class ReminderSyncPayload(BaseModel):
    since: Optional[datetime] = None


class ReminderSyncResponse(BaseModel):
    reminders: List[ReminderRead]
    last_sync_at: datetime

