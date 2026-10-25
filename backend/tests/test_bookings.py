from datetime import datetime, timezone

import pytest
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from tests.helpers import MON, SAT, TUE, WED, at, book, cancel, create_facility, make_student

B = "/api/v1/bookings"


def code(resp):
    return resp.json()["error"]["code"]


# ------------------------------------------------------------------ create

async def test_student_can_book_a_slot(client, facility, student_headers):
    resp = await book(client, student_headers, facility, at(TUE, "10:00"))
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "confirmed"
    assert body["start"].startswith("2026-11-03T04:30:00")  # 10:00 IST stored as UTC
    assert body["end"].startswith("2026-11-03T05:30:00")
    assert body["facility"]["name"] == "Badminton Court 1"   # joined in
    assert body["sport"]["name"] == "Badminton"
    assert body["can_cancel"] is True


async def test_same_instant_in_another_utc_offset_is_the_same_slot(client, facility,
                                                                   student_headers):
    # 10:00 IST == 04:30 UTC
    resp = await book(client, student_headers, facility, "2026-11-03T04:30:00Z")
    assert resp.status_code == 201


async def test_only_students_can_book(client, facility, admin_headers):
    anonymous = await book(client, {}, facility, at(TUE, "10:00"))
    assert anonymous.status_code == 401
    admin = await book(client, admin_headers, facility, at(TUE, "10:00"))
    assert admin.status_code == 403


async def test_invalid_requests_are_rejected(client, facility, student_headers):
    naive = await book(client, student_headers, facility, "2026-11-03T10:00:00")
    assert naive.status_code == 422 and code(naive) == "VALIDATION_ERROR"

    cases = [
        (at(TUE, "10:30"), "INVALID_SLOT"),            # not on the slot grid
        (at(SAT, "10:00"), "INVALID_SLOT"),            # facility closed on Saturday
        (at(TUE, "05:00"), "INVALID_SLOT"),            # before opening
        (at(MON, "08:00"), "SLOT_IN_PAST"),            # clock is Monday 09:30
        (at("2026-11-20", "10:00"), "OUTSIDE_BOOKING_WINDOW"),
    ]
    for start, expected in cases:
        resp = await book(client, student_headers, facility, start)
        assert resp.status_code == 422, start
        assert code(resp) == expected, start


async def test_unknown_facility_is_404(client, student_headers):
    for fid in ("507f1f77bcf86cd799439011", "not-an-id"):
        assert (await book(client, student_headers, fid, at(TUE, "10:00"))).status_code == 404


async def test_maintenance_blocks_new_bookings(client, admin_headers, facility, student_headers):
    await client.patch(f"/api/v1/facilities/{facility}", json={"status": "maintenance"},
                       headers=admin_headers)
    resp = await book(client, student_headers, facility, at(TUE, "10:00"))
    assert resp.status_code == 409 and code(resp) == "FACILITY_UNAVAILABLE"


async def test_a_slot_cannot_be_booked_twice(client, facility, student_headers):
    other = await make_student(client, 2)
    assert (await book(client, student_headers, facility, at(TUE, "10:00"))).status_code == 201
    second = await book(client, other, facility, at(TUE, "10:00"))
    assert second.status_code == 409 and code(second) == "SLOT_TAKEN"


async def test_student_cannot_hold_two_overlapping_bookings(client, admin_headers, badminton,
                                                            facility, student_headers):
    court2 = (await create_facility(client, admin_headers, badminton, name="Court 2")).json()["id"]
    assert (await book(client, student_headers, facility, at(TUE, "10:00"))).status_code == 201
    clash = await book(client, student_headers, court2, at(TUE, "10:00"))
    assert clash.status_code == 409 and code(clash) == "USER_TIME_CLASH"
    # back-to-back is fine: 11:00 starts exactly when the first booking ends
    assert (await book(client, student_headers, court2, at(TUE, "11:00"))).status_code == 201


async def test_upcoming_booking_limit(client, facility, student_headers):
    for hour in ("06", "07", "08", "09", "10"):  # default limit is 5
        assert (await book(client, student_headers, facility, at(TUE, f"{hour}:00"))).status_code == 201
    sixth = await book(client, student_headers, facility, at(TUE, "11:00"))
    assert sixth.status_code == 409 and code(sixth) == "BOOKING_LIMIT_REACHED"


# ------------------------------------------------------------------ cancel

async def test_student_cancels_and_the_slot_becomes_bookable_again(client, facility,
                                                                   student_headers):
    other = await make_student(client, 2)
    booking = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()

    resp = await cancel(client, student_headers, booking["id"], reason="exam moved")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "cancelled" and body["cancelled_by"] == "student"
    assert body["cancel_reason"] == "exam moved" and body["can_cancel"] is False

    assert (await book(client, other, facility, at(TUE, "10:00"))).status_code == 201


async def test_cancel_twice_does_not_disturb_the_new_holder(client, facility, student_headers):
    """The stale-release scenario: a repeated/late cancel must not free a slot that has
    since been re-booked by someone else."""
    other = await make_student(client, 2)
    first = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    assert (await cancel(client, student_headers, first["id"])).status_code == 200
    assert (await book(client, other, facility, at(TUE, "10:00"))).status_code == 201

    again = await cancel(client, student_headers, first["id"])
    assert again.status_code == 409 and code(again) == "ALREADY_CANCELLED"

    grid = (await client.get(f"/api/v1/facilities/{facility}/slots",
                             params={"date": TUE}, headers=other)).json()
    assert [s["booked_by_me"] for s in grid["slots"]].count(True) == 1


async def test_cannot_cancel_someone_elses_booking(client, facility, student_headers):
    other = await make_student(client, 2)
    booking = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    resp = await cancel(client, other, booking["id"])
    assert resp.status_code == 404  # indistinguishable from "does not exist"


async def test_students_cannot_cancel_inside_the_cutoff(client, admin_headers, facility,
                                                        student_headers):
    # clock is Monday 09:30; the 10:00 slot starts in 30 min (< 60 min cut-off)
    booking = (await book(client, student_headers, facility, at(MON, "10:00"))).json()
    assert booking["can_cancel"] is False
    late = await cancel(client, student_headers, booking["id"])
    assert late.status_code == 409 and code(late) == "CANCELLATION_CLOSED"

    # admins are not bound by the cut-off
    resp = await cancel(client, admin_headers, booking["id"], reason="court flooded")
    assert resp.status_code == 200
    assert resp.json()["cancelled_by"] == "admin" and resp.json()["cancel_reason"] == "court flooded"

    # the 11:00 slot (90 min away) is still cancellable by the student
    ok = (await book(client, student_headers, facility, at(MON, "11:00"))).json()
    assert ok["can_cancel"] is True
    assert (await cancel(client, student_headers, ok["id"])).status_code == 200


async def test_finished_bookings_cannot_be_cancelled(client, admin_headers, facility,
                                                     student_headers, clock):
    booking = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    clock.now = datetime(2026, 11, 3, 6, 0, tzinfo=timezone.utc)  # after the 11:00 IST end
    for headers in (student_headers, admin_headers):
        resp = await cancel(client, headers, booking["id"])
        assert resp.status_code == 409 and code(resp) == "BOOKING_ENDED"


async def test_admin_can_cancel_any_booking(client, admin_headers, facility, student_headers):
    booking = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    assert (await cancel(client, admin_headers, booking["id"])).json()["status"] == "cancelled"


async def test_cancel_unknown_booking_is_404(client, student_headers):
    assert (await cancel(client, student_headers, "507f1f77bcf86cd799439011")).status_code == 404
    assert (await cancel(client, student_headers, "not-an-id")).status_code == 404


# ----------------------------------------------------------------- listing

async def test_my_bookings_upcoming_and_history(client, facility, student_headers):
    other = await make_student(client, 2)
    keep = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    dropped = (await book(client, student_headers, facility, at(TUE, "12:00"))).json()
    await cancel(client, student_headers, dropped["id"])
    await book(client, other, facility, at(WED, "10:00"))  # someone else's

    upcoming = (await client.get(f"{B}/me", headers=student_headers)).json()
    assert [b["id"] for b in upcoming] == [keep["id"]]
    assert upcoming[0]["facility"]["name"] == "Badminton Court 1"
    assert upcoming[0]["sport"]["name"] == "Badminton"

    history = (await client.get(f"{B}/me", params={"scope": "history"},
                                headers=student_headers)).json()
    assert [b["id"] for b in history] == [dropped["id"]]
    assert history[0]["status"] == "cancelled"


async def test_finished_bookings_move_to_history(client, facility, student_headers, clock):
    booking = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    clock.now = datetime(2026, 11, 3, 6, 0, tzinfo=timezone.utc)
    assert (await client.get(f"{B}/me", headers=student_headers)).json() == []
    history = (await client.get(f"{B}/me", params={"scope": "history"},
                                headers=student_headers)).json()
    assert [b["id"] for b in history] == [booking["id"]]


async def test_my_bookings_requires_login_and_validates_paging(client, student_headers):
    assert (await client.get(f"{B}/me")).status_code == 401
    assert (await client.get(f"{B}/me", params={"limit": 0}, headers=student_headers)).status_code == 422


async def test_get_booking_visibility(client, admin_headers, facility, student_headers):
    other = await make_student(client, 2)
    booking = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    url = f"{B}/{booking['id']}"
    assert (await client.get(url, headers=student_headers)).status_code == 200
    assert (await client.get(url, headers=admin_headers)).status_code == 200
    assert (await client.get(url, headers=other)).status_code == 404
    assert (await client.get(url)).status_code == 401


# ------------------------------------------------- database-level guarantees

async def test_booking_indexes(db):
    info = await db.bookings.index_information()
    guard = info["bookings_facility_start_confirmed_unique"]
    assert guard["unique"] is True
    assert guard["partialFilterExpression"] == {"status": "confirmed"}
    assert "bookings_user_start" in info and "bookings_status_start" in info


async def test_database_itself_refuses_a_second_confirmed_booking(db, facility):
    """Independent of the API: the unique partial index is the real guard."""
    doc = {
        "user_id": ObjectId(),
        "facility_id": ObjectId(facility),
        "start": datetime(2026, 11, 3, 4, 30, tzinfo=timezone.utc),
        "end": datetime(2026, 11, 3, 5, 30, tzinfo=timezone.utc),
        "status": "confirmed",
    }
    await db.bookings.insert_one(dict(doc))
    with pytest.raises(DuplicateKeyError):
        await db.bookings.insert_one(dict(doc))
    # cancelled rows do not count towards uniqueness
    await db.bookings.insert_one({**doc, "status": "cancelled"})
