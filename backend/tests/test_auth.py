import asyncio
from datetime import timedelta

import jwt

from app.security import create_access_token
from tests.helpers import (
    DEFAULT_PASSWORD,
    bearer,
    login,
    register,
    register_and_login,
)


# ---------------------------------------------------------------- register

async def test_register_success(client):
    resp = await register(client, email="Student@Campus.EDU", name="  Asha  ")
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "student@campus.edu"  # normalised to lowercase
    assert body["name"] == "Asha"
    assert body["role"] == "student"
    assert body["is_active"] is True
    assert "password" not in body and "password_hash" not in body


async def test_password_is_stored_hashed(client, db):
    await register(client)
    doc = await db.users.find_one({"email": "student@campus.edu"})
    assert doc["password_hash"].startswith("$argon2")
    assert DEFAULT_PASSWORD not in doc["password_hash"]


async def test_register_duplicate_email_is_case_insensitive(client):
    assert (await register(client, email="a@campus.edu")).status_code == 201
    resp = await register(client, email="A@CAMPUS.EDU")
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "EMAIL_TAKEN"


async def test_register_ignores_role_in_body(client):
    resp = await register(client, role="admin")
    assert resp.status_code == 201
    assert resp.json()["role"] == "student"


async def test_register_validation_error_has_uniform_shape(client):
    resp = await register(client, password="short")
    assert resp.status_code == 422
    error = resp.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert any(d["field"] == "body.password" for d in error["details"])


async def test_concurrent_registration_same_email_one_winner(client):
    """The unique index, not an application check, decides the race."""
    r1, r2 = await asyncio.gather(
        register(client, email="race@campus.edu"),
        register(client, email="race@campus.edu"),
    )
    assert sorted([r1.status_code, r2.status_code]) == [201, 409]


# ------------------------------------------------------------------- login

async def test_login_success_and_me(client):
    token, user = await register_and_login(client)
    me = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert me.status_code == 200
    assert me.json()["id"] == user["id"]
    assert me.json()["email"] == "student@campus.edu"


async def test_login_email_is_case_insensitive(client):
    await register(client, email="mixed@campus.edu")
    resp = await login(client, email="MiXeD@Campus.edu")
    assert resp.status_code == 200


async def test_login_wrong_password(client):
    await register(client)
    resp = await login(client, password="not-the-password")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"


async def test_login_unknown_email_is_indistinguishable_from_wrong_password(client):
    await register(client)
    wrong_pw = await login(client, password="not-the-password")
    no_user = await login(client, email="nobody@campus.edu")
    assert no_user.status_code == wrong_pw.status_code == 401
    assert no_user.json() == wrong_pw.json()


# ------------------------------------------------------------ token checks

async def test_me_requires_token(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "UNAUTHORIZED"
    assert resp.headers["www-authenticate"] == "Bearer"


async def test_me_rejects_garbage_token(client):
    resp = await client.get("/api/v1/auth/me", headers=bearer("not-a-jwt"))
    assert resp.status_code == 401


async def test_me_rejects_expired_token(client, settings):
    _, user = await register_and_login(client)
    expired = create_access_token(user["id"], "student", settings, timedelta(seconds=-5))
    resp = await client.get("/api/v1/auth/me", headers=bearer(expired))
    assert resp.status_code == 401


async def test_me_rejects_token_signed_with_another_secret(client):
    _, user = await register_and_login(client)
    forged = jwt.encode({"sub": user["id"], "role": "admin", "exp": 4102444800},
                        "x" * 40, algorithm="HS256")
    resp = await client.get("/api/v1/auth/me", headers=bearer(forged))
    assert resp.status_code == 401


async def test_me_rejects_token_for_deleted_user(client, db):
    token, _ = await register_and_login(client)
    await db.users.delete_one({"email": "student@campus.edu"})
    resp = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert resp.status_code == 401


async def test_disabled_user_cannot_login_or_use_existing_token(client, db):
    token, _ = await register_and_login(client)
    await db.users.update_one({"email": "student@campus.edu"}, {"$set": {"is_active": False}})

    me = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert me.status_code == 401
    assert me.json()["error"]["code"] == "ACCOUNT_DISABLED"

    again = await login(client)
    assert again.status_code == 403
    assert again.json()["error"]["code"] == "ACCOUNT_DISABLED"
