import pytest
from pydantic import ValidationError

from app.config import Settings
from tests.helpers import TEST_JWT_SECRET


def test_default_timezone_is_valid():
    assert Settings(jwt_secret=TEST_JWT_SECRET).campus_timezone == "Asia/Kolkata"


def test_invalid_timezone_is_rejected():
    with pytest.raises(ValidationError):
        Settings(jwt_secret=TEST_JWT_SECRET, campus_timezone="Mars/Olympus")


def test_cors_origins_are_split_and_trimmed():
    s = Settings(jwt_secret=TEST_JWT_SECRET, cors_origins="http://a.com, http://b.com ,")
    assert s.cors_origins_list == ["http://a.com", "http://b.com"]


def test_missing_jwt_secret_is_rejected(monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_short_jwt_secret_is_rejected():
    with pytest.raises(ValidationError):
        Settings(jwt_secret="too-short")
