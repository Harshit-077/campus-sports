import pytest
from pydantic import ValidationError

from app.errors import AppError
from app.models.sport import AttributeDef, SportCreate
from app.services.metadata import coerce_filter_value, validate_metadata

ATTRS = [
    AttributeDef(key="surface", label="Surface", type="enum",
                 options=["wooden", "synthetic"], required=True),
    AttributeDef(key="indoor", label="Indoor", type="boolean"),
    AttributeDef(key="courts", label="Courts", type="number"),
    AttributeDef(key="notes", label="Notes", type="string"),
]


def problems_for(metadata):
    with pytest.raises(AppError) as exc:
        validate_metadata(ATTRS, metadata)
    assert exc.value.status_code == 422 and exc.value.code == "INVALID_METADATA"
    return {d["field"]: d["message"] for d in exc.value.details}


def test_valid_metadata_is_returned_cleaned():
    clean = validate_metadata(ATTRS, {"surface": "wooden", "courts": 4, "notes": "  corner  "})
    assert clean == {"surface": "wooden", "courts": 4, "notes": "corner"}


def test_optional_attributes_may_be_omitted_or_null():
    assert validate_metadata(ATTRS, {"surface": "synthetic", "indoor": None}) == {
        "surface": "synthetic"
    }


def test_unknown_attribute_is_rejected():
    assert "metadata.colour" in problems_for({"surface": "wooden", "colour": "red"})


def test_missing_required_attribute_is_rejected():
    assert "metadata.surface" in problems_for({"indoor": True})


def test_wrong_types_are_rejected_and_all_reported_together():
    found = problems_for({"surface": "grass", "indoor": "yes", "courts": "4", "notes": ""})
    assert set(found) == {"metadata.surface", "metadata.indoor", "metadata.courts", "metadata.notes"}


def test_booleans_are_not_accepted_as_numbers():
    assert "metadata.courts" in problems_for({"surface": "wooden", "courts": True})


def test_coerce_filter_values():
    boolean, number, enum, string = ATTRS[1], ATTRS[2], ATTRS[0], ATTRS[3]
    assert coerce_filter_value(boolean, "TRUE") is True
    assert coerce_filter_value(boolean, "false") is False
    assert coerce_filter_value(number, "4") == 4 and isinstance(coerce_filter_value(number, "4"), int)
    assert coerce_filter_value(number, "2.5") == 2.5
    assert coerce_filter_value(enum, "wooden") == "wooden"
    assert coerce_filter_value(string, "anything") == "anything"


@pytest.mark.parametrize("attr_index,raw", [(1, "maybe"), (2, "abc"), (2, "nan"), (0, "grass")])
def test_coerce_filter_rejects_bad_values(attr_index, raw):
    with pytest.raises(ValueError):
        coerce_filter_value(ATTRS[attr_index], raw)


def test_enum_attribute_requires_options():
    with pytest.raises(ValidationError):
        AttributeDef(key="surface", label="Surface", type="enum")


def test_options_only_allowed_on_enum():
    with pytest.raises(ValidationError):
        AttributeDef(key="indoor", label="Indoor", type="boolean", options=["a"])


def test_attribute_keys_must_be_unique_within_a_sport():
    attr = {"key": "surface", "label": "Surface", "type": "string"}
    with pytest.raises(ValidationError):
        SportCreate(name="X", category="other", attributes=[attr, attr])


def test_attribute_key_format():
    with pytest.raises(ValidationError):
        AttributeDef(key="Bad Key", label="Bad", type="string")
