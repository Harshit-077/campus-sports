# Data Model (as implemented)

Describes the collections that exist in the code today. All timestamps are UTC.

## users
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `name` | string | |
| `email` | string | stored lowercased |
| `password_hash` | string | Argon2id, never returned by the API |
| `role` | `"student"` \| `"admin"` | public registration always creates `student` |
| `student_id` | string \| null | optional campus id |
| `is_active` | bool | disabled users are rejected immediately |
| `created_at` | datetime | |

Indexes: `users_email_unique` (unique on `email`).

## sports
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `name` | string | unique, case-insensitive |
| `category` | enum | team, racquet, aquatic, fitness, individual, other |
| `description` | string \| null | |
| `attributes` | array (embedded) | `{key, label, type, required, options?}` - the schema for facility metadata |
| `created_at`, `updated_at` | datetime | |

Indexes: `sports_name_unique_ci` (unique, collation strength 2).

## facilities
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `name` | string | unique within a sport, case-insensitive |
| `sport_id` | ObjectId | **referenced** (`sports._id`); joined with `$lookup` |
| `location` | string | |
| `slot_minutes` | int | 30, 45, 60, 90 or 120 |
| `operating_hours` | object (embedded) | `{mon..sun: [{open: "HH:MM", close: "HH:MM"}]}`, campus-local wall-clock; empty day = closed |
| `status` | `"active"` \| `"maintenance"` \| `"inactive"` | inactive facilities are hidden from the public list |
| `metadata` | object (embedded) | sport-specific fields, validated against `sports.attributes` |
| `created_at`, `updated_at` | datetime | |

Indexes: `facilities_sport_name_unique_ci` (unique `(sport_id, name)`, collation strength 2),
`facilities_sport_status` (`(sport_id, status)`), `facilities_metadata_wildcard` (`metadata.$**`).

### Embedded vs referenced
- **Embedded:** `metadata` and `operating_hours` belong to one facility, are always read with it,
  and are never queried on their own.
- **Referenced:** `sport_id` points at `sports` because a sport is shared by many facilities and
  is edited independently (renaming a sport must not require touching every facility).

## bookings
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `user_id` | ObjectId | **referenced** (`users._id`) |
| `facility_id` | ObjectId | **referenced** (`facilities._id`) |
| `sport_id` | ObjectId | **denormalised snapshot** of the facility's sport at booking time |
| `start`, `end` | datetime (UTC) | `start` is always one of the facility's computed slots |
| `status` | `"confirmed"` \| `"cancelled"` | |
| `created_at`, `updated_at` | datetime | |
| `cancelled_at` | datetime \| null | |
| `cancelled_by` | `"student"` \| `"admin"` \| null | |
| `cancel_reason` | string \| null | |

Slots are **not** stored: the grid for a day is computed from `facilities.operating_hours` and
`slot_minutes`, and only booked slots exist as documents.

Indexes:
- `bookings_facility_start_confirmed_unique`: unique `(facility_id, start)` with
  `partialFilterExpression: {status: "confirmed"}`. This is the double-booking guard: two confirmed
  bookings for one slot cannot exist, while a cancelled booking frees its slot. It also serves
  availability queries (facility + time range).
- `bookings_user_start`: `(user_id, start desc)` for "my bookings".
- `bookings_status_start`: `(status, start desc)` for status-filtered admin lists and the analytics
  pipelines (`$match` on confirmed + a date range).
- `bookings_start`: `(start desc)` for range scans that do not filter by status (summary,
  cancellation stats, admin lists by date).

### Why `sport_id` is copied into the booking
Analytics such as "most popular sport" can group bookings directly by `sport_id` without joining
through facilities. It is a snapshot, so editing a facility's sport later does not rewrite history.
The cost is one extra field that must be set at insert time.

## notifications
| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `user_id` | ObjectId | **referenced** (`users._id`): the recipient |
| `type` | `"booking_confirmed"` \| `"booking_cancelled_by_admin"` | |
| `title`, `message` | string | message names the facility and the campus-local time |
| `booking_id` | ObjectId \| null | **referenced** |
| `read` | bool | |
| `created_at` | datetime | drives the TTL index |

Indexes: `notifications_user_created` (`(user_id, created_at desc)`, a user's feed) and
`notifications_ttl` (TTL on `created_at`, 60 days: MongoDB deletes expired notifications itself).

## Query -> index map
Run `make explain` to see MongoDB's own choice for each of these.

| Query | Index |
|-------|-------|
| Availability: confirmed bookings of a facility on a day | `bookings_facility_start_confirmed_unique` |
| My bookings (upcoming / history) | `bookings_user_start` |
| Analytics `$match`: confirmed + date range | `bookings_status_start` |
| Summary / admin by date, any status | `bookings_start` |
| Browse a sport's facilities | `facilities_sport_status` |
| Filter facilities by a sport-specific attribute | `facilities_metadata_wildcard` |
| Sport / facility / user uniqueness | `sports_name_unique_ci`, `facilities_sport_name_unique_ci`, `users_email_unique` |
| A user's notification feed / expiry | `notifications_user_created` / `notifications_ttl` |
