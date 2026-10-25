from app.models.facility import OperatingHours
from app.services.slots import generate_slots
from scripts.seed_catalog import seed
from scripts.seed_demo import seed_demo


async def test_demo_seed_creates_valid_bookings_and_is_repeatable(db, settings, clock):
    await seed(db)
    first = await seed_demo(db, settings, clock.now, students=8, per_day=6)
    assert first["students"] == 8 and first["bookings"] > 0 and first["cancelled"] > 0
    assert await db.bookings.count_documents({}) == first["bookings"]

    # every booking sits exactly on its facility's slot grid
    facilities = {f["_id"]: f async for f in db.facilities.find({})}
    async for b in db.bookings.find({}):
        f = facilities[b["facility_id"]]
        grid = {
            s.start
            for s in generate_slots(
                OperatingHours(**f["operating_hours"]), f["slot_minutes"],
                b["start"].astimezone(settings.tz).date(), settings.tz,
            )
        }
        assert b["start"] in grid

    # same seed + same clock -> identical result, and no duplicates piled up
    second = await seed_demo(db, settings, clock.now, students=8, per_day=6)
    assert second == first
    assert await db.bookings.count_documents({}) == first["bookings"]
    assert await db.users.count_documents({"email": {"$regex": "^demo\\.student"}}) == 8


async def test_demo_data_feeds_the_analytics(client, admin_headers, db, settings, clock):
    await seed(db)
    await seed_demo(db, settings, clock.now, students=8, per_day=6)
    resp = await client.get("/api/v1/admin/analytics/popular-sports", headers=admin_headers)
    assert resp.status_code == 200 and resp.json()["items"]
