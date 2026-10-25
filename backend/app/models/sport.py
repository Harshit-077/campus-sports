from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator, model_validator

AttrType = Literal["string", "number", "boolean", "enum"]
SportCategory = Literal["team", "racquet", "aquatic", "fitness", "individual", "other"]

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)]
OptionText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]


class AttributeDef(BaseModel):
    """One facility attribute that a sport defines (e.g. Badminton -> 'surface').

    Facilities of that sport must provide `metadata` matching these definitions.
    This is what lets different sports carry different fields while still being validated.
    """

    key: str = Field(pattern=r"^[a-z][a-z0-9_]{0,39}$")
    label: ShortText
    type: AttrType
    required: bool = False
    options: list[OptionText] | None = None  # only for type == "enum"

    @model_validator(mode="after")
    def _check_options(self) -> "AttributeDef":
        if self.type == "enum":
            if not self.options:
                raise ValueError("enum attributes need at least one option")
            if len(set(self.options)) != len(self.options):
                raise ValueError("enum options must be unique")
        elif self.options is not None:
            raise ValueError("options are only allowed for enum attributes")
        return self


def _unique_keys(attributes: list[AttributeDef]) -> list[AttributeDef]:
    keys = [a.key for a in attributes]
    if len(set(keys)) != len(keys):
        raise ValueError("attribute keys must be unique within a sport")
    return attributes


class SportCreate(BaseModel):
    name: ShortText
    category: SportCategory
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None = None
    attributes: list[AttributeDef] = Field(default_factory=list, max_length=20)

    _check_keys = field_validator("attributes")(_unique_keys)


class SportUpdate(BaseModel):
    name: ShortText | None = None
    category: SportCategory | None = None
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None = None
    attributes: list[AttributeDef] | None = Field(default=None, max_length=20)

    @field_validator("attributes")
    @classmethod
    def _check_keys(cls, value: list[AttributeDef] | None) -> list[AttributeDef] | None:
        return None if value is None else _unique_keys(value)


class SportSummary(BaseModel):
    id: str
    name: str
    category: str


class SportOut(BaseModel):
    id: str
    name: str
    category: SportCategory
    description: str | None = None
    attributes: list[AttributeDef]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_doc(cls, doc: dict[str, Any]) -> "SportOut":
        return cls(
            id=str(doc["_id"]),
            name=doc["name"],
            category=doc["category"],
            description=doc.get("description"),
            attributes=doc.get("attributes", []),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )
