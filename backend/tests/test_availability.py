from tests.helpers import MON, SAT, TUE, at, book, create_facility, make_student, slots

F = "/api/v1/facilities"


async def test_todays_grid_marks_started_slots_as_past(client, facility):
    # clock = Monday 09:30 IST; slots start 06:00..20:00 hourly -> 06,07,08,09 are past
    resp = await slots(client, facility, MON)
    assert resp.status_code == 200
    body = resp.json()
    assert body["timezone"] == "Asia/Kolkata" and body["slot_minutes"] == 60
    statuses = [s["status"] for s in body["slots"]]
    assert len(statuses) == 15
    assert statuses.count("past") == 4 and statuses.count("available") == 11


async def test_future_day_is_fully_available(client, facility):
    body = (await slots(client, facility, TUE)).json()
    assert {s["status"] for s in body["slots"]} == {"available"}
    assert body["slots"][0]["start"].startswith("2026-11-03T00:30:00")  # 06:00 IST in UTC


async def test_closed_day_returns_no_slots(client, facility):
    resp = await slots(client, facility, SAT)  # facility is closed on Saturdays
    assert resp.status_code == 200 and resp.json()["slots"] == []


async def test_date_window_is_enforced(client, facility):
    assert (await slots(client, facility, "2026-11-01")).status_code == 422  # yesterday
    assert (await slots(client, facility, "2026-11-16")).status_code == 200  # today + 14
    out = await slots(client, facility, "2026-11-17")                         # today + 15
    assert out.status_code == 422
    assert out.json()["error"]["code"] == "DATE_OUT_OF_RANGE"


async def test_booked_slots_are_shown_and_flagged_for_their_owner(client, facility,
                                                                  student_headers):
    other = await make_student(client, 2)
    assert (await book(client, student_headers, facility, at(TUE, "10:00"))).status_code == 201

    def row(resp):
        return next(s for s in resp.json()["slots"] if s["start"].startswith("2026-11-03T04:30"))

    mine = row(await slots(client, facility, TUE, student_headers))
    theirs = row(await slots(client, facility, TUE, other))
    anonymous = row(await slots(client, facility, TUE))
    assert mine["status"] == theirs["status"] == anonymous["status"] == "booked"
    assert mine["booked_by_me"] is True
    assert theirs["booked_by_me"] is False and anonymous["booked_by_me"] is False


async def test_maintenance_makes_every_slot_unavailable(client, admin_headers, facility):
    await client.patch(f"{F}/{facility}", json={"status": "maintenance"}, headers=admin_headers)
    body = (await slots(client, facility, TUE)).json()
    assert body["facility_status"] == "maintenance"
    assert {s["status"] for s in body["slots"]} == {"unavailable"}


async def test_unknown_or_inactive_facility_is_404(client, admin_headers, facility):
    assert (await slots(client, "507f1f77bcf86cd799439011", TUE)).status_code == 404
    assert (await slots(client, "not-an-id", TUE)).status_code == 404
    await client.patch(f"{F}/{facility}", json={"status": "inactive"}, headers=admin_headers)
    assert (await slots(client, facility, TUE)).status_code == 404
