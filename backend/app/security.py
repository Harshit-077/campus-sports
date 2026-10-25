"""Password hashing (Argon2id via pwdlib) and JWT helpers (PyJWT)."""
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.config import Settings

_hasher = PasswordHash.recommended()  # Argon2id with sane defaults


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _hasher.verify(plain, hashed)
    except Exception:  # malformed / unknown hash format -> treat as a failed login
        return False


# Argon2 is deliberately slow (CPU-bound); run it in a worker thread so it never
# blocks the event loop while other requests are being served.
async def ahash_password(plain: str) -> str:
    return await asyncio.to_thread(hash_password, plain)


async def averify_password(plain: str, hashed: str) -> bool:
    return await asyncio.to_thread(verify_password, plain, hashed)


# Verified against when the email is unknown, so "no such user" and "wrong password"
# take about the same time (avoids leaking which emails are registered).
DUMMY_HASH = hash_password("not-a-real-password")


def create_access_token(
    subject: str,
    role: str,
    settings: Settings,
    expires_delta: timedelta | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    lifetime = expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {"sub": subject, "role": role, "iat": now, "exp": now + lifetime}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str, settings: Settings) -> dict[str, Any]:
    """Raises jwt.InvalidTokenError (incl. expiry / bad signature) on any problem."""
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub"]},
    )
