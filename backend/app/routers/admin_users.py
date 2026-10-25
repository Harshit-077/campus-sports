import re
from typing import Annotated, Any

from bson import ObjectId
from fastapi import APIRouter, Depends, Query
from pymongo import ReturnDocument

from app.deps import AdminUser, Database, Now, admin_required
from app.errors import AppError
from app.ids import parse_object_id
from app.models.admin import UserAdminOut, UserPage, UserUpdate
from app.models.user import Role, User

router = APIRouter(
    prefix="/admin/users", tags=["admin: users"], dependencies=[Depends(admin_required)]
)


@router.get("", response_model=UserPage)
async def list_users(
    db: Database,
    q: Annotated[str | None, Query(max_length=60, description="name, email or student id")] = None,
    role: Role | None = None,
    is_active: bool | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    skip: Annotated[int, Query(ge=0)] = 0,
) -> UserPage:
    match: dict[str, Any] = {}
    if role:
        match["role"] = role
    if is_active is not None:
        match["is_active"] = is_active
    if q:
        pattern = {"$regex": re.escape(q.strip()), "$options": "i"}
        match["$or"] = [{"name": pattern}, {"email": pattern}, {"student_id": pattern}]

    total = await db.users.count_documents(match)
    cursor = db.users.find(match, sort=[("created_at", -1), ("_id", 1)], skip=skip, limit=limit)
    items = [User.from_doc(d) for d in await cursor.to_list(length=limit)]
    return UserPage(items=items, total=total, limit=limit, skip=skip)


@router.patch("/{user_id}", response_model=UserAdminOut)
async def update_user(
    user_id: str, body: UserUpdate, admin: AdminUser, db: Database, now: Now
) -> UserAdminOut:
    """Enable/disable an account or change its role.

    An admin cannot change their own role or active flag (prevents locking yourself out).
    Disabling takes effect immediately: the user's role/active flag are read from the
    database on every request, so existing tokens stop working at once.
    """
    oid = parse_object_id(user_id, "User")
    changes = body.model_dump(exclude_unset=True, exclude={"cancel_upcoming_bookings"})
    null_fields = [k for k, v in changes.items() if v is None]
    if null_fields:
        raise AppError(
            422, "VALIDATION_ERROR", "Fields cannot be null",
            details=[{"field": f"body.{k}", "message": "cannot be null"} for k in null_fields],
        )
    if oid == ObjectId(admin.id) and changes:
        raise AppError(409, "CANNOT_MODIFY_SELF", "You cannot change your own role or status")

    if changes:
        doc = await db.users.find_one_and_update(
            {"_id": oid}, {"$set": changes}, return_document=ReturnDocument.AFTER
        )
    else:
        doc = await db.users.find_one({"_id": oid})
    if doc is None:
        raise AppError(404, "NOT_FOUND", "User not found")

    cancelled = 0
    if changes.get("is_active") is False and body.cancel_upcoming_bookings:
        result = await db.bookings.update_many(
            {"user_id": oid, "status": "confirmed", "end": {"$gt": now}},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelled_at": now,
                    "cancelled_by": "admin",
                    "cancel_reason": "Account disabled",
                    "updated_at": now,
                }
            },
        )
        cancelled = result.modified_count

    return UserAdminOut(**User.from_doc(doc).model_dump(), cancelled_bookings=cancelled)
