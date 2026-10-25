from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.booking import BookingOut
from app.models.user import Role, User


class UserRef(BaseModel):
    id: str
    name: str
    email: str
    student_id: str | None = None


class AdminBookingOut(BookingOut):
    """A booking as an admin sees it: includes who made it."""

    user: UserRef

    @classmethod
    def from_admin_doc(
        cls, doc: dict[str, Any], *, now: datetime, cutoff_minutes: int
    ) -> "AdminBookingOut":
        base = BookingOut.from_doc(doc, now=now, cutoff_minutes=cutoff_minutes)
        u = doc["user"]
        return cls(
            **base.model_dump(),
            user=UserRef(
                id=str(u["_id"]), name=u["name"], email=u["email"], student_id=u.get("student_id")
            ),
        )


class BookingPage(BaseModel):
    items: list[AdminBookingOut]
    total: int
    limit: int
    skip: int


class UserPage(BaseModel):
    items: list[User]
    total: int
    limit: int
    skip: int


class UserUpdate(BaseModel):
    is_active: bool | None = None
    role: Role | None = None
    # Only meaningful when deactivating: also cancel the user's upcoming bookings (frees the slots)
    cancel_upcoming_bookings: bool = False


class UserAdminOut(User):
    cancelled_bookings: int = 0
