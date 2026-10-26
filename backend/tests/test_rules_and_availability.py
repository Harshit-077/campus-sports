from datetime import datetime, timezone

from tests.helpers import TUE, at, book, create_facility

F = "/api/v1/facilities"


async def test_rules_are_public_and_reflect_settings(client, settings):
    resp = await client.get("/api/v1/rules")  # no auth
    assert resp.status_code == 200
    assert resp.json() == {
        "booking_window_days": settings.booking_window_days,
        "cancellation_cutoff_minutes": settings.cancellation_cutoff_minutes,
        "max_active_bookings": settings.max_active_bookings,
        "campus_timezone": "Asia/Kolkata",
    }


async def test_availability_is_off_unless_requested(client, facility):
    plain = (await client.get(F)).json()
    assert plain[0]["availability"] is None


async def test_availability_summary_for_today(client, facility, student_headers):
    # clock: Monday 09:30 IST. Slots 10:00 ... 20:00 are still ahead -> 11 open.
    item = (await client.get(F, params={"with_availability": "true"})).json()[0]
    assert item["availability"]["open_slots_today"] == 11
    assert item["availability"]["next_slot"]["start"].startswith("2026-11-02T04:30:00")  # 10:00 IST

    # a booking at 10:00 today takes the next slot away
    assert (await book(client, student_headers, facility, at("2026-11-02", "10:00"))).status_code == 201
    item = (await client.get(F, params={"with_availability": "true"})).json()[0]
    assert item["availability"]["open_slots_today"] == 10
    assert item["availability"]["next_slot"]["start"].startswith("2026-11-02T05:30:00")  # 11:00 IST


async def test_no_slots_left_or_closed_day(client, facility, clock):
    clock.now = datetime(2026, 11, 2, 15, 30, tzinfo=timezone.utc)  # Monday 21:00 IST, after closing
    item = (await client.get(F, params={"with_availability": "true"})).json()[0]
    assert item["availability"] == {"open_slots_today": 0, "next_slot": None}

    clock.now = datetime(2026, 11, 7, 4, 30, tzinfo=timezone.utc)  # Saturday: facility closed
    item = (await client.get(F, params={"with_availability": "true"})).json()[0]
    assert item["availability"] == {"open_slots_today": 0, "next_slot": None}


async def test_maintenance_facilities_have_no_availability(client, admin_headers, facility, badminton):
    await client.patch(f"{F}/{facility}", json={"status": "maintenance"}, headers=admin_headers)
    other = (await create_facility(client, admin_headers, badminton, name="Court 2")).json()["id"]
    items = {i["id"]: i for i in (await client.get(F, params={"with_availability": "true"})).json()}
    assert items[facility]["availability"] is None
    assert items[other]["availability"]["open_slots_today"] == 11


async def test_availability_works_with_filters(client, admin_headers, facility, badminton):
    resp = await client.get(F, params={"with_availability": "true", "sport_id": badminton,
                                       "meta.surface": "wooden"})
    assert resp.status_code == 200
    assert resp.json()[0]["availability"]["open_slots_today"] == 11


async def test_tue_is_unaffected_by_todays_summary(client, facility, student_headers):
    # bookings on other days do not change today's count
    await book(client, student_headers, facility, at(TUE, "10:00"))
    item = (await client.get(F, params={"with_availability": "true"})).json()[0]
    assert item["availability"]["open_slots_today"] == 11
