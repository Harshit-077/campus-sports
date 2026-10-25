"""FastAPI dependencies: DB/settings access, current user, role checks."""
from datetime import datetime
from typing import Annotated

import jwt
from bson import ObjectId
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from pymongo.asynchronous.database import AsyncDatabase

from app.config import Settings
from app.errors import AppError
from app.models.user import Role, User
from app.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_settings_dep(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> AsyncDatabase:
    return request.app.state.db


def get_now(request: Request) -> datetime:
    """Current time (UTC). Comes from an injectable clock so tests can control time."""
    return request.app.state.clock()


SettingsDep = Annotated[Settings, Depends(get_settings_dep)]
Now = Annotated[datetime, Depends(get_now)]
Database = Annotated[AsyncDatabase, Depends(get_db)]

_BEARER = {"WWW-Authenticate": "Bearer"}


async def _user_from_token(token: str, db: AsyncDatabase, settings: Settings) -> User:
    """Validates the JWT, then loads the user from the database.

    The role/active flag come from the DB, not from the token, so disabling an account
    or changing a role takes effect immediately instead of when the token expires.
    """
    try:
        payload = decode_access_token(token, settings)
    except jwt.InvalidTokenError:
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token", _BEARER) from None

    subject = payload["sub"]
    if not ObjectId.is_valid(subject):
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token", _BEARER)

    doc = await db.users.find_one({"_id": ObjectId(subject)})
    if doc is None:
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token", _BEARER)

    user = User.from_doc(doc)
    if not user.is_active:
        raise AppError(401, "ACCOUNT_DISABLED", "This account has been disabled", _BEARER)
    return user


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Database,
    settings: SettingsDep,
) -> User:
    return await _user_from_token(token, db, settings)


async def get_optional_user(
    token: Annotated[str | None, Depends(oauth2_scheme_optional)],
    db: Database,
    settings: SettingsDep,
) -> User | None:
    """For public routes that unlock extra options for logged-in users.
    No token -> None; a token that is present but invalid is still a 401."""
    if token is None:
        return None
    return await _user_from_token(token, db, settings)


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


def require_role(*allowed: Role):
    async def _checker(user: CurrentUser) -> User:
        if user.role not in allowed:
            raise AppError(403, "FORBIDDEN", "You do not have permission to do this")
        return user

    return _checker


admin_required = require_role("admin")
AdminUser = Annotated[User, Depends(admin_required)]
StudentUser = Annotated[User, Depends(require_role("student"))]
