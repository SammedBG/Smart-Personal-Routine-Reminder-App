from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.app.api.v1.auth import limiter
from backend.app.config import get_settings

# Import models so SQLAlchemy metadata is populated (for migrations and ORM)
from backend.app.models import completion, device, reminder, user  # noqa: F401
from backend.app.api.v1 import auth, completions, devices, health, reminders, users


def _validate_settings(settings) -> None:
    """Reject insecure default JWT secrets outside development."""
    insecure = {"CHANGE_ME", "CHANGE_ME_REFRESH", ""}
    if settings.environment.lower() != "development":
        if settings.jwt_secret_key in insecure:
            raise RuntimeError(
                "JWT_SECRET_KEY must be set to a strong random value in non-development environments."
            )
        if settings.jwt_refresh_secret_key in insecure:
            raise RuntimeError(
                "JWT_REFRESH_SECRET_KEY must be set to a strong random value in non-development environments."
            )


def create_app() -> FastAPI:
    settings = get_settings()
    _validate_settings(settings)

    app = FastAPI(
        title=settings.project_name,
        debug=settings.debug,
        version="1.0.0",
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    )

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Global unhandled-exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on {} {}", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    # CORS
    if settings.backend_cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.backend_cors_origins],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "Accept"],
        )

    # Routers
    api_prefix = settings.api_v1_prefix
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(users.router, prefix=api_prefix)
    app.include_router(reminders.router, prefix=api_prefix)
    app.include_router(completions.router, prefix=api_prefix)
    app.include_router(devices.router, prefix=api_prefix)

    return app


app = create_app()
