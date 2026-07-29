from datetime import datetime
from typing import List, Optional

from backend.app.models.completion import CompletionStatus
from pydantic import BaseModel


class CompletionCreate(BaseModel):
    reminder_id: str
    status: CompletionStatus
    scheduled_at: datetime
    snoozed_to: Optional[datetime] = None


class CompletionRead(BaseModel):
    id: str
    reminder_id: str
    user_id: str
    scheduled_at: datetime
    completed_at: Optional[datetime] = None
    status: CompletionStatus
    snoozed_to: Optional[datetime] = None
    date_key: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyStats(BaseModel):
    date: str  # YYYY-MM-DD
    total: int
    done: int
    skipped: int
    missed: int
    completion_rate: float  # 0.0 - 1.0


class StreakInfo(BaseModel):
    current_streak: int  # consecutive days with 100% completion
    longest_streak: int
    today_done: int
    today_total: int
    today_rate: float
    weekly_stats: List[DailyStats]
