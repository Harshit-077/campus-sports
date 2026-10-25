"""Admin analytics. Each metric is one MongoDB aggregation pipeline over `bookings`;
the application only does light post-processing (zero-filling, ratios)."""
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from pymongo.asynchronous.database import AsyncDatabase

from app.errors import AppError
from app.models.analytics import (
    CancellationStats,
    DateRangeOut,
    FacilityCount,
    FacilityUtilization,
    HourCount,
    PeakHour,
    PeriodCount,
    SportCount,
    Summary,
    TopSport,
)
from app.models.facility import OperatingHours
from app.services.slots import generate_slots, local_day_bounds

MAX_RANGE_DAYS = 366
DEFAULT_RANGE_DAYS = 30


@dataclass(frozen=True)
class DateRange:
    """Inclusive range of campus-local dates, plus the matching UTC instants [lo, hi)."""

    date_from: date
    date_to: date
    lo: datetime
    hi: datetime
    tz_name: str

    def days(self) -> list[date]:
        count = (self.date_to - self.date_from).days + 1
        return [self.date_from + timedelta(days=i) for i in range(count)]

    def out(self) -> DateRangeOut:
        return DateRangeOut(date_from=self.date_from, date_to=self.date_to, timezone=self.tz_name)


def resolve_range(
    date_from: date | None, date_to: date | None, today: date, tz: ZoneInfo, tz_name: str
) -> DateRange:
    """Defaults to the last 30 days ending today."""
    end = date_to or today
    start = date_from or end - timedelta(days=DEFAULT_RANGE_DAYS - 1)
    if start > end:
        raise AppError(422, "INVALID_RANGE", "date_from must not be after date_to")
    if (end - start).days + 1 > MAX_RANGE_DAYS:
        raise AppError(422, "INVALID_RANGE", f"Range cannot exceed {MAX_RANGE_DAYS} days")
    return DateRange(start, end, local_day_bounds(start, tz)[0], local_day_bounds(end, tz)[1], tz_name)


def _confirmed(r: DateRange, upper: datetime | None = None) -> dict[str, Any]:
    return {"status": "confirmed", "start": {"$gte": r.lo, "$lt": upper or r.hi}}


def _ratio(part: int, whole: int) -> float:
    return round(part / whole, 4) if whole else 0.0


# ----------------------------------------------------------------- popular sports
async def popular_sports(db: AsyncDatabase, r: DateRange) -> list[SportCount]:
    cursor = await db.bookings.aggregate(
        [
            {"$match": _confirmed(r)},
            {"$group": {"_id": "$sport_id", "bookings": {"$sum": 1}}},
            {"$sort": {"bookings": -1, "_id": 1}},
            {"$lookup": {"from": "sports", "localField": "_id", "foreignField": "_id", "as": "sport"}},
            {"$unwind": "$sport"},
        ]
    )
    docs = await cursor.to_list(length=200)
    total = sum(d["bookings"] for d in docs)
    return [
        SportCount(
            sport_id=str(d["_id"]),
            name=d["sport"]["name"],
            bookings=d["bookings"],
            share=_ratio(d["bookings"], total),
        )
        for d in docs
    ]


# -------------------------------------------------------------- busiest facilities
async def busiest_facilities(db: AsyncDatabase, r: DateRange, limit: int) -> list[FacilityCount]:
    cursor = await db.bookings.aggregate(
        [
            {"$match": _confirmed(r)},
            {"$group": {"_id": "$facility_id", "bookings": {"$sum": 1}}},
            {"$sort": {"bookings": -1, "_id": 1}},
            {"$limit": limit},
            {"$lookup": {"from": "facilities", "localField": "_id", "foreignField": "_id", "as": "facility"}},
            {"$unwind": "$facility"},
            {"$lookup": {"from": "sports", "localField": "facility.sport_id", "foreignField": "_id", "as": "sport"}},
            {"$unwind": "$sport"},
        ]
    )
    return [
        FacilityCount(
            facility_id=str(d["_id"]),
            name=d["facility"]["name"],
            sport_name=d["sport"]["name"],
            bookings=d["bookings"],
        )
        for d in await cursor.to_list(length=limit)
    ]


# ------------------------------------------------------------------- peak hours
async def peak_hours(db: AsyncDatabase, r: DateRange) -> list[HourCount]:
    """Bookings per campus-local start hour; all 24 hours are returned (zero-filled)."""
    cursor = await db.bookings.aggregate(
        [
            {"$match": _confirmed(r)},
            {
                "$group": {
                    "_id": {"$hour": {"date": "$start", "timezone": r.tz_name}},
                    "bookings": {"$sum": 1},
                }
            },
        ]
    )
    counts = {d["_id"]: d["bookings"] for d in await cursor.to_list(length=24)}
    return [HourCount(hour=h, bookings=counts.get(h, 0)) for h in range(24)]


def top_hour(hours: list[HourCount]) -> PeakHour | None:
    best = max(hours, key=lambda h: (h.bookings, -h.hour), default=None)  # ties -> earliest hour
    return PeakHour(hour=best.hour, bookings=best.bookings) if best and best.bookings else None


# --------------------------------------------------------------------- over time
_PERIOD_FORMATS = {"day": "%Y-%m-%d", "week": "%G-W%V", "month": "%Y-%m"}


async def bookings_over_time(
    db: AsyncDatabase, r: DateRange, granularity: str
) -> list[PeriodCount]:
    cursor = await db.bookings.aggregate(
        [
            {"$match": _confirmed(r)},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": _PERIOD_FORMATS[granularity],
                            "date": "$start",
                            "timezone": r.tz_name,
                        }
                    },
                    "bookings": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
    )
    counts = {d["_id"]: d["bookings"] for d in await cursor.to_list(length=500)}
    if granularity == "day":  # zero-fill so charts have no gaps
        return [PeriodCount(period=str(d), bookings=counts.get(str(d), 0)) for d in r.days()]
    return [PeriodCount(period=k, bookings=v) for k, v in sorted(counts.items())]


# ----------------------------------------------------------------- cancellations
async def cancellation_stats(db: AsyncDatabase, r: DateRange) -> CancellationStats:
    cursor = await db.bookings.aggregate(
        [
            {"$match": {"start": {"$gte": r.lo, "$lt": r.hi}}},
            {"$group": {"_id": {"status": "$status", "by": "$cancelled_by"}, "n": {"$sum": 1}}},
        ]
    )
    confirmed = cancelled = by_student = by_admin = 0
    for d in await cursor.to_list(length=20):
        status, by, n = d["_id"]["status"], d["_id"].get("by"), d["n"]
        if status == "confirmed":
            confirmed += n
        else:
            cancelled += n
            by_student += n if by == "student" else 0
            by_admin += n if by == "admin" else 0
    total = confirmed + cancelled
    return CancellationStats(
        range=r.out(),
        total=total,
        confirmed=confirmed,
        cancelled=cancelled,
        cancellation_rate=_ratio(cancelled, total),
        cancelled_by_student=by_student,
        cancelled_by_admin=by_admin,
    )


# ------------------------------------------------------------------- utilization
async def facility_utilization(
    db: AsyncDatabase, r: DateRange, now: datetime, tz: ZoneInfo
) -> list[FacilityUtilization]:
    """booked / capacity per facility.

    Booked slots come from an aggregation. Capacity is not stored anywhere: it is derived
    from each facility's weekly hours, counting only slots that have already started
    (so a half-finished day does not drag utilization down).
    """
    upper = min(r.hi, now)
    cursor = await db.bookings.aggregate(
        [
            {"$match": _confirmed(r, upper)},
            {"$group": {"_id": "$facility_id", "booked": {"$sum": 1}}},
        ]
    )
    booked = {d["_id"]: d["booked"] for d in await cursor.to_list(length=1000)}

    cursor = await db.facilities.aggregate(
        [
            {"$match": {"status": {"$ne": "inactive"}}},
            {"$sort": {"name": 1}},
            {"$lookup": {"from": "sports", "localField": "sport_id", "foreignField": "_id", "as": "sport"}},
            {"$unwind": "$sport"},
        ],
        collation={"locale": "en", "numericOrdering": True},
    )
    result = []
    for f in await cursor.to_list(length=1000):
        hours = OperatingHours(**f["operating_hours"])
        capacity = sum(
            1
            for day in r.days()
            for slot in generate_slots(hours, f["slot_minutes"], day, tz)
            if slot.start < upper
        )
        count = booked.get(f["_id"], 0)
        result.append(
            FacilityUtilization(
                facility_id=str(f["_id"]),
                name=f["name"],
                sport_name=f["sport"]["name"],
                booked=count,
                capacity=capacity,
                utilization=_ratio(count, capacity),
            )
        )
    return sorted(result, key=lambda u: (-u.utilization, u.name))


# ---------------------------------------------------------------------- summary
async def summary(
    db: AsyncDatabase, r: DateRange, now: datetime, tz: ZoneInfo
) -> Summary:
    # $facet runs two sub-pipelines over ONE pass of the matched bookings
    cursor = await db.bookings.aggregate(
        [
            {"$match": {"start": {"$gte": r.lo, "$lt": r.hi}}},
            {
                "$facet": {
                    "by_status": [{"$group": {"_id": "$status", "n": {"$sum": 1}}}],
                    "students": [
                        {"$match": {"status": "confirmed"}},
                        {"$group": {"_id": "$user_id"}},
                        {"$count": "n"},
                    ],
                }
            },
        ]
    )
    facet = (await cursor.to_list(length=1))[0]
    by_status = {d["_id"]: d["n"] for d in facet["by_status"]}
    confirmed, cancelled = by_status.get("confirmed", 0), by_status.get("cancelled", 0)
    students = facet["students"][0]["n"] if facet["students"] else 0

    sports = await popular_sports(db, r)
    top_sport = TopSport(sport_id=sports[0].sport_id, name=sports[0].name, bookings=sports[0].bookings) if sports else None

    today_lo, today_hi = local_day_bounds(now.astimezone(tz).date(), tz)
    return Summary(
        range=r.out(),
        total_bookings=confirmed + cancelled,
        confirmed=confirmed,
        cancelled=cancelled,
        cancellation_rate=_ratio(cancelled, confirmed + cancelled),
        unique_students=students,
        most_popular_sport=top_sport,
        peak_hour=top_hour(await peak_hours(db, r)),
        active_facilities=await db.facilities.count_documents({"status": "active"}),
        total_facilities=await db.facilities.count_documents({"status": {"$ne": "inactive"}}),
        todays_bookings=await db.bookings.count_documents(
            {"status": "confirmed", "start": {"$gte": today_lo, "$lt": today_hi}}
        ),
        upcoming_bookings=await db.bookings.count_documents(
            {"status": "confirmed", "end": {"$gt": now}}
        ),
    )
