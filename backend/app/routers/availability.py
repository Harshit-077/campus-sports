import datetime as dt
from datetime import timedelta
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Query

from app.deps import Database, Now, OptionalUser, SettingsDep
from app.errors import AppError
from app.ids import parse_object_id
from app.models.booking import SlotOut, SlotsResponse, SlotStatus
from app.models.facility import OperatingHours
from app.services.slots import generate_slots, local_day_bounds

router = APIRouter(prefix="/facilities", tags=["availability"])


@router.get("/{facility_id}/slots", response_model=SlotsResponse)
async def facility_slots(
    facility_id: str,
    day: Annotated[dt.date, Query(alias="date", description="Campus-local date, YYYY-MM-DD")],
    db: Database,
    settings: SettingsDep,
    now: Now,
    user: OptionalUser,
) -> SlotsResponse:
    """The slot grid for one day with each slot's availability.

    Slots are computed from the facility's weekly hours; only bookings are stored.
    `booked_by_me` is true for slots booked by the logged-in user.
    """
    fid = parse_object_id(facility_id, "Facility")
    facility = await db.facilities.find_one({"_id": fid})
    if facility is None or facility["status"] == "inactive":
        raise AppError(404, "NOT_FOUND", "Facility not found")

    today = now.astimezone(settings.tz).date()
    if day < today or day > today + timedelta(days=settings.booking_window_days):
        raise AppError(
            422,
            "DATE_OUT_OF_RANGE",
            f"Date must be between {today} and {today + timedelta(days=settings.booking_window_days)}",
            details=[{"field": "date", "message": "outside the bookable window"}],
        )

    slots = generate_slots(
        OperatingHours(**facility["operating_hours"]), facility["slot_minutes"], day, settings.tz
    )

    lo, hi = local_day_bounds(day, settings.tz)
    cursor = db.bookings.find(
        {"facility_id": fid, "status": "confirmed", "start": {"$gte": lo, "$lt": hi}},
        projection={"start": 1, "user_id": 1},
    )
    booked = {doc["start"]: doc["user_id"] for doc in await cursor.to_list(length=500)}
    me = ObjectId(user.id) if user else None

    under_maintenance = facility["status"] != "active"
    out: list[SlotOut] = []
    for slot in slots:
        owner = booked.get(slot.start)
        status: SlotStatus
        if under_maintenance:
            status = "unavailable"
        elif slot.start <= now:
            status = "past"
        elif owner is not None:
            status = "booked"
        else:
            status = "available"
        out.append(
            SlotOut(
                start=slot.start,
                end=slot.end,
                status=status,
                booked_by_me=owner is not None and owner == me,
            )
        )

    return SlotsResponse(
        facility_id=str(fid),
        date=day,
        timezone=settings.campus_timezone,
        slot_minutes=facility["slot_minutes"],
        facility_status=facility["status"],
        slots=out,
    )
