import pytest_asyncio

from tests.helpers import TUE, WED, at, book, cancel, create_facility, make_student

A = "/api/v1/admin/bookings"


@pytest_asyncio.fixture
async def data(client, admin_headers, badminton, facility):
    s1, s2 = await make_student(client, 1), await make_student(client, 2)
    court2 = (await create_facility(client, admin_headers, badminton, name="Court 2")).json()["id"]
    b1 = (await book(client, s1, facility, at(TUE, "10:00"))).json()
    b2 = (await book(client, s2, court2, at(TUE, "11:00"))).json()
    b3 = (await book(client, s1, facility, at(WED, "10:00"))).json()
    await cancel(client, s1, b3["id"])
    return {"court2": court2, "sport": badminton, "b1": b1, "b2": b2, "b3": b3}


def ids(resp):
    return [b["id"] for b in resp.json()["items"]]


async def test_only_admins_can_list(client, student_headers):
    assert (await client.get(A)).status_code == 401
    assert (await client.get(A, headers=student_headers)).status_code == 403


async def test_lists_everything_newest_first_with_user_facility_and_sport(client, admin_headers, data):
    resp = await client.get(A, headers=admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert ids(resp) == [data["b3"]["id"], data["b2"]["id"], data["b1"]["id"]]  # start descending
    first = body["items"][-1]
    assert first["user"]["email"] == "student1@campus.edu"
    assert first["facility"]["name"] == "Badminton Court 1"
    assert first["sport"]["name"] == "Badminton"


async def test_filters(client, admin_headers, data):
    def get(**params):
        return client.get(A, params=params, headers=admin_headers)

    assert ids(await get(status="cancelled")) == [data["b3"]["id"]]
    assert ids(await get(facility_id=data["court2"])) == [data["b2"]["id"]]
    assert ids(await get(user_id=data["b1"]["user_id"])) == [data["b3"]["id"], data["b1"]["id"]]
    assert len(ids(await get(sport_id=data["sport"]))) == 3
    assert ids(await get(q="student2@")) == [data["b2"]["id"]]
    assert ids(await get(q="nobody")) == []


async def test_date_filters_use_campus_local_dates(client, admin_headers, data):
    def get(**params):
        return client.get(A, params=params, headers=admin_headers)

    assert ids(await get(date_from=TUE, date_to=TUE)) == [data["b2"]["id"], data["b1"]["id"]]
    assert ids(await get(date_from=WED)) == [data["b3"]["id"]]
    assert len(ids(await get(date_to=WED))) == 3


async def test_paging_reports_the_total(client, admin_headers, data):
    page = await client.get(A, params={"limit": 1, "skip": 2}, headers=admin_headers)
    body = page.json()
    assert body["total"] == 3 and body["limit"] == 1 and body["skip"] == 2
    assert ids(page) == [data["b1"]["id"]]


async def test_invalid_parameters_are_rejected(client, admin_headers):
    bad_id = await client.get(A, params={"facility_id": "nope"}, headers=admin_headers)
    assert bad_id.status_code == 422 and bad_id.json()["error"]["code"] == "INVALID_FILTER"
    assert (await client.get(A, params={"limit": 0}, headers=admin_headers)).status_code == 422
    assert (await client.get(A, params={"status": "weird"}, headers=admin_headers)).status_code == 422
