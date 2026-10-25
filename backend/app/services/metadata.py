"""Validation of a facility's `metadata` against the attribute definitions of its sport.

Pure functions (no database) so they are easy to unit-test.
"""
import math
from collections.abc import Sequence
from typing import Any

from app.errors import AppError
from app.models.sport import AttributeDef

MAX_STRING_LENGTH = 200


def _check_value(attr: AttributeDef, value: Any) -> tuple[Any, str | None]:
    """Returns (clean_value, problem); problem is None when the value is valid."""
    if attr.type == "boolean":
        return (value, None) if isinstance(value, bool) else (None, "must be true or false")

    if attr.type == "number":
        is_number = isinstance(value, int | float) and not isinstance(value, bool)
        if is_number and math.isfinite(value):
            return value, None
        return None, "must be a number"

    if attr.type == "string":
        if isinstance(value, str) and 1 <= len(value.strip()) <= MAX_STRING_LENGTH:
            return value.strip(), None
        return None, f"must be text of 1-{MAX_STRING_LENGTH} characters"

    # enum
    if isinstance(value, str) and attr.options and value in attr.options:
        return value, None
    return None, f"must be one of: {', '.join(attr.options or [])}"


def validate_metadata(attributes: Sequence[AttributeDef], metadata: dict[str, Any]) -> dict[str, Any]:
    """Returns the cleaned metadata or raises AppError(422, INVALID_METADATA)."""
    by_key = {a.key: a for a in attributes}
    problems: list[dict[str, str]] = []
    clean: dict[str, Any] = {}

    for key in metadata:
        if key not in by_key:
            problems.append({"field": f"metadata.{key}", "message": "unknown attribute for this sport"})

    for attr in attributes:
        value = metadata.get(attr.key)
        if value is None:
            if attr.required:
                problems.append({"field": f"metadata.{attr.key}", "message": "is required"})
            continue
        cleaned, problem = _check_value(attr, value)
        if problem:
            problems.append({"field": f"metadata.{attr.key}", "message": problem})
        else:
            clean[attr.key] = cleaned

    if problems:
        raise AppError(
            422,
            "INVALID_METADATA",
            "Facility metadata does not match the sport's attributes",
            details=problems,
        )
    return clean


def coerce_filter_value(attr: AttributeDef, raw: str) -> Any:
    """Converts a query-string value to the attribute's type. Raises ValueError if invalid."""
    if attr.type == "boolean":
        lowered = raw.strip().lower()
        if lowered not in ("true", "false"):
            raise ValueError("must be true or false")
        return lowered == "true"
    if attr.type == "number":
        try:
            number = float(raw)
        except ValueError:
            raise ValueError("must be a number") from None
        if not math.isfinite(number):
            raise ValueError("must be a number")
        return int(number) if number.is_integer() else number
    if attr.type == "enum":
        if attr.options and raw in attr.options:
            return raw
        raise ValueError(f"must be one of: {', '.join(attr.options or [])}")
    return raw  # string
