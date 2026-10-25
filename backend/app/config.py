"""Application settings, loaded from environment variables / backend/.env."""
from functools import lru_cache
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Campus Sports API"
    environment: str = "development"

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "campus_sports"

    # Comma-separated in the environment, e.g. "http://localhost:3000,https://app.example.com"
    cors_origins: str = "http://localhost:3000"

    campus_timezone: str = "Asia/Kolkata"

    # Booking rules
    booking_window_days: int = Field(default=14, ge=1, le=90)  # how far ahead students can book
    cancellation_cutoff_minutes: int = Field(default=60, ge=0)  # students cannot cancel later than this
    max_active_bookings: int = Field(default=5, ge=1)  # upcoming confirmed bookings per student

    # No default on purpose: a missing/weak secret must stop the app from starting.
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: Literal["HS256", "HS384", "HS512"] = "HS256"
    access_token_expire_minutes: int = Field(default=60, ge=1)

    @field_validator("campus_timezone")
    @classmethod
    def _valid_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise ValueError(f"Unknown timezone: {value!r}") from exc
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.campus_timezone)


@lru_cache
def get_settings() -> Settings:
    return Settings()
