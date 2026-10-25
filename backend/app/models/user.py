from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator

Role = Literal["student", "admin"]


def normalize_email(value: str) -> str:
    return value.strip().lower()


class RegisterRequest(BaseModel):
    # Note: there is deliberately no `role` field. Public registration always creates
    # a student; any extra "role" in the JSON body is ignored. Admins are created
    # with scripts/create_admin.py.
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    student_id: (
        Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=32)] | None
    ) = None

    @field_validator("email")
    @classmethod
    def _lowercase_email(cls, value: str) -> str:
        return normalize_email(value)


class User(BaseModel):
    """Public view of a user. Never contains the password hash."""

    id: str
    name: str
    email: str
    role: Role
    student_id: str | None = None
    is_active: bool = True
    created_at: datetime

    @classmethod
    def from_doc(cls, doc: dict[str, Any]) -> "User":
        return cls(
            id=str(doc["_id"]),
            name=doc["name"],
            email=doc["email"],
            role=doc["role"],
            student_id=doc.get("student_id"),
            is_active=doc.get("is_active", True),
            created_at=doc["created_at"],
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: User
