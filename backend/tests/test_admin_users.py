from tests.helpers import TUE, at, book, bearer, login, make_student, register_and_login

U = "/api/v1/admin/users"


async def test_only_admins_can_manage_users(client, student_headers):
    assert (await client.get(U)).status_code == 401
    assert (await client.get(U, headers=student_headers)).status_code == 403
    patch = await client.patch(f"{U}/507f1f77bcf86cd799439011", json={}, headers=student_headers)
    assert patch.status_code == 403


async def test_list_and_filter_users(client, admin_headers, student_headers):
    everyone = (await client.get(U, headers=admin_headers)).json()
    assert everyone["total"] == 2
    assert all("password_hash" not in u for u in everyone["items"])

    def emails(resp):
        return [u["email"] for u in resp.json()["items"]]

    admins = await client.get(U, params={"role": "admin"}, headers=admin_headers)
    assert emails(admins) == ["admin@campus.edu"]
    search = await client.get(U, params={"q": "STUDENT@"}, headers=admin_headers)
    assert emails(search) == ["student@campus.edu"]
    inactive = await client.get(U, params={"is_active": "false"}, headers=admin_headers)
    assert inactive.json()["total"] == 0


async def test_disabling_a_user_takes_effect_immediately_and_is_reversible(client, admin_headers):
    token, user = await register_and_login(client, email="victim@campus.edu")

    off = await client.patch(f"{U}/{user['id']}", json={"is_active": False}, headers=admin_headers)
    assert off.status_code == 200 and off.json()["is_active"] is False

    me = await client.get("/api/v1/auth/me", headers=bearer(token))
    assert me.status_code == 401 and me.json()["error"]["code"] == "ACCOUNT_DISABLED"
    assert (await login(client, email="victim@campus.edu")).status_code == 403

    await client.patch(f"{U}/{user['id']}", json={"is_active": True}, headers=admin_headers)
    assert (await login(client, email="victim@campus.edu")).status_code == 200


async def test_disabling_can_also_cancel_upcoming_bookings(client, admin_headers, facility):
    token, user = await register_and_login(client, email="victim@campus.edu")
    booking = (await book(client, bearer(token), facility, at(TUE, "10:00"))).json()

    resp = await client.patch(
        f"{U}/{user['id']}",
        json={"is_active": False, "cancel_upcoming_bookings": True},
        headers=admin_headers,
    )
    assert resp.status_code == 200 and resp.json()["cancelled_bookings"] == 1

    cancelled = (await client.get(f"/api/v1/bookings/{booking['id']}", headers=admin_headers)).json()
    assert cancelled["status"] == "cancelled"
    assert cancelled["cancel_reason"] == "Account disabled" and cancelled["cancelled_by"] == "admin"

    # the slot is free again
    other = await make_student(client, 2)
    assert (await book(client, other, facility, at(TUE, "10:00"))).status_code == 201


async def test_admin_cannot_modify_themselves(client, admin_headers):
    me = (await client.get("/api/v1/auth/me", headers=admin_headers)).json()
    for body in ({"is_active": False}, {"role": "student"}):
        resp = await client.patch(f"{U}/{me['id']}", json=body, headers=admin_headers)
        assert resp.status_code == 409 and resp.json()["error"]["code"] == "CANNOT_MODIFY_SELF"


async def test_promoting_a_student_grants_admin_access(client, admin_headers):
    token, user = await register_and_login(client, email="future-admin@campus.edu")
    assert (await client.get(U, headers=bearer(token))).status_code == 403

    resp = await client.patch(f"{U}/{user['id']}", json={"role": "admin"}, headers=admin_headers)
    assert resp.status_code == 200 and resp.json()["role"] == "admin"
    assert (await client.get(U, headers=bearer(token))).status_code == 200  # same token


async def test_update_edge_cases(client, admin_headers, student_headers):
    me = (await client.get("/api/v1/auth/me", headers=student_headers)).json()
    assert (await client.patch(f"{U}/507f1f77bcf86cd799439011", json={"is_active": False},
                               headers=admin_headers)).status_code == 404
    assert (await client.patch(f"{U}/not-an-id", json={}, headers=admin_headers)).status_code == 404
    null = await client.patch(f"{U}/{me['id']}", json={"role": None}, headers=admin_headers)
    assert null.status_code == 422
    nothing = await client.patch(f"{U}/{me['id']}", json={}, headers=admin_headers)
    assert nothing.status_code == 200 and nothing.json()["email"] == "student@campus.edu"
    bad_role = await client.patch(f"{U}/{me['id']}", json={"role": "superuser"}, headers=admin_headers)
    assert bad_role.status_code == 422
