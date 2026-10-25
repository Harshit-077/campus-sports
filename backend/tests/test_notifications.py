from tests.helpers import TUE, at, book, cancel, make_student

N = "/api/v1/notifications"


async def test_booking_confirmation_creates_a_notification(client, facility, student_headers):
    await book(client, student_headers, facility, at(TUE, "10:00"))

    items = (await client.get(f"{N}/me", headers=student_headers)).json()
    assert len(items) == 1
    note = items[0]
    assert note["type"] == "booking_confirmed" and note["read"] is False
    assert note["message"] == "Badminton Court 1 on Tue 03 Nov, 10:00-11:00"
    assert note["booking_id"]

    count = await client.get(f"{N}/me/unread-count", headers=student_headers)
    assert count.json() == {"count": 1}

    read = await client.post(f"{N}/{note['id']}/read", headers=student_headers)
    assert read.status_code == 200 and read.json()["read"] is True
    assert (await client.get(f"{N}/me/unread-count", headers=student_headers)).json() == {"count": 0}


async def test_admin_cancellation_notifies_the_student_but_self_cancel_does_not(
    client, admin_headers, facility, student_headers
):
    mine = (await book(client, student_headers, facility, at(TUE, "10:00"))).json()
    other = (await book(client, student_headers, facility, at(TUE, "12:00"))).json()

    await cancel(client, student_headers, other["id"])  # their own cancel: no notification
    assert len((await client.get(f"{N}/me", headers=student_headers)).json()) == 2  # 2 confirmations

    await cancel(client, admin_headers, mine["id"], reason="court flooded")
    items = (await client.get(f"{N}/me", headers=student_headers)).json()
    assert len(items) == 3
    newest = items[0]  # newest first
    assert newest["type"] == "booking_cancelled_by_admin"
    assert "Reason: court flooded." in newest["message"]
    assert len((await client.get(f"{N}/me", params={"unread_only": "true"},
                                 headers=student_headers)).json()) == 3


async def test_mark_all_read(client, facility, student_headers):
    await book(client, student_headers, facility, at(TUE, "10:00"))
    await book(client, student_headers, facility, at(TUE, "11:00"))
    resp = await client.post(f"{N}/read-all", headers=student_headers)
    assert resp.json() == {"updated": 2}
    assert (await client.get(f"{N}/me/unread-count", headers=student_headers)).json() == {"count": 0}


async def test_notifications_are_private(client, facility, student_headers):
    other = await make_student(client, 2)
    await book(client, student_headers, facility, at(TUE, "10:00"))
    note_id = (await client.get(f"{N}/me", headers=student_headers)).json()[0]["id"]

    assert (await client.get(f"{N}/me", headers=other)).json() == []
    assert (await client.post(f"{N}/{note_id}/read", headers=other)).status_code == 404
    assert (await client.post(f"{N}/not-an-id/read", headers=other)).status_code == 404


async def test_notifications_require_login(client):
    assert (await client.get(f"{N}/me")).status_code == 401
    assert (await client.get(f"{N}/me/unread-count")).status_code == 401
    assert (await client.post(f"{N}/read-all")).status_code == 401


async def test_notifications_expire_via_a_ttl_index(db):
    info = await db.notifications.index_information()
    assert info["notifications_ttl"]["expireAfterSeconds"] == 60 * 24 * 60 * 60
