from bson import ObjectId

from app.errors import AppError


def parse_object_id(value: str, what: str = "Resource") -> ObjectId:
    """Turns a path/query string into an ObjectId; a malformed id is simply 'not found'."""
    if not ObjectId.is_valid(value):
        raise AppError(404, "NOT_FOUND", f"{what} not found")
    return ObjectId(value)
