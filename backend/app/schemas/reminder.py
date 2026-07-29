from datetime import date, datetime, time
from typing import Dict, List, Optional

from backend.app.models.reminder import ReminderType, RepeatType
from pydantic import BaseModel, Field


class MedicineDetails(BaseModel):
    dosage: Optional[str] = None
    quantity: Optional[int] = None
    before_food: Optional[bool] = None
    duration_days: Optional[int] = None


class ExerciseDetails(BaseModel):
    exercise_type: Optional[str] = None  # cardio, yoga, strength, etc.
    duration_minutes: Optional[int] = None
    intensity: Optional[str] = None  # light, moderate, intense


class ReminderBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = Field(default=None, max_length=1024)
    reminder_type: ReminderType
    time_of_day: time
    repeat_type: RepeatType
    custom_days: Optional[Dict] = None
    is_active: bool = True
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    medicine_details: Optional[MedicineDetails] = None
    exercise_details: Optional[ExerciseDetails] = None


class ReminderCreate(ReminderBase):
    idempotency_key: Optional[str] = Field(default=None, max_length=64)


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1024)
    reminder_type: Optional[ReminderType] = None
    time_of_day: Optional[time] = None
    repeat_type: Optional[RepeatType] = None
    custom_days: Optional[Dict] = None
    is_active: Optional[bool] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    medicine_details: Optional[MedicineDetails] = None
    exercise_details: Optional[ExerciseDetails] = None


class ReminderRead(ReminderBase):
    id: str
    next_trigger_at: Optional[datetime] = None
    last_triggered_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReminderSyncPayload(BaseModel):
    since: Optional[datetime] = None


class ReminderSyncResponse(BaseModel):
    reminders: List[ReminderRead]
    last_sync_at: datetime
    total_count: int = 0
    has_more: bool = False
    server_timezone: str = Field(default="UTC", max_length=64)
