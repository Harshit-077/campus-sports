"""Create an admin account.  Run from backend/:   python -m scripts.create_admin

Admins cannot be created through the public API on purpose.
"""
import asyncio
import getpass
import sys
from datetime import datetime, timezone

from pydantic import EmailStr, TypeAdapter, ValidationError
from pymongo import AsyncMongoClient
from pymongo.errors import DuplicateKeyError

from app.config import get_settings
from app.indexes import ensure_indexes
from app.models.user import normalize_email
from app.security import hash_password


async def create_admin(name: str, email: str, password: str) -> None:
    settings = get_settings()
    client = AsyncMongoClient(settings.mongo_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
    try:
        db = client[settings.mongo_db_name]
        await ensure_indexes(db)
        await db.users.insert_one(
            {
                "name": name,
                "email": email,
                "password_hash": hash_password(password),
                "role": "admin",
                "student_id": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
            }
        )
    finally:
        await client.close()


def main() -> None:
    name = input("Name: ").strip()
    raw_email = input("Email: ")
    try:
        email = normalize_email(TypeAdapter(EmailStr).validate_python(raw_email.strip()))
    except ValidationError:
        sys.exit("That is not a valid email address.")

    password = getpass.getpass("Password (min 8 chars): ")
    if len(password) < 8:
        sys.exit("Password must be at least 8 characters.")
    if password != getpass.getpass("Repeat password: "):
        sys.exit("Passwords do not match.")
    if not name:
        sys.exit("Name is required.")

    try:
        asyncio.run(create_admin(name, email, password))
    except DuplicateKeyError:
        sys.exit(f"A user with email {email} already exists.")
    print(f"Admin created: {email}")


if __name__ == "__main__":
    main()
