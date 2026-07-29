from datetime import UTC, datetime, timedelta
from typing import Any, Optional

import bcrypt
import jwt
from backend.app.config import get_settings
from fastapi import HTTPException, status


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def _create_token(
    subject: str,
    expires_delta: timedelta,
    secret_key: str,
    token_type: str,
    extra_claims: Optional[dict] = None,
) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + expires_delta,
        "type": token_type,
    }
    if extra_claims:
        payload.update(extra_claims)
    encoded_jwt = jwt.encode(payload, secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_access_token(subject: str, token_version: int) -> str:
    settings = get_settings()
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    return _create_token(
        subject=subject,
        expires_delta=expires_delta,
        secret_key=settings.jwt_secret_key,
        token_type="access",
        extra_claims={"tv": token_version},
    )


def create_refresh_token(subject: str, token_version: int) -> str:
    settings = get_settings()
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    return _create_token(
        subject=subject,
        expires_delta=expires_delta,
        secret_key=settings.jwt_refresh_secret_key,
        token_type="refresh",
        extra_claims={"tv": token_version},
    )


def decode_token(token: str, token_type: str) -> dict:
    settings = get_settings()
    secret = settings.jwt_secret_key if token_type == "access" else settings.jwt_refresh_secret_key
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        ) from err
    except jwt.InvalidTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from err

    if payload.get("type") != token_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return payload
