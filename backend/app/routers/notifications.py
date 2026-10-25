from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Query
from pymongo import ReturnDocument

from app.deps import CurrentUser, Database
from app.errors import AppError
from app.ids import parse_object_id
from app.models.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=list[NotificationOut])
async def my_notifications(
    user: CurrentUser,
    db: Database,
    unread_only: bool = False,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    skip: Annotated[int, Query(ge=0)] = 0,
) -> list[NotificationOut]:
    match: dict = {"user_id": ObjectId(user.id)}
    if unread_only:
        match["read"] = False
    cursor = db.notifications.find(match, sort=[("created_at", -1), ("_id", -1)], skip=skip, limit=limit)
    return [NotificationOut.from_doc(d) for d in await cursor.to_list(length=limit)]


@router.get("/me/unread-count")
async def unread_count(user: CurrentUser, db: Database) -> dict[str, int]:
    count = await db.notifications.count_documents({"user_id": ObjectId(user.id), "read": False})
    return {"count": count}


@router.post("/read-all")
async def mark_all_read(user: CurrentUser, db: Database) -> dict[str, int]:
    result = await db.notifications.update_many(
        {"user_id": ObjectId(user.id), "read": False}, {"$set": {"read": True}}
    )
    return {"updated": result.modified_count}


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: str, user: CurrentUser, db: Database) -> NotificationOut:
    oid = parse_object_id(notification_id, "Notification")
    doc = await db.notifications.find_one_and_update(
        {"_id": oid, "user_id": ObjectId(user.id)},  # someone else's notification looks like "not found"
        {"$set": {"read": True}},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise AppError(404, "NOT_FOUND", "Notification not found")
    return NotificationOut.from_doc(doc)
