import datetime as dt
import re
from typing import Annotated, Any

from bson import ObjectId
from fastapi import APIRouter, Depends, Query

from app.deps import Database, Now, SettingsDep, admin_required
from app.errors import AppError
from app.models.admin import AdminBookingOut, BookingPage
from app.models.booking import BookingStatus
from app.services.bookings import booking_pipeline
from app.services.slots import local_day_bounds

router = APIRouter(
    prefix="/admin/bookings", tags=["admin: bookings"], dependencies=[Depends(admin_required)]
)


def _oid(value: str, field: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise AppError(
            422, "INVALID_FILTER", f"{field} is not a valid id",
            details=[{"field": field, "message": "not a valid id"}],
        )
    return ObjectId(value)


@router.get("", response_model=BookingPage)
async def list_all_bookings(
    db: Database,
    settings: SettingsDep,
    now: Now,
    status: BookingStatus | None = None,
    facility_id: str | None = None,
    sport_id: str | None = None,
    user_id: str | None = None,
    q: Annotated[str | None, Query(max_length=60, description="student name or email")] = None,
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    skip: Annotated[int, Query(ge=0)] = 0,
) -> BookingPage:
    """All bookings, newest first, with the student, facility and sport joined in.
    `date_from` / `date_to` are inclusive campus-local dates (filtering on the slot's start)."""
    match: dict[str, Any] = {}
    if status:
        match["status"] = status
    if facility_id:
        match["facility_id"] = _oid(facility_id, "facility_id")
    if sport_id:
        match["sport_id"] = _oid(sport_id, "sport_id")
    if user_id:
        match["user_id"] = _oid(user_id, "user_id")

    if date_from or date_to:
        window: dict[str, Any] = {}
        if date_from:
            window["$gte"] = local_day_bounds(date_from, settings.tz)[0]
        if date_to:
            window["$lt"] = local_day_bounds(date_to, settings.tz)[1]
        match["start"] = window

    if q:
        pattern = {"$regex": re.escape(q.strip()), "$options": "i"}
        cursor = db.users.find({"$or": [{"name": pattern}, {"email": pattern}]}, projection={"_id": 1})
        ids = [u["_id"] for u in await cursor.to_list(length=500)]
        if "user_id" in match:  # also filtering by an explicit user: must satisfy both
            ids = [i for i in ids if i == match["user_id"]]
        match["user_id"] = {"$in": ids}

    total = await db.bookings.count_documents(match)
    cursor = await db.bookings.aggregate(
        booking_pipeline(match, {"start": -1}, skip, limit, with_user=True)
    )
    docs = await cursor.to_list(length=limit)
    items = [
        AdminBookingOut.from_admin_doc(
            d, now=now, cutoff_minutes=settings.cancellation_cutoff_minutes
        )
        for d in docs
    ]
    return BookingPage(items=items, total=total, limit=limit, skip=skip)
