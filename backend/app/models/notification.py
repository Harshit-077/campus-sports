from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

NotificationType = Literal["booking_confirmed", "booking_cancelled_by_admin"]


class NotificationOut(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    booking_id: str | None = None
    read: bool
    created_at: datetime

    @classmethod
    def from_doc(cls, doc: dict[str, Any]) -> "NotificationOut":
        return cls(
            id=str(doc["_id"]),
            type=doc["type"],
            title=doc["title"],
            message=doc["message"],
            booking_id=str(doc["booking_id"]) if doc.get("booking_id") else None,
            read=doc["read"],
            created_at=doc["created_at"],
        )
