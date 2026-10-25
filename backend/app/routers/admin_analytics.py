import datetime as dt
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from app.deps import Database, Now, SettingsDep, admin_required
from app.models.analytics import (
    CancellationStats,
    FacilityCount,
    FacilityUtilization,
    HourCount,
    PeriodCount,
    Ranged,
    SportCount,
    Summary,
)
from app.services import analytics as svc

router = APIRouter(
    prefix="/admin/analytics", tags=["admin: analytics"], dependencies=[Depends(admin_required)]
)


async def get_range(
    settings: SettingsDep,
    now: Now,
    date_from: dt.date | None = None,
    date_to: dt.date | None = None,
) -> svc.DateRange:
    """Inclusive campus-local dates. Defaults: the last 30 days ending today (max 366 days)."""
    today = now.astimezone(settings.tz).date()
    return svc.resolve_range(date_from, date_to, today, settings.tz, settings.campus_timezone)


Range = Annotated[svc.DateRange, Depends(get_range)]


@router.get("/summary", response_model=Summary)
async def summary(db: Database, settings: SettingsDep, now: Now, r: Range) -> Summary:
    """The dashboard cards: totals, cancellation rate, top sport, peak hour, facilities, today."""
    return await svc.summary(db, r, now, settings.tz)


@router.get("/popular-sports", response_model=Ranged[SportCount])
async def popular_sports(db: Database, r: Range) -> Ranged[SportCount]:
    return Ranged(range=r.out(), items=await svc.popular_sports(db, r))


@router.get("/busiest-facilities", response_model=Ranged[FacilityCount])
async def busiest_facilities(
    db: Database, r: Range, limit: Annotated[int, Query(ge=1, le=50)] = 5
) -> Ranged[FacilityCount]:
    return Ranged(range=r.out(), items=await svc.busiest_facilities(db, r, limit))


@router.get("/peak-hours", response_model=Ranged[HourCount])
async def peak_hours(db: Database, r: Range) -> Ranged[HourCount]:
    return Ranged(range=r.out(), items=await svc.peak_hours(db, r))


@router.get("/bookings-over-time", response_model=Ranged[PeriodCount])
async def bookings_over_time(
    db: Database, r: Range, granularity: Literal["day", "week", "month"] = "day"
) -> Ranged[PeriodCount]:
    return Ranged(range=r.out(), items=await svc.bookings_over_time(db, r, granularity))


@router.get("/cancellations", response_model=CancellationStats)
async def cancellations(db: Database, r: Range) -> CancellationStats:
    return await svc.cancellation_stats(db, r)


@router.get("/utilization", response_model=Ranged[FacilityUtilization])
async def utilization(
    db: Database, settings: SettingsDep, now: Now, r: Range
) -> Ranged[FacilityUtilization]:
    return Ranged(range=r.out(), items=await svc.facility_utilization(db, r, now, settings.tz))
