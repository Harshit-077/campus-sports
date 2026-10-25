import pytest

from app.deps import AdminUser
from tests.helpers import bearer, register_and_login


@pytest.fixture
def admin_route(app):
    """A throwaway admin-only route, so the role dependency is tested without
    adding test-only endpoints to the real API."""

    async def admin_only(user: AdminUser):
        return {"email": user.email}

    app.add_api_route("/_test/admin-only", admin_only)


async def test_student_is_forbidden(client, admin_route):
    token, _ = await register_and_login(client)
    resp = await client.get("/_test/admin-only", headers=bearer(token))
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


async def test_unauthenticated_gets_401_not_403(client, admin_route):
    resp = await client.get("/_test/admin-only")
    assert resp.status_code == 401


async def test_admin_is_allowed(client, db, admin_route):
    token, _ = await register_and_login(client)
    await db.users.update_one({"email": "student@campus.edu"}, {"$set": {"role": "admin"}})
    resp = await client.get("/_test/admin-only", headers=bearer(token))
    assert resp.status_code == 200


async def test_role_comes_from_database_not_from_token(client, db, admin_route):
    """The token was issued while the user was a student; promotion/demotion in the
    database applies immediately, with the very same token."""
    token, _ = await register_and_login(client)
    users = db.users

    await users.update_one({"email": "student@campus.edu"}, {"$set": {"role": "admin"}})
    assert (await client.get("/_test/admin-only", headers=bearer(token))).status_code == 200

    await users.update_one({"email": "student@campus.edu"}, {"$set": {"role": "student"}})
    assert (await client.get("/_test/admin-only", headers=bearer(token))).status_code == 403
