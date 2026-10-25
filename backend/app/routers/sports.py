from datetime import datetime, timezone

from fastapi import APIRouter
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.deps import AdminUser, Database
from app.errors import AppError
from app.ids import parse_object_id
from app.models.sport import SportCreate, SportOut, SportUpdate

router = APIRouter(prefix="/sports", tags=["sports"])

_NAME_COLLATION = {"locale": "en"}


def _sport_exists_error() -> AppError:
    return AppError(409, "SPORT_EXISTS", "A sport with this name already exists")


@router.get("", response_model=list[SportOut])
async def list_sports(db: Database) -> list[SportOut]:
    cursor = db.sports.find({}, sort=[("name", 1)], collation=_NAME_COLLATION)
    return [SportOut.from_doc(doc) for doc in await cursor.to_list(length=200)]


@router.get("/{sport_id}", response_model=SportOut)
async def get_sport(sport_id: str, db: Database) -> SportOut:
    doc = await db.sports.find_one({"_id": parse_object_id(sport_id, "Sport")})
    if doc is None:
        raise AppError(404, "NOT_FOUND", "Sport not found")
    return SportOut.from_doc(doc)


@router.post("", response_model=SportOut, status_code=201)
async def create_sport(body: SportCreate, _admin: AdminUser, db: Database) -> SportOut:
    now = datetime.now(timezone.utc)
    doc = {
        "name": body.name,
        "category": body.category,
        "description": body.description,
        "attributes": [a.model_dump(exclude_none=True) for a in body.attributes],
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db.sports.insert_one(doc)
    except DuplicateKeyError:
        raise _sport_exists_error() from None
    doc["_id"] = result.inserted_id
    return SportOut.from_doc(doc)


@router.patch("/{sport_id}", response_model=SportOut)
async def update_sport(
    sport_id: str, body: SportUpdate, _admin: AdminUser, db: Database
) -> SportOut:
    oid = parse_object_id(sport_id, "Sport")
    changes = body.model_dump(exclude_unset=True)

    for field in ("name", "category", "attributes"):
        if field in changes and changes[field] is None:
            raise AppError(
                422, "VALIDATION_ERROR", f"{field} cannot be null",
                details=[{"field": f"body.{field}", "message": "cannot be null"}],
            )
    if "attributes" in changes:
        changes["attributes"] = [a.model_dump(exclude_none=True) for a in body.attributes or []]

    if not changes:
        doc = await db.sports.find_one({"_id": oid})
    else:
        changes["updated_at"] = datetime.now(timezone.utc)
        try:
            doc = await db.sports.find_one_and_update(
                {"_id": oid}, {"$set": changes}, return_document=ReturnDocument.AFTER
            )
        except DuplicateKeyError:
            raise _sport_exists_error() from None
    if doc is None:
        raise AppError(404, "NOT_FOUND", "Sport not found")
    return SportOut.from_doc(doc)


@router.delete("/{sport_id}", status_code=204)
async def delete_sport(sport_id: str, _admin: AdminUser, db: Database) -> None:
    oid = parse_object_id(sport_id, "Sport")
    if await db.facilities.count_documents({"sport_id": oid}, limit=1):
        raise AppError(409, "SPORT_IN_USE", "Cannot delete a sport that still has facilities")
    result = await db.sports.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise AppError(404, "NOT_FOUND", "Sport not found")
