"""Shared facility queries. Sports are joined in with $lookup so a list of N facilities
costs ONE database round-trip instead of N+1."""
from collections import defaultdict
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from app.models.facility import FacilityAvailability, FacilityOut, SlotWindow
from app.services.slots import generate_slots, local_day_bounds

# numericOrdering makes "Court 2" sort before "Court 10"
LIST_COLLATION = {"locale": "en", "numericOrdering": True}


def facility_pipeline(match: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {"$match": match},
        {"$sort": {"name": 1}},
        {
            "$lookup": {
                "from": "sports",
                "localField": "sport_id",
                "foreignField": "_id",
                "as": "sport",
            }
        },
        {"$unwind": "$sport"},
    ]


async def query_facilities(
    db: AsyncDatabase, match: dict[str, Any], limit: int = 500
) -> list[FacilityOut]:
    cursor = await db.facilities.aggregate(facility_pipeline(match), collation=LIST_COLLATION)
    docs = await cursor.to_list(length=limit)
    return [FacilityOut.from_doc(doc) for doc in docs]


async def load_facility(db: AsyncDatabase, facility_id: ObjectId) -> FacilityOut | None:
    items = await query_facilities(db, {"_id": facility_id}, limit=1)
    return items[0] if items else None


async def attach_availability(
    db: AsyncDatabase, facilities: list[FacilityOut], now: datetime, tz: ZoneInfo
) -> None:
    """Fills `availability` (open slots left today + the next one) for active facilities.

    One query fetches today's confirmed bookings for ALL listed facilities (it uses the
    unique (facility_id, start) index); the slot grids are computed, not stored.
    """
    active = [f for f in facilities if f.status == "active"]
    if not active:
        return
    today = now.astimezone(tz).date()
    lo, hi = local_day_bounds(today, tz)
    cursor = db.bookings.find(
        {
            "facility_id": {"$in": [ObjectId(f.id) for f in active]},
            "status": "confirmed",
            "start": {"$gte": lo, "$lt": hi},
        },
        projection={"facility_id": 1, "start": 1},
    )
    booked: dict[str, set[datetime]] = defaultdict(set)
    for doc in await cursor.to_list(length=5000):
        booked[str(doc["facility_id"])].add(doc["start"])

    for facility in active:
        slots = generate_slots(facility.operating_hours, facility.slot_minutes, today, tz)
        free = [s for s in slots if s.start > now and s.start not in booked[facility.id]]
        facility.availability = FacilityAvailability(
            open_slots_today=len(free),
            next_slot=SlotWindow(start=free[0].start, end=free[0].end) if free else None,
        )
