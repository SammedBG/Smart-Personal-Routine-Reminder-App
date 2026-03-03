from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    timezone: str = "UTC"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: str
    is_active: bool
    timezone: str = "UTC"
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    timezone: Optional[str] = Field(default=None, max_length=64)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str
