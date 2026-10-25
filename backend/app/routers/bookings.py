from datetime import timedelta, timezone
from typing import Annotated, Literal

from bson import ObjectId
from fastapi import APIRouter, Query
from pymongo.errors import DuplicateKeyError

from app.deps import CurrentUser, Database, Now, SettingsDep, StudentUser
from app.errors import AppError
from app.ids import parse_object_id
from app.models.booking import BookingCreate, BookingOut, CancelRequest
from app.models.facility import OperatingHours
from app.services.bookings import load_booking, query_bookings
from app.services.notifications import describe_slot, notify
from app.services.slots import generate_slots

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=201)
async def create_booking(
    body: BookingCreate, user: StudentUser, db: Database, settings: SettingsDep, now: Now
) -> BookingOut:
    facility_oid = parse_object_id(body.facility_id, "Facility")
    facility = await db.facilities.find_one({"_id": facility_oid})
    if facility is None or facility["status"] == "inactive":
        raise AppError(404, "NOT_FOUND", "Facility not found")
    if facility["status"] != "active":
        raise AppError(409, "FACILITY_UNAVAILABLE", "This facility is currently under maintenance")

    start = body.start.astimezone(timezone.utc)
    local_day = start.astimezone(settings.tz).date()
    today = now.astimezone(settings.tz).date()

    if start <= now:
        raise AppError(422, "SLOT_IN_PAST", "That slot has already started")
    if local_day > today + timedelta(days=settings.booking_window_days):
        raise AppError(
            422,
            "OUTSIDE_BOOKING_WINDOW",
            f"Bookings open up to {settings.booking_window_days} days ahead",
        )

    # The start must be exactly one of the facility's computed slots for that local day.
    slots = generate_slots(
        OperatingHours(**facility["operating_hours"]),
        facility["slot_minutes"],
        local_day,
        settings.tz,
    )
    slot = next((s for s in slots if s.start == start), None)
    if slot is None:
        raise AppError(422, "INVALID_SLOT", "That time is not a bookable slot for this facility")

    # Per-student rules. These are check-then-insert, so two truly simultaneous requests
    # from one student could slip past them; they are usability limits, not integrity rules.
    # The integrity rule (no double booking of a slot) is the unique index below.
    user_oid = ObjectId(user.id)
    upcoming = await db.bookings.count_documents(
        {"user_id": user_oid, "status": "confirmed", "end": {"$gt": now}}
    )
    if upcoming >= settings.max_active_bookings:
        raise AppError(
            409,
            "BOOKING_LIMIT_REACHED",
            f"You can hold at most {settings.max_active_bookings} upcoming bookings",
        )
    clash = await db.bookings.find_one(
        {
            "user_id": user_oid,
            "status": "confirmed",
            "start": {"$lt": slot.end},
            "end": {"$gt": slot.start},
        },
        projection={"_id": 1},
    )
    if clash is not None:
        raise AppError(409, "USER_TIME_CLASH", "You already have a booking at that time")

    doc = {
        "user_id": user_oid,
        "facility_id": facility_oid,
        "sport_id": facility["sport_id"],  # snapshot: keeps history/analytics stable if the facility's sport is edited
        "start": slot.start,
        "end": slot.end,
        "status": "confirmed",
        "created_at": now,
        "updated_at": now,
        "cancelled_at": None,
        "cancelled_by": None,
        "cancel_reason": None,
    }
    try:
        result = await db.bookings.insert_one(doc)
    except DuplicateKeyError:
        # The partial unique index decided: someone else holds this slot.
        raise AppError(409, "SLOT_TAKEN", "That slot has just been booked by someone else") from None

    created = await load_booking(db, {"_id": result.inserted_id}, settings=settings, now=now)
    assert created is not None
    await notify(
        db,
        user_id=user_oid,
        type="booking_confirmed",
        title="Booking confirmed",
        message=describe_slot(created.facility.name, created.start, created.end, settings.tz),
        booking_id=result.inserted_id,
        now=now,
    )
    return created


@router.get("/me", response_model=list[BookingOut])
async def my_bookings(
    user: CurrentUser,
    db: Database,
    settings: SettingsDep,
    now: Now,
    scope: Literal["upcoming", "history"] = "upcoming",
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    skip: Annotated[int, Query(ge=0)] = 0,
) -> list[BookingOut]:
    """`upcoming`: confirmed bookings that have not ended (soonest first).
    `history`: cancelled or finished bookings (newest first)."""
    user_oid = ObjectId(user.id)
    if scope == "upcoming":
        match = {"user_id": user_oid, "status": "confirmed", "end": {"$gt": now}}
        sort = {"start": 1}
    else:
        match = {
            "user_id": user_oid,
            "$or": [{"status": "cancelled"}, {"end": {"$lte": now}}],
        }
        sort = {"start": -1}
    return await query_bookings(
        db, match, sort=sort, settings=settings, now=now, skip=skip, limit=limit
    )


@router.get("/{booking_id}", response_model=BookingOut)
async def get_booking(
    booking_id: str, user: CurrentUser, db: Database, settings: SettingsDep, now: Now
) -> BookingOut:
    match: dict = {"_id": parse_object_id(booking_id, "Booking")}
    if user.role != "admin":
        match["user_id"] = ObjectId(user.id)  # someone else's booking looks like "not found"
    booking = await load_booking(db, match, settings=settings, now=now)
    if booking is None:
        raise AppError(404, "NOT_FOUND", "Booking not found")
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: str,
    user: CurrentUser,
    db: Database,
    settings: SettingsDep,
    now: Now,
    body: CancelRequest | None = None,
) -> BookingOut:
    """Cancels a booking. Students can cancel their own bookings until the cut-off before the
    start; admins can cancel any booking that has not ended.

    The whole decision is ONE conditional update (status must still be "confirmed", plus the
    owner/cut-off conditions). So two simultaneous cancels cannot both succeed, and a stale
    request can never touch a slot that has since been re-booked - cancelling just flips this
    booking's status, and the partial unique index frees the slot automatically.
    """
    oid = parse_object_id(booking_id, "Booking")
    is_admin = user.role == "admin"

    condition: dict = {"_id": oid, "status": "confirmed", "end": {"$gt": now}}
    if not is_admin:
        condition["user_id"] = ObjectId(user.id)
        condition["start"] = {"$gt": now + timedelta(minutes=settings.cancellation_cutoff_minutes)}

    updated = await db.bookings.find_one_and_update(
        condition,
        {
            "$set": {
                "status": "cancelled",
                "cancelled_at": now,
                "cancelled_by": "admin" if is_admin else "student",
                "cancel_reason": body.reason if body else None,
                "updated_at": now,
            }
        },
        projection={"_id": 1},
    )

    if updated is None:
        # Nothing matched. Read-only diagnosis of why, for a precise error.
        doc = await db.bookings.find_one({"_id": oid})
        if doc is None or (not is_admin and doc["user_id"] != ObjectId(user.id)):
            raise AppError(404, "NOT_FOUND", "Booking not found")
        if doc["status"] != "confirmed":
            raise AppError(409, "ALREADY_CANCELLED", "This booking is already cancelled")
        if doc["end"] <= now:
            raise AppError(409, "BOOKING_ENDED", "This booking has already ended")
        raise AppError(
            409,
            "CANCELLATION_CLOSED",
            f"Bookings can only be cancelled until {settings.cancellation_cutoff_minutes} "
            "minutes before they start",
        )

    result = await load_booking(db, {"_id": oid}, settings=settings, now=now)
    assert result is not None
    if is_admin and result.user_id != user.id:  # tell the student their booking was cancelled
        what = describe_slot(result.facility.name, result.start, result.end, settings.tz)
        reason = f" Reason: {result.cancel_reason}." if result.cancel_reason else ""
        await notify(
            db,
            user_id=ObjectId(result.user_id),
            type="booking_cancelled_by_admin",
            title="Booking cancelled by an administrator",
            message=f"{what}.{reason}",
            booking_id=oid,
            now=now,
        )
    return result
