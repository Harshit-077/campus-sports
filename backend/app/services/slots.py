"""The slot grid is *computed* from a facility's weekly hours - slots are never stored.
Only bookings are stored. Pure functions, no database, easy to unit-test."""
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.models.facility import DAYS, OperatingHours, to_minutes


@dataclass(frozen=True)
class Slot:
    start: datetime  # timezone-aware, UTC
    end: datetime


def _local_to_utc(day: date, minutes_after_midnight: int, tz: ZoneInfo) -> datetime:
    local = datetime.combine(
        day, time(minutes_after_midnight // 60, minutes_after_midnight % 60), tzinfo=tz
    )
    return local.astimezone(timezone.utc)


def generate_slots(
    hours: OperatingHours, slot_minutes: int, day: date, tz: ZoneInfo
) -> list[Slot]:
    """Back-to-back slots inside each opening window of the given *local* date.
    A leftover shorter than one slot at the end of a window is dropped."""
    slots: list[Slot] = []
    for window in getattr(hours, DAYS[day.weekday()]):
        cursor = to_minutes(window.open)
        close = to_minutes(window.close)
        while cursor + slot_minutes <= close:
            slots.append(
                Slot(
                    _local_to_utc(day, cursor, tz),
                    _local_to_utc(day, cursor + slot_minutes, tz),
                )
            )
            cursor += slot_minutes
    return slots


def local_day_bounds(day: date, tz: ZoneInfo) -> tuple[datetime, datetime]:
    """[start, end) of a local calendar day, as UTC instants."""
    start = datetime.combine(day, time(0), tzinfo=tz).astimezone(timezone.utc)
    end = datetime.combine(day + timedelta(days=1), time(0), tzinfo=tz).astimezone(timezone.utc)
    return start, end
