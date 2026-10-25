from tests.helpers import create_facility, create_sport

S = "/api/v1/sports"


async def test_list_is_public_and_sorted_by_name(client, admin_headers):
    await create_sport(client, admin_headers, name="Tennis", attributes=[])
    await create_sport(client, admin_headers, name="Badminton", attributes=[])
    resp = await client.get(S)  # no auth header
    assert resp.status_code == 200
    assert [s["name"] for s in resp.json()] == ["Badminton", "Tennis"]


async def test_only_admins_can_create(client, student_headers):
    payload = {"name": "Squash", "category": "racquet"}
    assert (await client.post(S, json=payload)).status_code == 401
    forbidden = await client.post(S, json=payload, headers=student_headers)
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "FORBIDDEN"


async def test_create_sport(client, admin_headers):
    resp = await create_sport(client, admin_headers, description="Indoor courts")
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Badminton" and body["description"] == "Indoor courts"
    assert body["attributes"][0]["key"] == "surface"
    assert body["attributes"][0]["options"] == ["wooden", "synthetic", "cement"]


async def test_duplicate_name_is_case_insensitive(client, admin_headers):
    assert (await create_sport(client, admin_headers, name="Badminton")).status_code == 201
    resp = await create_sport(client, admin_headers, name="badminton")
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "SPORT_EXISTS"


async def test_invalid_attribute_definitions_are_rejected(client, admin_headers):
    enum_without_options = [{"key": "surface", "label": "Surface", "type": "enum"}]
    bad_key = [{"key": "Bad Key", "label": "Bad", "type": "string"}]
    for attrs in (enum_without_options, bad_key):
        resp = await create_sport(client, admin_headers, name="X", attributes=attrs)
        assert resp.status_code == 422
        assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_update_sport(client, admin_headers, badminton):
    resp = await client.patch(f"{S}/{badminton}", headers=admin_headers,
                              json={"description": "Updated", "attributes": []})
    assert resp.status_code == 200
    assert resp.json()["description"] == "Updated" and resp.json()["attributes"] == []
    assert (await client.get(f"{S}/{badminton}")).json()["description"] == "Updated"


async def test_update_name_conflict(client, admin_headers, badminton):
    other = (await create_sport(client, admin_headers, name="Tennis", attributes=[])).json()["id"]
    resp = await client.patch(f"{S}/{other}", headers=admin_headers, json={"name": "BADMINTON"})
    assert resp.status_code == 409


async def test_update_requires_admin_and_rejects_null_name(client, admin_headers,
                                                          student_headers, badminton):
    assert (await client.patch(f"{S}/{badminton}", json={"name": "X"},
                               headers=student_headers)).status_code == 403
    assert (await client.patch(f"{S}/{badminton}", json={"name": None},
                               headers=admin_headers)).status_code == 422


async def test_cannot_delete_sport_that_has_facilities(client, admin_headers, badminton):
    assert (await create_facility(client, admin_headers, badminton)).status_code == 201
    resp = await client.delete(f"{S}/{badminton}", headers=admin_headers)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "SPORT_IN_USE"
    assert (await client.get(f"{S}/{badminton}")).status_code == 200


async def test_delete_unused_sport(client, admin_headers, student_headers, badminton):
    assert (await client.delete(f"{S}/{badminton}", headers=student_headers)).status_code == 403
    assert (await client.delete(f"{S}/{badminton}", headers=admin_headers)).status_code == 204
    assert (await client.get(f"{S}/{badminton}")).status_code == 404


async def test_unknown_and_malformed_ids_are_404(client):
    assert (await client.get(f"{S}/507f1f77bcf86cd799439011")).status_code == 404
    assert (await client.get(f"{S}/not-an-id")).status_code == 404
