from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from bson import ObjectId

from tests.helpers import create_facility, create_sport

X = "/api/v1/admin/analytics"
ENDPOINTS = ["summary", "popular-sports", "busiest-facilities", "peak-hours",
             "bookings-over-time", "cancellations", "utilization"]


def ist(day: str, hhmm: str) -> datetime:
    return datetime.fromisoformat(f"{day}T{hhmm}:00+05:30").astimezone(timezone.utc)


def booking(facility_id, sport_id, user, day, hhmm, status="confirmed", by=None):
    start = ist(day, hhmm)
    return {
        "user_id": user, "facility_id": ObjectId(facility_id), "sport_id": ObjectId(sport_id),
        "start": start, "end": start + timedelta(hours=1), "status": status,
        "created_at": start - timedelta(days=2), "updated_at": start - timedelta(days=2),
        "cancelled_at": None if status == "confirmed" else start - timedelta(days=1),
        "cancelled_by": by, "cancel_reason": None,
    }


@pytest_asyncio.fixture
async def data(client, admin_headers, db, badminton, facility):
    """Known bookings (the fake clock is Monday 2026-11-02 09:30 IST; default range = 30 days):

    Badminton Court 1: Oct 27 17:00, 18:00 | Oct 28 18:00 | Oct 29 18:00 | Oct 30 19:00
    Court 2:           Oct 28 17:00 | Oct 29 17:00
    Main Ground (Football): Oct 30 07:00
    cancelled: Court 1 Oct 31 18:00 (student), Court 2 Oct 31 17:00 (admin)
    """
    court2 = (await create_facility(client, admin_headers, badminton, name="Court 2")).json()["id"]
    football = (await create_sport(client, admin_headers, name="Football", category="team",
                                   attributes=[])).json()["id"]
    ground = (await create_facility(client, admin_headers, football, name="Main Ground",
                                    metadata={})).json()["id"]
    u1, u2, u3 = ObjectId(), ObjectId(), ObjectId()
    await db.bookings.insert_many([
        booking(facility, badminton, u1, "2026-10-27", "17:00"),
        booking(facility, badminton, u1, "2026-10-27", "18:00"),
        booking(facility, badminton, u2, "2026-10-28", "18:00"),
        booking(facility, badminton, u2, "2026-10-29", "18:00"),
        booking(facility, badminton, u3, "2026-10-30", "19:00"),
        booking(court2, badminton, u1, "2026-10-28", "17:00"),
        booking(court2, badminton, u3, "2026-10-29", "17:00"),
        booking(ground, football, u2, "2026-10-30", "07:00"),
        booking(facility, badminton, u1, "2026-10-31", "18:00", "cancelled", "student"),
        booking(court2, badminton, u2, "2026-10-31", "17:00", "cancelled", "admin"),
    ])
    return {"facility": facility, "court2": court2, "ground": ground,
            "badminton": badminton, "football": football, "u1": u1}


async def get(client, headers, path, **params):
    resp = await client.get(f"{X}/{path}", params=params, headers=headers)
    assert resp.status_code == 200, resp.text
    return resp.json()


# ------------------------------------------------------------------ access

@pytest.mark.parametrize("path", ENDPOINTS)
async def test_analytics_are_admin_only(client, student_headers, path):
    assert (await client.get(f"{X}/{path}")).status_code == 401
    assert (await client.get(f"{X}/{path}", headers=student_headers)).status_code == 403


async def test_invalid_ranges(client, admin_headers):
    backwards = await client.get(f"{X}/summary", headers=admin_headers,
                                 params={"date_from": "2026-11-02", "date_to": "2026-10-01"})
    assert backwards.status_code == 422 and backwards.json()["error"]["code"] == "INVALID_RANGE"
    too_long = await client.get(f"{X}/summary", headers=admin_headers,
                                params={"date_from": "2025-01-01", "date_to": "2026-11-02"})
    assert too_long.status_code == 422


# ---------------------------------------------------------------- pipelines

async def test_popular_sports(client, admin_headers, data):
    body = await get(client, admin_headers, "popular-sports")
    assert body["range"] == {"date_from": "2026-10-04", "date_to": "2026-11-02",
                             "timezone": "Asia/Kolkata"}
    items = body["items"]
    assert [(i["name"], i["bookings"]) for i in items] == [("Badminton", 7), ("Football", 1)]
    assert items[0]["share"] == 0.875 and items[1]["share"] == 0.125


async def test_busiest_facilities(client, admin_headers, data):
    items = (await get(client, admin_headers, "busiest-facilities"))["items"]
    assert [(i["name"], i["sport_name"], i["bookings"]) for i in items] == [
        ("Badminton Court 1", "Badminton", 5),
        ("Court 2", "Badminton", 2),
        ("Main Ground", "Football", 1),
    ]
    top2 = (await get(client, admin_headers, "busiest-facilities", limit=2))["items"]
    assert [i["name"] for i in top2] == ["Badminton Court 1", "Court 2"]
    zero = await client.get(f"{X}/busiest-facilities", params={"limit": 0}, headers=admin_headers)
    assert zero.status_code == 422


async def test_peak_hours_are_campus_local_and_zero_filled(client, admin_headers, data):
    items = (await get(client, admin_headers, "peak-hours"))["items"]
    assert [i["hour"] for i in items] == list(range(24))
    by_hour = {i["hour"]: i["bookings"] for i in items}
    assert by_hour[17] == 3 and by_hour[18] == 3 and by_hour[19] == 1 and by_hour[7] == 1
    assert sum(by_hour.values()) == 8  # cancelled bookings are not counted


async def test_bookings_over_time(client, admin_headers, data):
    days = (await get(client, admin_headers, "bookings-over-time"))["items"]
    assert len(days) == 30 and days[0]["period"] == "2026-10-04"  # zero-filled, no gaps
    per_day = {d["period"]: d["bookings"] for d in days}
    assert per_day["2026-10-27"] == per_day["2026-10-28"] == 2
    assert per_day["2026-10-29"] == per_day["2026-10-30"] == 2
    assert per_day["2026-10-31"] == 0 and sum(per_day.values()) == 8

    weeks = (await get(client, admin_headers, "bookings-over-time", granularity="week"))["items"]
    assert weeks == [{"period": "2026-W44", "bookings": 8}]
    months = (await get(client, admin_headers, "bookings-over-time", granularity="month"))["items"]
    assert months == [{"period": "2026-10", "bookings": 8}]

    bad = await client.get(f"{X}/bookings-over-time", params={"granularity": "hour"},
                           headers=admin_headers)
    assert bad.status_code == 422


async def test_cancellations(client, admin_headers, data):
    body = await get(client, admin_headers, "cancellations")
    assert (body["total"], body["confirmed"], body["cancelled"]) == (10, 8, 2)
    assert body["cancellation_rate"] == 0.2
    assert body["cancelled_by_student"] == 1 and body["cancelled_by_admin"] == 1


async def test_utilization_counts_only_slots_that_have_started(client, admin_headers, data):
    items = (await get(client, admin_headers, "utilization"))["items"]
    # 20 weekdays x 15 slots + the 4 slots of today (Mon) that started before 09:30 IST
    assert {i["capacity"] for i in items} == {304}
    assert [(i["name"], i["booked"]) for i in items] == [
        ("Badminton Court 1", 5), ("Court 2", 2), ("Main Ground", 1)]
    assert items[0]["utilization"] == 0.0164 and items[0]["sport_name"] == "Badminton"


async def test_date_range_filter(client, admin_headers, data):
    items = (await get(client, admin_headers, "popular-sports",
                       date_from="2026-10-28", date_to="2026-10-29"))["items"]
    assert [(i["name"], i["bookings"], i["share"]) for i in items] == [("Badminton", 4, 1.0)]


# ------------------------------------------------------------------ summary

async def test_summary(client, admin_headers, data):
    s = await get(client, admin_headers, "summary")
    assert (s["total_bookings"], s["confirmed"], s["cancelled"]) == (10, 8, 2)
    assert s["cancellation_rate"] == 0.2 and s["unique_students"] == 3
    assert s["most_popular_sport"] == {"sport_id": data["badminton"], "name": "Badminton",
                                       "bookings": 7}
    assert s["peak_hour"] == {"hour": 17, "bookings": 3}  # 17 and 18 tie -> earliest
    assert (s["active_facilities"], s["total_facilities"]) == (3, 3)
    assert s["todays_bookings"] == 0 and s["upcoming_bookings"] == 0


async def test_summary_today_and_upcoming_cards(client, admin_headers, db, data):
    await db.bookings.insert_one(
        booking(data["facility"], data["badminton"], data["u1"], "2026-11-02", "15:00"))
    s = await get(client, admin_headers, "summary")
    assert s["todays_bookings"] == 1 and s["upcoming_bookings"] == 1
    assert (s["confirmed"], s["cancelled"], s["total_bookings"]) == (9, 2, 11)
    assert s["cancellation_rate"] == 0.1818 and s["most_popular_sport"]["bookings"] == 8


async def test_summary_counts_only_active_facilities_as_available(client, admin_headers, data):
    await client.patch(f"/api/v1/facilities/{data['court2']}", json={"status": "maintenance"},
                       headers=admin_headers)
    s = await get(client, admin_headers, "summary")
    assert (s["active_facilities"], s["total_facilities"]) == (2, 3)


async def test_empty_database_gives_empty_but_valid_results(client, admin_headers):
    s = await get(client, admin_headers, "summary")
    assert s["total_bookings"] == 0 and s["cancellation_rate"] == 0.0
    assert s["most_popular_sport"] is None and s["peak_hour"] is None
    assert (await get(client, admin_headers, "popular-sports"))["items"] == []
    assert len((await get(client, admin_headers, "peak-hours"))["items"]) == 24
