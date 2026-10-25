"""Show which index MongoDB uses for the application's key queries.
Run from backend/:   python -m scripts.explain_queries
Best after `make seed` and `make seed-demo` (more data -> more realistic plans).
"""
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

from pymongo import AsyncMongoClient

from app.config import get_settings


def describe(plan: dict[str, Any]) -> str:
    """Flattens a winning plan into e.g. 'FETCH > IXSCAN(bookings_start)'."""
    parts: list[str] = []
    node: dict[str, Any] | None = plan
    while node:
        stage = node["stage"]
        parts.append(f"{stage}({node['indexName']})" if "indexName" in node else stage)
        node = node.get("inputStage") or (node.get("inputStages") or [None])[0]
    return " > ".join(parts)


async def main() -> None:
    settings = get_settings()
    client = AsyncMongoClient(settings.mongo_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
    db = client[settings.mongo_db_name]
    try:
        booking = await db.bookings.find_one({"status": "confirmed"})
        facility = await db.facilities.find_one({"metadata.surface": {"$exists": True}})
        if booking is None or facility is None:
            raise SystemExit("Need data first: run `make seed` and `make seed-demo`.")

        now = datetime.now(timezone.utc)
        day_lo = booking["start"].replace(hour=0, minute=0, second=0, microsecond=0)
        queries = {
            "Availability: confirmed bookings of one facility on one day": (
                db.bookings,
                {"facility_id": booking["facility_id"], "status": "confirmed",
                 "start": {"$gte": day_lo, "$lt": day_lo + timedelta(days=1)}},
            ),
            "My upcoming bookings": (
                db.bookings,
                {"user_id": booking["user_id"], "status": "confirmed", "end": {"$gt": now}},
            ),
            "Analytics: confirmed bookings in a date range": (
                db.bookings,
                {"status": "confirmed", "start": {"$gte": now - timedelta(days=30), "$lt": now}},
            ),
            "Admin / summary: any bookings in a date range": (
                db.bookings,
                {"start": {"$gte": now - timedelta(days=30), "$lt": now}},
            ),
            "Browse a sport's facilities (hide inactive)": (
                db.facilities,
                {"sport_id": facility["sport_id"], "status": {"$ne": "inactive"}},
            ),
            "Filter facilities by a sport-specific attribute": (
                db.facilities,
                {"metadata.surface": facility["metadata"]["surface"]},
            ),
        }
        width = max(len(name) for name in queries)
        for name, (collection, flt) in queries.items():
            explained = await collection.find(flt).explain()
            plan = explained["queryPlanner"]["winningPlan"]
            print(f"{name:<{width}}  {describe(plan)}")
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
