import os
import re
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings

# Load .env from backend/ when running from project root
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_ENV_FILE = os.path.join(_BACKEND_DIR, ".env")

# Default SQLite database path (inside backend/)
_DEFAULT_SQLITE_PATH = os.path.join(_BACKEND_DIR, "smart_routines.db")
_DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{_DEFAULT_SQLITE_PATH}"


class Settings(BaseSettings):
    # Environment
    environment: str = Field("development", alias="ENVIRONMENT")
    debug: bool = Field(False, alias="DEBUG")

    # API
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Smart Personal Routine Reminder API"

    # Database – defaults to local SQLite file; set DATABASE_URL env var to override
    database_url: str = Field(_DEFAULT_DATABASE_URL, alias="DATABASE_URL")
    sql_alchemy_echo: bool = Field(False, alias="SQLALCHEMY_ECHO")

    @field_validator("database_url", mode="before")
    @classmethod
    def _fix_postgres_scheme(cls, v: str) -> str:
        """Render/Heroku provide postgres:// URLs; SQLAlchemy needs postgresql+asyncpg://."""
        if v and re.match(r"^postgres(ql)?://", v):
            return re.sub(r"^postgres(ql)?://", "postgresql+asyncpg://", v)
        return v

    # JWT
    jwt_secret_key: str = Field("CHANGE_ME", alias="JWT_SECRET_KEY")
    jwt_refresh_secret_key: str = Field(
        "CHANGE_ME_REFRESH", alias="JWT_REFRESH_SECRET_KEY"
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    backend_cors_origins: List[AnyHttpUrl] = []

    # Firebase / FCM
    firebase_credentials_path: Optional[str] = Field(
        default=None, alias="FIREBASE_CREDENTIALS_PATH"
    )

    model_config = {
        "case_sensitive": True,
        "env_file": _ENV_FILE,
        "env_file_encoding": "utf-8",
        "populate_by_name": True,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
