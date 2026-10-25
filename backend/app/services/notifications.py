"""In-app notifications. Creating one is best-effort: the booking action that triggered it
has already succeeded, so a failure here is logged and never turns into an API error."""
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

logger = logging.getLogger(__name__)


def describe_slot(facility_name: str, start: datetime, end: datetime, tz: ZoneInfo) -> str:
    s, e = start.astimezone(tz), end.astimezone(tz)
    return f"{facility_name} on {s:%a %d %b}, {s:%H:%M}-{e:%H:%M}"


async def notify(
    db: AsyncDatabase,
    *,
    user_id: ObjectId,
    type: str,
    title: str,
    message: str,
    booking_id: ObjectId | None,
    now: datetime,
) -> None:
    try:
        await db.notifications.insert_one(
            {
                "user_id": user_id,
                "type": type,
                "title": title,
                "message": message,
                "booking_id": booking_id,
                "read": False,
                "created_at": now,
            }
        )
    except Exception:
        logger.exception("Could not create notification for user %s", user_id)
