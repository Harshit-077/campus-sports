"""The point of the whole design: many simultaneous requests, exactly one winner."""
import asyncio
from collections import Counter

from tests.helpers import TUE, at, book, cancel, make_student


async def test_many_students_race_for_one_slot(client, db, facility):
    students = [await make_student(client, n) for n in range(8)]
    start = at(TUE, "10:00")

    responses = await asyncio.gather(*(book(client, h, facility, start) for h in students))

    statuses = Counter(r.status_code for r in responses)
    assert statuses == {201: 1, 409: 7}
    assert {r.json()["error"]["code"] for r in responses if r.status_code == 409} == {"SLOT_TAKEN"}
    assert await db.bookings.count_documents({"status": "confirmed"}) == 1


async def test_one_student_double_clicking_creates_one_booking(client, db, facility,
                                                               student_headers):
    start = at(TUE, "10:00")
    responses = await asyncio.gather(
        *(book(client, student_headers, facility, start) for _ in range(5))
    )
    assert Counter(r.status_code for r in responses) == {201: 1, 409: 4}
    assert await db.bookings.count_documents({"status": "confirmed"}) == 1


async def test_simultaneous_cancels_succeed_once(client, db, facility, student_headers):
    booking = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    responses = await asyncio.gather(
        cancel(client, student_headers, booking["id"]),
        cancel(client, student_headers, booking["id"]),
    )
    assert sorted(r.status_code for r in responses) == [200, 409]
    assert await db.bookings.count_documents({"status": "cancelled"}) == 1


async def test_cancel_and_rebook_race_leaves_exactly_one_holder(client, db, facility,
                                                                student_headers):
    """While A cancels, B and C both try to grab the slot. Whatever the interleaving,
    there is never more than one confirmed booking for the slot."""
    b, c = await make_student(client, 2), await make_student(client, 3)
    first = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    await asyncio.gather(
        cancel(client, student_headers, first["id"]),
        book(client, b, facility, at(TUE, "10:00")),
        book(client, c, facility, at(TUE, "10:00")),
    )
    assert await db.bookings.count_documents({"status": "confirmed"}) <= 1
