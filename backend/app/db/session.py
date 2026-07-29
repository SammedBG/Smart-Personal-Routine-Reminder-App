from typing import AsyncGenerator

from backend.app.config import get_settings
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

settings = get_settings()

_connect_args = {}
engine_kwargs = {
    "echo": settings.sql_alchemy_echo,
    "future": True,
}

if settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}
    engine_kwargs.update({"connect_args": _connect_args, "poolclass": NullPool})
else:
    engine_kwargs.update(
        {
            "pool_size": 20,
            "max_overflow": 10,
            "pool_recycle": 3600,
            "pool_pre_ping": True,
        }
    )

engine = create_async_engine(str(settings.database_url), **engine_kwargs)


# Enable WAL mode and foreign keys for SQLite
if settings.database_url.startswith("sqlite"):

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
