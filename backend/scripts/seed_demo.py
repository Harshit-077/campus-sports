"""Fill the database with realistic DEMO bookings so dashboards and analytics have data.
Run from backend/ (after `make seed`):   python -m scripts.seed_demo

Development only: creates demo students (demo.studentN@campus.edu, password below) and random
bookings over the past ~6 weeks and the next week. Busy sports and evening hours are weighted
up so charts look realistic. Re-running replaces the demo students' bookings (same random seed).
Refuses to run when ENVIRONMENT=production.
"""
import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import DuplicateKeyError

from app.config import Settings, get_settings
from app.indexes import ensure_indexes
from app.models.facility import OperatingHours
from app.security import hash_password
from app.services.slots import generate_slots

DEMO_PASSWORD = "demo-password-123"
SPORT_WEIGHT = {"Badminton": 5, "Football": 3, "Basketball": 3, "Swimming": 2}


def _hour_weight(hour: int) -> int:
    if 17 <= hour <= 20:
        return 8  # evening peak
    if 7 <= hour <= 9:
        return 4  # morning peak
    return 1


async def seed_demo(
    db: AsyncDatabase,
    settings: Settings,
    now: datetime,
    *,
    students: int = 30,
    days_back: int = 42,
    days_ahead: int = 7,
    per_day: int = 14,
    seed: int = 42,
) -> dict[str, int]:
    rng = random.Random(seed)
    await ensure_indexes(db)
    tz = settings.tz

    password_hash = hash_password(DEMO_PASSWORD)  # one hash shared by all demo students
    user_ids = []
    for n in range(1, students + 1):
        email = f"demo.student{n}@campus.edu"
        doc = await db.users.find_one({"email": email})
        if doc is None:
            inserted = await db.users.insert_one(
                {
                    "name": f"Demo Student {n}",
                    "email": email,
                    "password_hash": password_hash,
                    "role": "student",
                    "student_id": f"DEMO{n:04d}",
                    "is_active": True,
                    "created_at": now - timedelta(days=days_back + 7),
                }
            )
            user_ids.append(inserted.inserted_id)
        else:
            user_ids.append(doc["_id"])

    await db.bookings.delete_many({"user_id": {"$in": user_ids}})  # idempotent re-runs

    facilities = await (
        await db.facilities.aggregate(
            [
                {"$match": {"status": "active"}},
                {"$lookup": {"from": "sports", "localField": "sport_id", "foreignField": "_id", "as": "sport"}},
                {"$unwind": "$sport"},
            ]
        )
    ).to_list(length=500)
    if not facilities:
        raise SystemExit("No facilities found. Run `make seed` first.")
    facility_weights = [SPORT_WEIGHT.get(f["sport"]["name"], 1) for f in facilities]

    today = now.astimezone(tz).date()
    created = cancelled = 0
    for offset in range(-days_back, days_ahead + 1):
        day = today + timedelta(days=offset)
        quota = rng.randint(per_day // 2, per_day)
        if day.weekday() >= 5:
            quota //= 2
        for _ in range(quota):
            facility = rng.choices(facilities, weights=facility_weights)[0]
            slots = generate_slots(
                OperatingHours(**facility["operating_hours"]), facility["slot_minutes"], day, tz
            )
            if not slots:
                continue
            slot = rng.choices(
                slots, weights=[_hour_weight(s.start.astimezone(tz).hour) for s in slots]
            )[0]

            is_cancelled = rng.random() < (0.12 if slot.start < now else 0.08)
            booked_at = slot.start - timedelta(days=rng.randint(1, 6), hours=rng.randint(0, 5))
            doc = {
                "user_id": rng.choice(user_ids),
                "facility_id": facility["_id"],
                "sport_id": facility["sport_id"],
                "start": slot.start,
                "end": slot.end,
                "status": "cancelled" if is_cancelled else "confirmed",
                "created_at": booked_at,
                "updated_at": booked_at,
                "cancelled_at": None,
                "cancelled_by": None,
                "cancel_reason": None,
            }
            if is_cancelled:
                doc["cancelled_at"] = booked_at + timedelta(hours=rng.randint(1, 30))
                doc["cancelled_by"] = rng.choice(["student", "student", "student", "admin"])
                doc["updated_at"] = doc["cancelled_at"]
            try:
                await db.bookings.insert_one(doc)
            except DuplicateKeyError:
                continue  # that slot is already taken by another demo booking
            created += 1
            cancelled += is_cancelled
    return {"students": len(user_ids), "bookings": created, "cancelled": cancelled}


async def main() -> None:
    settings = get_settings()
    if settings.environment == "production":
        sys.exit("Refusing to seed demo data when ENVIRONMENT=production.")
    client = AsyncMongoClient(settings.mongo_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
    try:
        result = await seed_demo(client[settings.mongo_db_name], settings, datetime.now(timezone.utc))
    finally:
        await client.close()
    print(
        f"Demo data in '{settings.mongo_db_name}': {result['students']} students, "
        f"{result['bookings']} bookings ({result['cancelled']} cancelled).\n"
        f"Demo students log in as demo.student1@campus.edu ... with password '{DEMO_PASSWORD}'."
    )


if __name__ == "__main__":
    asyncio.run(main())
