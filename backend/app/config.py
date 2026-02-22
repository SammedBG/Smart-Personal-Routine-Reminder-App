import os
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, BaseSettings, Field, PostgresDsn, validator

# Load .env from backend/ when running from project root
_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_ENV_FILE = os.path.join(_BACKEND_DIR, ".env")



class Settings(BaseSettings):
    # Environment
    environment: str = Field("development", env="ENVIRONMENT")
    debug: bool = Field(False, env="DEBUG")

    # API
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Smart Personal Routine Reminder API"

    # Database
    postgres_server: str = Field("localhost", env="POSTGRES_SERVER")
    postgres_port: str = Field("5432", env="POSTGRES_PORT")
    postgres_user: str = Field("app_user", env="POSTGRES_USER")
    postgres_password: str = Field("app_password", env="POSTGRES_PASSWORD")
    postgres_db: str = Field("smart_routines", env="POSTGRES_DB")
    sql_alchemy_echo: bool = Field(False, env="SQLALCHEMY_ECHO")

    database_url: Optional[PostgresDsn] = None

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

    @validator("database_url", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        if isinstance(v, str) and v:
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            user=values.get("postgres_user"),
            password=values.get("postgres_password"),
            host=values.get("postgres_server"),
            port=values.get("postgres_port"),
            path=f"/{values.get('postgres_db')}",
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

