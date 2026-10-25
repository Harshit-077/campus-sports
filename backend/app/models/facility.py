from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.models.sport import SportSummary

FacilityStatus = Literal["active", "maintenance", "inactive"]
SlotMinutes = Literal[30, 45, 60, 90, 120]
DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Location = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
TimeStr = Annotated[str, StringConstraints(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")]


def to_minutes(hhmm: str) -> int:
    hours, minutes = hhmm.split(":")
    return int(hours) * 60 + int(minutes)


class TimeWindow(BaseModel):
    """Wall-clock opening window in the campus timezone (e.g. 06:00-21:00)."""

    open: TimeStr
    close: TimeStr

    @model_validator(mode="after")
    def _ordered(self) -> "TimeWindow":
        if self.open >= self.close:  # zero-padded HH:MM strings compare correctly
            raise ValueError("open must be earlier than close")
        return self


class OperatingHours(BaseModel):
    """Weekly template. A day with no windows means the facility is closed that day."""

    mon: list[TimeWindow] = Field(default_factory=list, max_length=4)
    tue: list[TimeWindow] = Field(default_factory=list, max_length=4)
    wed: list[TimeWindow] = Field(default_factory=list, max_length=4)
    thu: list[TimeWindow] = Field(default_factory=list, max_length=4)
    fri: list[TimeWindow] = Field(default_factory=list, max_length=4)
    sat: list[TimeWindow] = Field(default_factory=list, max_length=4)
    sun: list[TimeWindow] = Field(default_factory=list, max_length=4)

    @model_validator(mode="after")
    def _sorted_and_non_overlapping(self) -> "OperatingHours":
        for day in DAYS:
            windows = sorted(getattr(self, day), key=lambda w: w.open)
            for earlier, later in zip(windows, windows[1:], strict=False):
                if earlier.close > later.open:
                    raise ValueError(f"{day}: opening windows overlap")
            setattr(self, day, windows)
        return self


def days_with_too_short_windows(hours: OperatingHours, slot_minutes: int) -> list[str]:
    """Days that contain a window shorter than one slot (such a window can never be booked)."""
    bad = []
    for day in DAYS:
        for window in getattr(hours, day):
            if to_minutes(window.close) - to_minutes(window.open) < slot_minutes:
                bad.append(day)
                break
    return bad


class FacilityCreate(BaseModel):
    name: Name
    sport_id: str
    location: Location
    slot_minutes: SlotMinutes = 60
    operating_hours: OperatingHours = Field(default_factory=OperatingHours)
    status: FacilityStatus = "active"
    metadata: dict[str, Any] = Field(default_factory=dict)


class FacilityUpdate(BaseModel):
    """Partial update. `metadata` and `operating_hours`, when sent, replace the whole value."""

    name: Name | None = None
    sport_id: str | None = None
    location: Location | None = None
    slot_minutes: SlotMinutes | None = None
    operating_hours: OperatingHours | None = None
    status: FacilityStatus | None = None
    metadata: dict[str, Any] | None = None


class FacilityOut(BaseModel):
    id: str
    name: str
    sport: SportSummary
    location: str
    slot_minutes: int
    operating_hours: OperatingHours
    status: FacilityStatus
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_doc(cls, doc: dict[str, Any]) -> "FacilityOut":
        """`doc` is an aggregation result with the sport already joined in as `sport`."""
        sport = doc["sport"]
        return cls(
            id=str(doc["_id"]),
            name=doc["name"],
            sport=SportSummary(id=str(sport["_id"]), name=sport["name"], category=sport["category"]),
            location=doc["location"],
            slot_minutes=doc["slot_minutes"],
            operating_hours=doc["operating_hours"],
            status=doc["status"],
            metadata=doc.get("metadata", {}),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )
