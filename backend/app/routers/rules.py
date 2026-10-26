from fastapi import APIRouter
from pydantic import BaseModel

from app.deps import SettingsDep

router = APIRouter(tags=["rules"])


class Rules(BaseModel):
    booking_window_days: int
    cancellation_cutoff_minutes: int
    max_active_bookings: int
    campus_timezone: str


@router.get("/rules", response_model=Rules)
async def get_rules(settings: SettingsDep) -> Rules:
    """The booking rules in force, so the UI shows the real numbers instead of hard-coding them."""
    return Rules(
        booking_window_days=settings.booking_window_days,
        cancellation_cutoff_minutes=settings.cancellation_cutoff_minutes,
        max_active_bookings=settings.max_active_bookings,
        campus_timezone=settings.campus_timezone,
    )
