from datetime import datetime

from tests.helpers import WEEKDAY_HOURS, create_facility, create_sport

F = "/api/v1/facilities"
UNKNOWN_ID = "507f1f77bcf86cd799439011"


def names(resp):
    return [f["name"] for f in resp.json()]


# ------------------------------------------------------------------- create

async def test_create_facility(client, admin_headers, badminton):
    resp = await create_facility(client, admin_headers, badminton)
    assert resp.status_code == 201
    body = resp.json()
    assert body["sport"]["name"] == "Badminton"  # joined in from the sports collection
    assert body["metadata"] == {"surface": "wooden", "air_conditioning": True}
    assert body["status"] == "active" and body["slot_minutes"] == 60
    assert body["operating_hours"]["mon"] == [{"open": "06:00", "close": "21:00"}]
    assert body["operating_hours"]["sat"] == []  # closed


async def test_only_admins_can_create_facilities(client, student_headers, badminton):
    assert (await create_facility(client, {}, badminton)).status_code == 401
    assert (await create_facility(client, student_headers, badminton)).status_code == 403


async def test_metadata_must_match_the_sports_attributes(client, admin_headers, badminton):
    cases = {
        "metadata.colour": {"surface": "wooden", "colour": "red"},   # unknown attribute
        "metadata.surface": {"air_conditioning": True},              # required one missing
    }
    for field, metadata in cases.items():
        resp = await create_facility(client, admin_headers, badminton, metadata=metadata)
        assert resp.status_code == 422
        error = resp.json()["error"]
        assert error["code"] == "INVALID_METADATA"
        assert field in [d["field"] for d in error["details"]]

    bad_enum = await create_facility(client, admin_headers, badminton, metadata={"surface": "ice"})
    assert bad_enum.status_code == 422


async def test_unknown_sport_is_rejected(client, admin_headers):
    for sport_id in (UNKNOWN_ID, "nope"):
        resp = await create_facility(client, admin_headers, sport_id)
        assert resp.status_code == 422
        assert resp.json()["error"]["code"] == "SPORT_NOT_FOUND"


async def test_invalid_operating_hours(client, admin_headers, badminton):
    reversed_window = {"mon": [{"open": "10:00", "close": "09:00"}]}
    overlapping = {"mon": [{"open": "06:00", "close": "12:00"}, {"open": "11:00", "close": "14:00"}]}
    bad_format = {"mon": [{"open": "6am", "close": "9pm"}]}
    for hours in (reversed_window, overlapping, bad_format):
        resp = await create_facility(client, admin_headers, badminton, operating_hours=hours)
        assert resp.status_code == 422, hours

    too_short = {"mon": [{"open": "06:00", "close": "06:30"}]}
    resp = await create_facility(client, admin_headers, badminton, operating_hours=too_short)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "INVALID_HOURS"


async def test_facility_name_is_unique_per_sport_only(client, admin_headers, badminton):
    assert (await create_facility(client, admin_headers, badminton, name="Court 1")).status_code == 201
    dup = await create_facility(client, admin_headers, badminton, name="COURT 1")
    assert dup.status_code == 409
    assert dup.json()["error"]["code"] == "FACILITY_EXISTS"

    tennis = (await create_sport(client, admin_headers, name="Tennis", attributes=[])).json()["id"]
    ok = await create_facility(client, admin_headers, tennis, name="Court 1", metadata={})
    assert ok.status_code == 201


# --------------------------------------------------------------------- list

async def test_list_is_public_and_naturally_sorted(client, admin_headers, badminton):
    for name in ("Court 10", "Court 2", "Court 1"):
        await create_facility(client, admin_headers, badminton, name=name)
    resp = await client.get(F)  # no auth
    assert resp.status_code == 200
    assert names(resp) == ["Court 1", "Court 2", "Court 10"]
    assert resp.json()[0]["sport"]["name"] == "Badminton"


async def test_inactive_facilities_are_hidden_from_the_public(client, admin_headers,
                                                              student_headers, badminton):
    await create_facility(client, admin_headers, badminton, name="Open Court")
    await create_facility(client, admin_headers, badminton, name="Closed Court", status="inactive")

    assert names(await client.get(F)) == ["Open Court"]
    all_for_admin = await client.get(F, params={"include_inactive": "true"}, headers=admin_headers)
    assert sorted(names(all_for_admin)) == ["Closed Court", "Open Court"]

    student = await client.get(F, params={"include_inactive": "true"}, headers=student_headers)
    assert student.status_code == 403
    anonymous = await client.get(F, params={"include_inactive": "true"})
    assert anonymous.status_code == 401


async def test_filter_by_sport(client, admin_headers, badminton):
    tennis = (await create_sport(client, admin_headers, name="Tennis", attributes=[])).json()["id"]
    await create_facility(client, admin_headers, badminton, name="B1")
    await create_facility(client, admin_headers, tennis, name="T1", metadata={})
    assert names(await client.get(F, params={"sport_id": tennis})) == ["T1"]


async def test_search_by_name_or_location(client, admin_headers, badminton):
    await create_facility(client, admin_headers, badminton, name="Alpha")
    await create_facility(client, admin_headers, badminton, name="Beta", location="North Field")
    assert names(await client.get(F, params={"q": "alp"})) == ["Alpha"]
    assert names(await client.get(F, params={"q": "north"})) == ["Beta"]
    assert names(await client.get(F, params={"q": "zzz"})) == []


async def test_metadata_filters(client, admin_headers, badminton):
    await create_facility(client, admin_headers, badminton, name="Wood AC",
                          metadata={"surface": "wooden", "air_conditioning": True, "courts": 4})
    await create_facility(client, admin_headers, badminton, name="Synth",
                          metadata={"surface": "synthetic", "air_conditioning": False, "courts": 2})

    def q(**meta):
        return {"sport_id": badminton, **{f"meta.{k}": v for k, v in meta.items()}}

    assert names(await client.get(F, params=q(surface="wooden"))) == ["Wood AC"]
    assert names(await client.get(F, params=q(air_conditioning="false"))) == ["Synth"]
    assert names(await client.get(F, params=q(courts="2"))) == ["Synth"]
    assert names(await client.get(F, params=q(surface="wooden", air_conditioning="false"))) == []


async def test_invalid_metadata_filters(client, admin_headers, badminton):
    bad_bool = await client.get(F, params={"sport_id": badminton, "meta.air_conditioning": "maybe"})
    assert bad_bool.status_code == 422
    assert bad_bool.json()["error"]["code"] == "INVALID_FILTER"

    unknown = await client.get(F, params={"sport_id": badminton, "meta.nope": "x"})
    assert unknown.status_code == 422

    needs_sport = await client.get(F, params={"meta.surface": "wooden"})
    assert needs_sport.status_code == 422


# ------------------------------------------------------------- get / update

async def test_get_facility_and_404(client, admin_headers, badminton):
    fid = (await create_facility(client, admin_headers, badminton)).json()["id"]
    assert (await client.get(f"{F}/{fid}")).json()["name"] == "Badminton Court 1"
    assert (await client.get(f"{F}/{UNKNOWN_ID}")).status_code == 404
    assert (await client.get(f"{F}/not-an-id")).status_code == 404


async def test_update_facility(client, admin_headers, student_headers, badminton):
    fid = (await create_facility(client, admin_headers, badminton)).json()["id"]

    assert (await client.patch(f"{F}/{fid}", json={"status": "maintenance"},
                               headers=student_headers)).status_code == 403

    resp = await client.patch(f"{F}/{fid}", headers=admin_headers, json={
        "status": "maintenance",
        "metadata": {"surface": "synthetic", "courts": 3},
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "maintenance"
    assert body["metadata"] == {"surface": "synthetic", "courts": 3}  # replaced, not merged
    assert datetime.fromisoformat(body["updated_at"]) >= datetime.fromisoformat(body["created_at"])


async def test_update_validates_metadata_hours_and_nulls(client, admin_headers, badminton):
    fid = (await create_facility(client, admin_headers, badminton)).json()["id"]
    bad_meta = await client.patch(f"{F}/{fid}", headers=admin_headers, json={"metadata": {"x": 1}})
    assert bad_meta.status_code == 422 and bad_meta.json()["error"]["code"] == "INVALID_METADATA"

    # 120-minute slots do not fit a 06:00-07:00 window
    short = {"mon": [{"open": "06:00", "close": "07:00"}]}
    bad_hours = await client.patch(f"{F}/{fid}", headers=admin_headers,
                                   json={"operating_hours": short, "slot_minutes": 120})
    assert bad_hours.status_code == 422

    null_name = await client.patch(f"{F}/{fid}", headers=admin_headers, json={"name": None})
    assert null_name.status_code == 422

    unchanged = await client.patch(f"{F}/{fid}", headers=admin_headers, json={})
    assert unchanged.status_code == 200 and unchanged.json()["name"] == "Badminton Court 1"
    assert unchanged.json()["operating_hours"]["mon"] == WEEKDAY_HOURS["mon"]


async def test_changing_sport_revalidates_metadata(client, admin_headers, badminton):
    football_attrs = [{"key": "field_size", "label": "Field size", "type": "string", "required": True}]
    football = (await create_sport(client, admin_headers, name="Football", category="team",
                                   attributes=football_attrs)).json()["id"]
    fid = (await create_facility(client, admin_headers, badminton)).json()["id"]

    # existing badminton metadata is not valid for football
    resp = await client.patch(f"{F}/{fid}", headers=admin_headers, json={"sport_id": football})
    assert resp.status_code == 422 and resp.json()["error"]["code"] == "INVALID_METADATA"

    ok = await client.patch(f"{F}/{fid}", headers=admin_headers,
                            json={"sport_id": football, "metadata": {"field_size": "5-a-side"}})
    assert ok.status_code == 200 and ok.json()["sport"]["name"] == "Football"


async def test_update_to_existing_name_conflicts(client, admin_headers, badminton):
    await create_facility(client, admin_headers, badminton, name="A")
    b = (await create_facility(client, admin_headers, badminton, name="B")).json()["id"]
    assert (await client.patch(f"{F}/{b}", headers=admin_headers,
                               json={"name": "a"})).status_code == 409


async def test_metadata_wildcard_index_exists(db):
    info = await db.facilities.index_information()
    assert "facilities_metadata_wildcard" in info
    assert info["facilities_sport_name_unique_ci"]["unique"] is True
