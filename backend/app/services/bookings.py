"""Shared booking queries. Facility and sport (and, for admins, the user) are joined in with
$lookup so a list of N bookings costs one round-trip instead of 1 + 2N."""
from datetime import datetime
from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings
from app.models.booking import BookingOut


def _join(collection: str, local: str, alias: str) -> list[dict[str, Any]]:
    return [
        {"$lookup": {"from": collection, "localField": local, "foreignField": "_id", "as": alias}},
        {"$unwind": f"${alias}"},
    ]


def booking_pipeline(
    match: dict[str, Any],
    sort: dict[str, int],
    skip: int = 0,
    limit: int = 50,
    with_user: bool = False,
) -> list[dict[str, Any]]:
    stages: list[dict[str, Any]] = [
        {"$match": match},
        {"$sort": {**sort, "_id": 1}},  # _id as tie-breaker keeps paging stable
        {"$skip": skip},
        {"$limit": limit},
        *_join("facilities", "facility_id", "facility"),
        *_join("sports", "sport_id", "sport"),
    ]
    if with_user:
        stages += _join("users", "user_id", "user")
    return stages


async def query_bookings(
    db: AsyncDatabase,
    match: dict[str, Any],
    *,
    sort: dict[str, int],
    settings: Settings,
    now: datetime,
    skip: int = 0,
    limit: int = 50,
) -> list[BookingOut]:
    cursor = await db.bookings.aggregate(booking_pipeline(match, sort, skip, limit))
    docs = await cursor.to_list(length=limit)
    return [
        BookingOut.from_doc(d, now=now, cutoff_minutes=settings.cancellation_cutoff_minutes)
        for d in docs
    ]


async def load_booking(
    db: AsyncDatabase,
    match: dict[str, Any],
    *,
    settings: Settings,
    now: datetime,
) -> BookingOut | None:
    items = await query_bookings(db, match, sort={"start": 1}, settings=settings, now=now, limit=1)
    return items[0] if items else None
