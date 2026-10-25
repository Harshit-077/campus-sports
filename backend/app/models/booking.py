from datetime import date, datetime, timedelta
from typing import Annotated, Any, Literal

from pydantic import AwareDatetime, BaseModel, StringConstraints

BookingStatus = Literal["confirmed", "cancelled"]
SlotStatus = Literal["available", "booked", "past", "unavailable"]


class BookingCreate(BaseModel):
    facility_id: str
    # Must carry a UTC offset (e.g. 2026-11-03T10:00:00+05:30 or ...Z); naive times are rejected.
    start: AwareDatetime


class CancelRequest(BaseModel):
    reason: (
        Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)] | None
    ) = None


class FacilityRef(BaseModel):
    id: str
    name: str
    location: str


class SportRef(BaseModel):
    id: str
    name: str


class BookingOut(BaseModel):
    id: str
    status: BookingStatus
    start: datetime
    end: datetime
    user_id: str
    facility: FacilityRef
    sport: SportRef
    created_at: datetime
    cancelled_at: datetime | None = None
    cancelled_by: Literal["student", "admin"] | None = None
    cancel_reason: str | None = None
    # Can the booking's owner still cancel it right now (confirmed + before the cut-off)?
    can_cancel: bool

    @classmethod
    def from_doc(cls, doc: dict[str, Any], *, now: datetime, cutoff_minutes: int) -> "BookingOut":
        """`doc` is an aggregation result with `facility` and `sport` already joined in."""
        facility, sport = doc["facility"], doc["sport"]
        return cls(
            id=str(doc["_id"]),
            status=doc["status"],
            start=doc["start"],
            end=doc["end"],
            user_id=str(doc["user_id"]),
            facility=FacilityRef(
                id=str(facility["_id"]), name=facility["name"], location=facility["location"]
            ),
            sport=SportRef(id=str(sport["_id"]), name=sport["name"]),
            created_at=doc["created_at"],
            cancelled_at=doc.get("cancelled_at"),
            cancelled_by=doc.get("cancelled_by"),
            cancel_reason=doc.get("cancel_reason"),
            can_cancel=(
                doc["status"] == "confirmed"
                and doc["start"] > now + timedelta(minutes=cutoff_minutes)
            ),
        )


class SlotOut(BaseModel):
    start: datetime
    end: datetime
    status: SlotStatus
    booked_by_me: bool = False


class SlotsResponse(BaseModel):
    facility_id: str
    date: date
    timezone: str
    slot_minutes: int
    facility_status: str
    slots: list[SlotOut]
