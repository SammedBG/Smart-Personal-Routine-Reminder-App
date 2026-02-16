from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1 import auth, devices, health, reminders, users
from backend.app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.project_name,
        debug=settings.debug,
        version="1.0.0",
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    )

    # CORS
    if settings.backend_cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.backend_cors_origins],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Routers
    api_prefix = settings.api_v1_prefix
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(users.router, prefix=api_prefix)
    app.include_router(reminders.router, prefix=api_prefix)
    app.include_router(devices.router, prefix=api_prefix)

    return app


app = create_app()

