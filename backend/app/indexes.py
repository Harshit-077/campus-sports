"""Index definitions. Called at startup; create_index is idempotent."""
from pymongo.asynchronous.database import AsyncDatabase

# strength=2 -> case-insensitive comparison, so "Badminton" and "badminton" collide.
CASE_INSENSITIVE = {"locale": "en", "strength": 2}

NOTIFICATION_TTL_SECONDS = 60 * 24 * 60 * 60  # notifications are deleted by MongoDB after 60 days


async def ensure_indexes(db: AsyncDatabase) -> None:
    # users: emails are stored lowercased; the unique index makes registration race-safe
    # (two simultaneous sign-ups -> one wins, the other gets DuplicateKeyError -> HTTP 409).
    await db.users.create_index("email", unique=True, name="users_email_unique")

    # sports: unique name, case-insensitively (enforced by the database, not by app code).
    await db.sports.create_index(
        "name", unique=True, collation=CASE_INSENSITIVE, name="sports_name_unique_ci"
    )

    # facilities: a name is unique within its sport ("Court 1" may exist for two sports).
    await db.facilities.create_index(
        [("sport_id", 1), ("name", 1)],
        unique=True,
        collation=CASE_INSENSITIVE,
        name="facilities_sport_name_unique_ci",
    )
    # browse a sport's facilities, hiding inactive ones
    await db.facilities.create_index(
        [("sport_id", 1), ("status", 1)], name="facilities_sport_status"
    )
    # Wildcard index: every field inside `metadata` is indexed, even though different
    # sports use different fields. One index serves queries like metadata.surface == "wooden"
    # without defining a separate index per sport attribute.
    await db.facilities.create_index([("metadata.$**", 1)], name="facilities_metadata_wildcard")

    # bookings: THE double-booking guard. Unique on (facility, start) but only for
    # confirmed bookings, so a cancelled booking frees its slot for someone else while
    # two confirmed bookings for the same slot can never exist - the database refuses the
    # second insert atomically, whatever the application code does.
    await db.bookings.create_index(
        [("facility_id", 1), ("start", 1)],
        unique=True,
        partialFilterExpression={"status": "confirmed"},
        name="bookings_facility_start_confirmed_unique",
    )
    # "my bookings" (per user, newest/oldest first)
    await db.bookings.create_index([("user_id", 1), ("start", -1)], name="bookings_user_start")
    # admin lists and analytics: filter by status, range over time
    await db.bookings.create_index([("status", 1), ("start", -1)], name="bookings_status_start")
    # range scans over time that do not filter by status (analytics summary, cancellation
    # stats, admin lists by date)
    await db.bookings.create_index([("start", -1)], name="bookings_start")

    # notifications: a user's feed, newest first
    await db.notifications.create_index(
        [("user_id", 1), ("created_at", -1)], name="notifications_user_created"
    )
    # TTL index: MongoDB itself deletes a notification once created_at is older than the
    # limit, so there is no cleanup job to write or run.
    await db.notifications.create_index(
        "created_at", expireAfterSeconds=NOTIFICATION_TTL_SECONDS, name="notifications_ttl"
    )
