import os
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, BaseSettings, Field

# Load .env from backend/ when running from project root
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_ENV_FILE = os.path.join(_BACKEND_DIR, ".env")

# Default SQLite database path (inside backend/)
_DEFAULT_SQLITE_PATH = os.path.join(_BACKEND_DIR, "smart_routines.db")
_DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{_DEFAULT_SQLITE_PATH}"


class Settings(BaseSettings):
    # Environment
    environment: str = Field("development", env="ENVIRONMENT")
    debug: bool = Field(False, env="DEBUG")

    # API
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Smart Personal Routine Reminder API"

    # Database – defaults to local SQLite file; set DATABASE_URL env var to override
    database_url: str = Field(_DEFAULT_DATABASE_URL, env="DATABASE_URL")
    sql_alchemy_echo: bool = Field(False, env="SQLALCHEMY_ECHO")

    # JWT
    jwt_secret_key: str = Field("CHANGE_ME", env="JWT_SECRET_KEY")
    jwt_refresh_secret_key: str = Field("CHANGE_ME_REFRESH", env="JWT_REFRESH_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    backend_cors_origins: List[AnyHttpUrl] = []

    # Firebase / FCM
    firebase_credentials_path: Optional[str] = Field(
        default=None, env="FIREBASE_CREDENTIALS_PATH"
    )

    class Config:
        case_sensitive = True
        env_file = _ENV_FILE
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

