from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DeviceRegister(BaseModel):
    device_id: str = Field(..., max_length=255)
    fcm_token: str = Field(..., max_length=512)
    platform: str = Field(..., regex="^(android|ios)$")
    app_version: Optional[str] = Field(default=None, max_length=64)


class DeviceRead(BaseModel):
    id: str
    device_id: str
    platform: str
    app_version: Optional[str]
    last_seen_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

