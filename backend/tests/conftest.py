from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.config import Settings
from app.main import create_app
from tests.helpers import (
    TEST_JWT_SECRET,
    bearer,
    create_facility,
    create_sport,
    register_and_login,
)

TEST_DB_NAME = "campus_sports_test"


class FakeClock:
    """Controllable 'now' for the app. Starts Monday 2026-11-02 09:30 IST (04:00 UTC)."""

    def __init__(self) -> None:
        self.now = datetime(2026, 11, 2, 4, 0, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.now


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def settings() -> Settings:
    # MONGO_URI still comes from the environment / .env; DB name and secret are forced.
    s = Settings(mongo_db_name=TEST_DB_NAME, jwt_secret=TEST_JWT_SECRET)
    assert s.mongo_db_name.endswith("_test"), "Tests must never run against a non-test database"
    return s


@pytest_asyncio.fixture
async def app(settings: Settings, clock: FakeClock):
    application = create_app(settings, clock=clock)
    # httpx's ASGITransport does not run lifespan events, so run them explicitly.
    async with application.router.lifespan_context(application):
        yield application
        await application.state.mongo_client.drop_database(settings.mongo_db_name)


@pytest_asyncio.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
def db(app):
    return app.state.db


@pytest_asyncio.fixture
async def student_headers(client):
    token, _ = await register_and_login(client, email="student@campus.edu")
    return bearer(token)


@pytest_asyncio.fixture
async def admin_headers(client, db):
    token, _ = await register_and_login(client, email="admin@campus.edu")
    # Promote directly in the DB; the role is read from the DB per request, so the
    # token issued above is already an admin token.
    await db.users.update_one({"email": "admin@campus.edu"}, {"$set": {"role": "admin"}})
    return bearer(token)


@pytest_asyncio.fixture
async def badminton(client, admin_headers) -> str:
    """Id of a Badminton sport (with BADMINTON_ATTRS) created by the admin."""
    resp = await create_sport(client, admin_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


@pytest_asyncio.fixture
async def facility(client, admin_headers, badminton) -> str:
    """Id of 'Badminton Court 1': open Mon-Fri 06:00-21:00, 60-minute slots."""
    resp = await create_facility(client, admin_headers, badminton)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]
