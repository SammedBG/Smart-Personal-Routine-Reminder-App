from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DeviceRegister(BaseModel):
    device_id: str = Field(..., max_length=255)
    fcm_token: str = Field(..., max_length=512)
    platform: str = Field(..., pattern=r"^(android|ios)$")
    app_version: Optional[str] = Field(default=None, max_length=64)


class DeviceRead(BaseModel):
    id: str
    device_id: str
    platform: str
    app_version: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
