from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.errors import DuplicateKeyError

from app.deps import CurrentUser, Database, SettingsDep
from app.errors import AppError
from app.models.user import RegisterRequest, TokenResponse, User, normalize_email
from app.security import (
    DUMMY_HASH,
    ahash_password,
    averify_password,
    create_access_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: Database) -> User:
    doc = {
        "name": body.name,
        "email": body.email,
        "password_hash": await ahash_password(body.password),
        "role": "student",  # public registration can only ever create students
        "student_id": body.student_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await db.users.insert_one(doc)
    except DuplicateKeyError:
        # Race-safe: the unique index decides, not a find-then-insert check.
        raise AppError(409, "EMAIL_TAKEN", "An account with this email already exists") from None
    doc["_id"] = result.inserted_id
    return User.from_doc(doc)


@router.post("/login", response_model=TokenResponse)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Database,
    settings: SettingsDep,
) -> TokenResponse:
    """OAuth2 password flow (form fields). `username` is the account's email."""
    doc = await db.users.find_one({"email": normalize_email(form.username)})

    # Always run one Argon2 verification, even for unknown emails (timing).
    password_ok = await averify_password(form.password, doc["password_hash"] if doc else DUMMY_HASH)
    if doc is None or not password_ok:
        raise AppError(
            401,
            "INVALID_CREDENTIALS",
            "Incorrect email or password",
            {"WWW-Authenticate": "Bearer"},
        )
    if not doc.get("is_active", True):
        raise AppError(403, "ACCOUNT_DISABLED", "This account has been disabled")

    token = create_access_token(str(doc["_id"]), doc["role"], settings)
    return TokenResponse(access_token=token, user=User.from_doc(doc))


@router.get("/me", response_model=User)
async def me(current_user: CurrentUser) -> User:
    return current_user
