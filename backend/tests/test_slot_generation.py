from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.models.facility import OperatingHours
from app.services.slots import generate_slots, local_day_bounds

IST = ZoneInfo("Asia/Kolkata")
TUESDAY = date(2026, 11, 3)


def hours(**days):
    return OperatingHours(**{d: [{"open": o, "close": c} for o, c in w] for d, w in days.items()})


def test_one_hour_slots_cover_the_window():
    slots = generate_slots(hours(tue=[("06:00", "21:00")]), 60, TUESDAY, IST)
    assert len(slots) == 15
    assert slots[0].start == datetime(2026, 11, 3, 0, 30, tzinfo=timezone.utc)  # 06:00 IST
    assert slots[-1].end == datetime(2026, 11, 3, 15, 30, tzinfo=timezone.utc)  # 21:00 IST


def test_slots_are_back_to_back_and_stored_in_utc():
    slots = generate_slots(hours(tue=[("06:00", "09:00")]), 60, TUESDAY, IST)
    assert [s.end for s in slots[:-1]] == [s.start for s in slots[1:]]
    assert all(s.start.utcoffset().total_seconds() == 0 for s in slots)


def test_leftover_shorter_than_a_slot_is_dropped():
    # 15 hours of opening: 7 two-hour slots fit, the last hour is dropped
    assert len(generate_slots(hours(tue=[("06:00", "21:00")]), 120, TUESDAY, IST)) == 7
    assert len(generate_slots(hours(tue=[("06:00", "21:00")]), 90, TUESDAY, IST)) == 10
    assert len(generate_slots(hours(tue=[("06:00", "21:00")]), 45, TUESDAY, IST)) == 20


def test_closed_day_has_no_slots():
    assert generate_slots(hours(mon=[("06:00", "21:00")]), 60, TUESDAY, IST) == []


def test_multiple_windows_in_a_day():
    two = hours(tue=[("06:00", "12:00"), ("14:00", "18:00")])
    assert len(generate_slots(two, 60, TUESDAY, IST)) == 10


def test_weekday_is_taken_from_the_local_date():
    # Saturday has hours, Tuesday does not
    assert generate_slots(hours(sat=[("08:00", "10:00")]), 60, date(2026, 11, 7), IST)
    assert not generate_slots(hours(sat=[("08:00", "10:00")]), 60, TUESDAY, IST)


def test_local_day_bounds_are_shifted_from_utc_midnight():
    start, end = local_day_bounds(TUESDAY, IST)
    assert start == datetime(2026, 11, 2, 18, 30, tzinfo=timezone.utc)
    assert end == datetime(2026, 11, 3, 18, 30, tzinfo=timezone.utc)
