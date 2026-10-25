"""Seed demo sports and facilities.  Run from backend/:   python -m scripts.seed_catalog

Idempotent: existing sports/facilities (matched case-insensitively by name) are skipped.
Everything goes through the same pydantic models and metadata validation as the API.
"""
import asyncio
from datetime import datetime, timezone

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.config import get_settings
from app.indexes import CASE_INSENSITIVE, ensure_indexes
from app.models.facility import FacilityCreate, OperatingHours
from app.models.sport import AttributeDef, SportCreate
from app.services.metadata import validate_metadata

WEEK = {"open": "06:00", "close": "21:00"}
WEEKEND = {"open": "08:00", "close": "18:00"}
HOURS = {
    **{day: [WEEK] for day in ("mon", "tue", "wed", "thu", "fri")},
    "sat": [WEEKEND],
    "sun": [WEEKEND],
}

SPORTS = [
    {
        "name": "Badminton", "category": "racquet",
        "description": "Indoor badminton courts.",
        "attributes": [
            {"key": "surface", "label": "Surface", "type": "enum",
             "options": ["wooden", "synthetic"], "required": True},
            {"key": "air_conditioning", "label": "Air conditioning", "type": "boolean"},
            {"key": "lighting", "label": "Lighting", "type": "enum", "options": ["LED", "fluorescent"]},
        ],
    },
    {
        "name": "Football", "category": "team",
        "description": "Grass and turf football grounds.",
        "attributes": [
            {"key": "field_size", "label": "Field size", "type": "enum",
             "options": ["5-a-side", "7-a-side", "11-a-side"], "required": True},
            {"key": "surface_type", "label": "Surface", "type": "enum",
             "options": ["natural grass", "artificial turf"]},
            {"key": "floodlights", "label": "Floodlights", "type": "boolean"},
            {"key": "seating_capacity", "label": "Seating capacity", "type": "number"},
            {"key": "changing_rooms", "label": "Changing rooms", "type": "boolean"},
        ],
    },
    {
        "name": "Basketball", "category": "team",
        "description": "Indoor and outdoor basketball courts.",
        "attributes": [
            {"key": "court_type", "label": "Court type", "type": "enum",
             "options": ["full", "half"], "required": True},
            {"key": "indoor", "label": "Indoor", "type": "boolean"},
            {"key": "hoops", "label": "Number of hoops", "type": "number"},
            {"key": "lighting", "label": "Lighting", "type": "boolean"},
            {"key": "seating", "label": "Seating capacity", "type": "number"},
        ],
    },
    {
        "name": "Swimming", "category": "aquatic",
        "description": "Campus swimming pool.",
        "attributes": [
            {"key": "pool_length_m", "label": "Pool length (m)", "type": "number", "required": True},
            {"key": "lanes", "label": "Lanes", "type": "number"},
            {"key": "heated", "label": "Heated", "type": "boolean"},
        ],
    },
]

FACILITIES = [
    ("Badminton", "Badminton Court 1", "Sports Complex, Block A",
     {"surface": "wooden", "air_conditioning": True, "lighting": "LED"}),
    ("Badminton", "Badminton Court 2", "Sports Complex, Block A",
     {"surface": "wooden", "air_conditioning": True, "lighting": "LED"}),
    ("Badminton", "Badminton Court 3", "Sports Complex, Block B",
     {"surface": "synthetic", "air_conditioning": False, "lighting": "fluorescent"}),
    ("Football", "Main Football Ground", "North Field",
     {"field_size": "11-a-side", "surface_type": "natural grass", "floodlights": True,
      "seating_capacity": 500, "changing_rooms": True}),
    ("Football", "Mini Turf", "South Field",
     {"field_size": "5-a-side", "surface_type": "artificial turf", "floodlights": True,
      "changing_rooms": False}),
    ("Basketball", "Indoor Basketball Court", "Sports Complex, Block C",
     {"court_type": "full", "indoor": True, "hoops": 2, "lighting": True, "seating": 200}),
    ("Basketball", "Outdoor Basketball Court", "Hostel Area",
     {"court_type": "half", "indoor": False, "hoops": 1, "lighting": False}),
    ("Swimming", "Campus Pool", "Aquatic Centre",
     {"pool_length_m": 25, "lanes": 6, "heated": False}),
]


async def seed(db: AsyncDatabase) -> dict[str, int]:
    await ensure_indexes(db)
    now = datetime.now(timezone.utc)
    created = {"sports": 0, "facilities": 0}
    sport_docs: dict[str, dict] = {}

    for raw in SPORTS:
        sport = SportCreate(**raw)
        doc = await db.sports.find_one({"name": sport.name}, collation=CASE_INSENSITIVE)
        if doc is None:
            doc = {
                "name": sport.name, "category": sport.category, "description": sport.description,
                "attributes": [a.model_dump(exclude_none=True) for a in sport.attributes],
                "created_at": now, "updated_at": now,
            }
            doc["_id"] = (await db.sports.insert_one(doc)).inserted_id
            created["sports"] += 1
        sport_docs[sport.name] = doc

    for sport_name, name, location, metadata in FACILITIES:
        sport_doc = sport_docs[sport_name]
        facility = FacilityCreate(
            name=name, sport_id=str(sport_doc["_id"]), location=location,
            operating_hours=OperatingHours(**HOURS), metadata=metadata,
        )
        clean = validate_metadata([AttributeDef(**a) for a in sport_doc["attributes"]], metadata)
        exists = await db.facilities.find_one(
            {"sport_id": sport_doc["_id"], "name": facility.name}, collation=CASE_INSENSITIVE
        )
        if exists is None:
            await db.facilities.insert_one({
                "name": facility.name, "sport_id": sport_doc["_id"], "location": facility.location,
                "slot_minutes": facility.slot_minutes,
                "operating_hours": facility.operating_hours.model_dump(),
                "status": "active", "metadata": clean, "created_at": now, "updated_at": now,
            })
            created["facilities"] += 1
    return created


async def main() -> None:
    settings = get_settings()
    client = AsyncMongoClient(settings.mongo_uri, tz_aware=True, serverSelectionTimeoutMS=5000)
    try:
        result = await seed(client[settings.mongo_db_name])
    finally:
        await client.close()
    print(f"Seeded into '{settings.mongo_db_name}': {result['sports']} sports, "
          f"{result['facilities']} facilities created (existing ones skipped).")


if __name__ == "__main__":
    asyncio.run(main())
