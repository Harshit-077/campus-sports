"""Shared facility queries. Sports are joined in with $lookup so a list of N facilities
costs ONE database round-trip instead of N+1."""
from typing import Any

from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from app.models.facility import FacilityOut

# numericOrdering makes "Court 2" sort before "Court 10"
LIST_COLLATION = {"locale": "en", "numericOrdering": True}


def facility_pipeline(match: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {"$match": match},
        {"$sort": {"name": 1}},
        {
            "$lookup": {
                "from": "sports",
                "localField": "sport_id",
                "foreignField": "_id",
                "as": "sport",
            }
        },
        {"$unwind": "$sport"},
    ]


async def query_facilities(
    db: AsyncDatabase, match: dict[str, Any], limit: int = 500
) -> list[FacilityOut]:
    cursor = await db.facilities.aggregate(facility_pipeline(match), collation=LIST_COLLATION)
    docs = await cursor.to_list(length=limit)
    return [FacilityOut.from_doc(doc) for doc in docs]


async def load_facility(db: AsyncDatabase, facility_id: ObjectId) -> FacilityOut | None:
    items = await query_facilities(db, {"_id": facility_id}, limit=1)
    return items[0] if items else None
