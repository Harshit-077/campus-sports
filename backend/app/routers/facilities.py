import re
from datetime import datetime, timezone
from typing import Annotated, Any

from bson import ObjectId
from fastapi import APIRouter, Query, Request
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.deps import AdminUser, Database, Now, OptionalUser, SettingsDep
from app.errors import AppError
from app.ids import parse_object_id
from app.models.facility import (
    FacilityCreate,
    FacilityOut,
    FacilityUpdate,
    OperatingHours,
    days_with_too_short_windows,
)
from app.models.sport import AttributeDef
from app.services.facilities import attach_availability, load_facility, query_facilities
from app.services.metadata import coerce_filter_value, validate_metadata

router = APIRouter(prefix="/facilities", tags=["facilities"])


def _attributes(sport_doc: dict[str, Any]) -> list[AttributeDef]:
    return [AttributeDef(**a) for a in sport_doc.get("attributes", [])]


async def _sport_or_422(db: Database, sport_id: str) -> dict[str, Any]:
    doc = None
    if ObjectId.is_valid(sport_id):
        doc = await db.sports.find_one({"_id": ObjectId(sport_id)})
    if doc is None:
        raise AppError(
            422, "SPORT_NOT_FOUND", "The selected sport does not exist",
            details=[{"field": "sport_id", "message": "sport does not exist"}],
        )
    return doc


def _check_hours_fit(hours: OperatingHours, slot_minutes: int) -> None:
    bad_days = days_with_too_short_windows(hours, slot_minutes)
    if bad_days:
        raise AppError(
            422, "INVALID_HOURS", "An opening window is shorter than one slot",
            details=[
                {"field": f"operating_hours.{day}", "message": f"window shorter than {slot_minutes} min"}
                for day in bad_days
            ],
        )


def _facility_exists_error() -> AppError:
    return AppError(409, "FACILITY_EXISTS", "This sport already has a facility with that name")


@router.get("", response_model=list[FacilityOut])
async def list_facilities(
    request: Request,
    db: Database,
    user: OptionalUser,
    settings: SettingsDep,
    now: Now,
    sport_id: str | None = None,
    q: Annotated[str | None, Query(max_length=50)] = None,
    include_inactive: bool = False,
    with_availability: bool = False,
) -> list[FacilityOut]:
    """Public list of facilities, each with its sport joined in.

    Filters: `sport_id`, `q` (case-insensitive match on name or location), and
    `meta.<attribute>=<value>` for any attribute the sport defines (requires `sport_id`),
    e.g. `?sport_id=...&meta.surface=wooden&meta.air_conditioning=true`.
    `include_inactive=true` is admin-only.
    `with_availability=true` adds today's open-slot count and next free slot to each active facility.
    """
    match: dict[str, Any] = {}

    if include_inactive:
        if user is None:
            raise AppError(401, "UNAUTHORIZED", "Authentication required",
                           {"WWW-Authenticate": "Bearer"})
        if user.role != "admin":
            raise AppError(403, "FORBIDDEN", "Only admins can list inactive facilities")
    else:
        match["status"] = {"$ne": "inactive"}

    meta_filters = {
        key.removeprefix("meta."): value
        for key, value in request.query_params.multi_items()
        if key.startswith("meta.")
    }

    if sport_id is not None:
        sport_oid = parse_object_id(sport_id, "Sport")
        match["sport_id"] = sport_oid
        if meta_filters:
            sport = await db.sports.find_one({"_id": sport_oid})
            if sport is None:
                raise AppError(404, "NOT_FOUND", "Sport not found")
            by_key = {a.key: a for a in _attributes(sport)}
            problems = []
            for key, raw in meta_filters.items():
                attr = by_key.get(key)
                if attr is None:
                    problems.append({"field": f"meta.{key}", "message": "unknown attribute"})
                    continue
                try:
                    match[f"metadata.{key}"] = coerce_filter_value(attr, raw)
                except ValueError as exc:
                    problems.append({"field": f"meta.{key}", "message": str(exc)})
            if problems:
                raise AppError(422, "INVALID_FILTER", "Invalid metadata filter", details=problems)
    elif meta_filters:
        raise AppError(422, "INVALID_FILTER", "meta.* filters require sport_id")

    if q:
        pattern = {"$regex": re.escape(q.strip()), "$options": "i"}
        match["$or"] = [{"name": pattern}, {"location": pattern}]

    facilities = await query_facilities(db, match)
    if with_availability:
        await attach_availability(db, facilities, now, settings.tz)
    return facilities


@router.get("/{facility_id}", response_model=FacilityOut)
async def get_facility(facility_id: str, db: Database) -> FacilityOut:
    facility = await load_facility(db, parse_object_id(facility_id, "Facility"))
    if facility is None:
        raise AppError(404, "NOT_FOUND", "Facility not found")
    return facility


@router.post("", response_model=FacilityOut, status_code=201)
async def create_facility(body: FacilityCreate, _admin: AdminUser, db: Database) -> FacilityOut:
    sport = await _sport_or_422(db, body.sport_id)
    metadata = validate_metadata(_attributes(sport), body.metadata)
    _check_hours_fit(body.operating_hours, body.slot_minutes)

    now = datetime.now(timezone.utc)
    doc = {
        "name": body.name,
        "sport_id": sport["_id"],
        "location": body.location,
        "slot_minutes": body.slot_minutes,
        "operating_hours": body.operating_hours.model_dump(),
        "status": body.status,
        "metadata": metadata,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db.facilities.insert_one(doc)
    except DuplicateKeyError:
        raise _facility_exists_error() from None

    created = await load_facility(db, result.inserted_id)
    assert created is not None
    return created


@router.patch("/{facility_id}", response_model=FacilityOut)
async def update_facility(
    facility_id: str, body: FacilityUpdate, _admin: AdminUser, db: Database
) -> FacilityOut:
    oid = parse_object_id(facility_id, "Facility")
    existing = await db.facilities.find_one({"_id": oid})
    if existing is None:
        raise AppError(404, "NOT_FOUND", "Facility not found")

    changes = body.model_dump(exclude_unset=True)
    null_fields = [k for k, v in changes.items() if v is None]
    if null_fields:
        raise AppError(
            422, "VALIDATION_ERROR", "Fields cannot be null",
            details=[{"field": f"body.{k}", "message": "cannot be null"} for k in null_fields],
        )
    if not changes:
        current = await load_facility(db, oid)
        assert current is not None
        return current

    # Re-validate against the sport's schema only when metadata or sport actually changes
    # (so editing an unrelated field never fails because the sport's schema evolved).
    if "sport_id" in changes or "metadata" in changes:
        sport = await _sport_or_422(db, changes.get("sport_id", str(existing["sport_id"])))
        metadata_in = changes.get("metadata", existing.get("metadata", {}))
        changes["metadata"] = validate_metadata(_attributes(sport), metadata_in)
        changes["sport_id"] = sport["_id"]

    if "operating_hours" in changes or "slot_minutes" in changes:
        hours = OperatingHours(**changes.get("operating_hours", existing["operating_hours"]))
        _check_hours_fit(hours, changes.get("slot_minutes", existing["slot_minutes"]))
        if "operating_hours" in changes:
            changes["operating_hours"] = hours.model_dump()

    changes["updated_at"] = datetime.now(timezone.utc)
    try:
        await db.facilities.find_one_and_update(
            {"_id": oid}, {"$set": changes}, return_document=ReturnDocument.AFTER
        )
    except DuplicateKeyError:
        raise _facility_exists_error() from None

    updated = await load_facility(db, oid)
    assert updated is not None
    return updated
