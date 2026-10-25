from datetime import date
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class DateRangeOut(BaseModel):
    date_from: date
    date_to: date  # inclusive
    timezone: str


class Ranged(BaseModel, Generic[T]):
    range: DateRangeOut
    items: list[T]


class SportCount(BaseModel):
    sport_id: str
    name: str
    bookings: int
    share: float  # fraction of all confirmed bookings in the range


class FacilityCount(BaseModel):
    facility_id: str
    name: str
    sport_name: str
    bookings: int


class HourCount(BaseModel):
    hour: int  # 0-23, campus-local
    bookings: int


class PeriodCount(BaseModel):
    period: str  # "2026-11-03" (day), "2026-W45" (week), "2026-11" (month)
    bookings: int


class FacilityUtilization(BaseModel):
    facility_id: str
    name: str
    sport_name: str
    booked: int
    capacity: int  # slots that have already started in the range
    utilization: float  # booked / capacity (0 when capacity is 0)


class CancellationStats(BaseModel):
    range: DateRangeOut
    total: int
    confirmed: int
    cancelled: int
    cancellation_rate: float
    cancelled_by_student: int
    cancelled_by_admin: int


class TopSport(BaseModel):
    sport_id: str
    name: str
    bookings: int


class PeakHour(BaseModel):
    hour: int
    bookings: int


class Summary(BaseModel):
    range: DateRangeOut
    total_bookings: int
    confirmed: int
    cancelled: int
    cancellation_rate: float
    unique_students: int
    most_popular_sport: TopSport | None
    peak_hour: PeakHour | None
    # "right now" cards (not tied to the date range)
    active_facilities: int
    total_facilities: int
    todays_bookings: int
    upcoming_bookings: int
