"""FastAPI application factory.

Run with:  uvicorn app.main:create_app --factory --reload

There is intentionally no module-level `app`: importing this module must not read
settings or touch the environment (tests build their own app with their own settings).
The Mongo client and database live on `app.state`, created in the lifespan hook.
"""
from collections.abc import Callable
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import AsyncMongoClient

from app.config import Settings, get_settings
from app.errors import register_error_handlers
from app.indexes import ensure_indexes
from app.routers import (
    admin_analytics,
    admin_bookings,
    admin_users,
    auth,
    availability,
    bookings,
    facilities,
    health,
    notifications,
    sports,
)

API_PREFIX = "/api/v1"

Clock = Callable[[], datetime]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_app(settings: Settings | None = None, clock: Clock | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # tz_aware=True: datetimes read from Mongo are timezone-aware UTC, so they
        # serialise to JSON with an explicit offset instead of being ambiguous.
        client = AsyncMongoClient(
            settings.mongo_uri,
            tz_aware=True,
            serverSelectionTimeoutMS=5000,
        )
        app.state.mongo_client = client
        app.state.db = client[settings.mongo_db_name]
        try:
            # Fail fast at startup if the database is unreachable.
            await client.admin.command("ping")
            await ensure_indexes(app.state.db)
            yield
        finally:
            await client.close()

    app = FastAPI(title=settings.app_name, version="0.5.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.clock = clock or utc_now  # tests pass a fake clock

    register_error_handlers(app)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router, prefix=API_PREFIX)
    app.include_router(sports.router, prefix=API_PREFIX)
    app.include_router(facilities.router, prefix=API_PREFIX)
    app.include_router(availability.router, prefix=API_PREFIX)
    app.include_router(bookings.router, prefix=API_PREFIX)
    app.include_router(notifications.router, prefix=API_PREFIX)
    app.include_router(admin_bookings.router, prefix=API_PREFIX)
    app.include_router(admin_users.router, prefix=API_PREFIX)
    app.include_router(admin_analytics.router, prefix=API_PREFIX)
    return app
