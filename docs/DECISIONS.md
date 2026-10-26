# Architecture Decisions

Status values: **Implemented** (in the code now) - **Proposed** (agreed, not built yet).

| # | Decision | Status |
|---|----------|--------|
| 1 | Monorepo: `backend/` + `frontend/`, single git repo at the root | Implemented |
| 2 | PyMongo async client (`AsyncMongoClient`), not Motor (deprecated); `tz_aware=True` so datetimes come back as UTC-aware | Implemented |
| 3 | Settings via pydantic-settings; campus timezone validated at startup (default `Asia/Kolkata`); `JWT_SECRET` required (>= 32 chars) so the app cannot start with a missing/weak secret | Implemented |
| 4 | Tests run against a real MongoDB in a separate `*_test` database (mongomock cannot model MongoDB's atomicity) | Implemented |
| 5 | Bookings-only model: slot grid is computed from the facility schedule; only `bookings` is stored | Implemented |
| 6 | Double-booking prevention: partial unique index on `(facility_id, start)` where `status == "confirmed"`; booking = single insert, `DuplicateKeyError` -> HTTP 409 | Implemented |
| 7 | All timestamps stored in UTC; slots generated in campus timezone then converted | Implemented |
| 8 | Analytics via MongoDB aggregation pipelines (server-side), not computed in the browser | Implemented |
| 9 | JWT (HS256, PyJWT) sent as `Authorization: Bearer`; the user's role and active flag are re-read from the DB on every request, so role changes/disabling apply immediately | Implemented |
| 10 | Passwords hashed with Argon2id (pwdlib), run in a worker thread; unknown-email logins still run one verification to avoid a timing leak | Implemented |
| 11 | Roles: `student`, `admin`. Public registration always creates a student; admins are created only via `make create-admin` | Implemented |
| 12 | Email uniqueness enforced by a unique index on the lowercased email (race-safe), not by find-then-insert | Implemented |
| 13 | Login uses the OAuth2 password form (`username` = email) so Swagger's Authorize button works with the same endpoint the frontend uses | Implemented |
| 14 | One error shape for every failure: `{"error": {"code", "message", "details?"}}` (domain errors, HTTP errors and validation errors) | Implemented |
| 15 | App factory only (`uvicorn app.main:create_app --factory`); no module-level `app`, so importing never reads settings | Implemented |
| 16 | Each sport defines typed attribute definitions (`string`/`number`/`boolean`/`enum`, optional `required`); a facility's `metadata` is validated against its sport's definitions (unknown keys rejected). Flexible per sport, but never a free-for-all dict | Implemented |
| 17 | A facility belongs to exactly one sport (`sport_id`); a multi-purpose hall is modelled as one facility per sport | Implemented |
| 18 | Operating hours are embedded in the facility document as a weekly template of wall-clock `HH:MM` windows (campus timezone), plus `slot_minutes`; windows must be ordered, non-overlapping and at least one slot long | Implemented |
| 19 | Case-insensitive unique indexes via collation (`strength: 2`): sport name; facility name within a sport | Implemented |
| 20 | Wildcard index on `metadata.$**` so queries on any sport-specific attribute are indexed without one index per attribute | Implemented |
| 21 | Facility lists join sports with `$lookup` (one round-trip, no N+1); lists use numeric-ordering collation so "Court 2" sorts before "Court 10" | Implemented |
| 22 | No hard delete for facilities (set `status: "inactive"`, which also keeps future booking history intact); deleting a sport is blocked while facilities reference it | Implemented |
| 23 | Facility search (`q`) is a case-insensitive escaped regex over name/location, not a text index: friendlier for partial words at campus scale | Implemented |
| 24 | Only bookings are stored; the slot grid is computed from the facility's weekly hours (`services/slots.py`). A booking's `start` must equal a computed slot exactly | Implemented |
| 25 | Cancelling is ONE conditional update (`status` still confirmed + owner + before cut-off). Simultaneous or repeated cancels cannot both succeed and cannot touch a re-booked slot, because freeing the slot is just the status flip under the partial unique index | Implemented |
| 26 | Bookings snapshot `sport_id` from the facility at booking time (denormalised) so history and analytics stay correct if a facility's sport is later edited | Implemented |
| 27 | Per-student rules (max upcoming bookings, no overlapping bookings) are check-then-insert usability limits, not integrity rules; only slot uniqueness is database-enforced | Implemented |
| 28 | Booking rules are configurable: booking window (14 days), student cancellation cut-off (60 min), upcoming-booking cap (5). Students can book and cancel; admins can cancel any booking that has not ended | Implemented |
| 29 | The app takes an injectable clock (`create_app(settings, clock=...)`) so time-dependent rules are tested deterministically | Implemented |
| 30 | Analytics are server-side aggregation pipelines over `bookings`, one per metric: popular sports (`$match` > `$group` > `$sort` > `$lookup`), busiest facilities (+ `$limit`), peak hours (`$hour` with the campus timezone), bookings over time (`$dateToString`), cancellations (`$group` on status and canceller), summary (`$facet` runs two sub-pipelines in one pass) | Implemented |
| 31 | Utilization is hybrid: booked slots come from an aggregation, capacity is derived from each facility's weekly hours (slots that have already started), because slots are not stored | Implemented |
| 32 | Analytics take inclusive campus-local dates (default: last 30 days ending today, max 366); every date bound is converted to UTC instants before querying | Implemented |
| 33 | Admin APIs live under `/admin/*` and are protected once at router level; admins can list all bookings (filters, paging, joined student/facility/sport) and manage users | Implemented |
| 34 | Admins cannot change their own role or active flag; disabling a user can optionally cancel their upcoming bookings (frees the slots); disabling is immediate because the active flag is read per request | Implemented |
| 35 | In-app notifications (booking confirmed, booking cancelled by an admin). Creation is best-effort: a failure is logged and never fails the booking | Implemented |
| 36 | Notifications expire through a TTL index (60 days): MongoDB deletes them itself, no cleanup job | Implemented |
| 37 | `make seed-demo` generates reproducible demo students and bookings (weighted towards busy sports and evening hours) for dashboards; refuses to run when `ENVIRONMENT=production`. `make explain` prints which index serves each key query | Implemented |
| 38 | Login token is kept in `localStorage`, exposed to React as an external store (`useSyncExternalStore`, tabs stay in sync). Trade-off: readable by any XSS bug; React escapes output and the app renders no raw HTML. An httpOnly-cookie setup via a server proxy is a possible hardening step | Implemented |
| 39 | Route protection is client-side (`RequireAuth` around the `(student)` and `(admin)` route groups, with `?next=` return); no Next middleware. It only guides users: the backend enforces every role | Implemented |
| 40 | Data fetching with TanStack Query; every call goes through typed functions in `lib/services.ts` on one `api()` wrapper that attaches the token and parses the uniform error shape into `ApiError` | Implemented |
| 41 | Times are always displayed in the campus timezone (`Intl` with `NEXT_PUBLIC_CAMPUS_TIMEZONE`), independent of the browser's timezone | Implemented |
| 42 | Design tokens (palette, fonts, type scale) live in `globals.css` under the names of the Stitch design system (`design/stitch/field_court/DESIGN.md`). Screens are built from the Stitch designs; `docs/DESIGN_NOTES.md` records what was kept and left out | Implemented |
| 43 | Public `GET /rules` returns the booking window, cancellation cut-off and booking cap, so the UI shows the configured numbers instead of hard-coding them | Implemented |
| 44 | `GET /facilities?with_availability=true` adds today's open-slot count and next free slot to each active facility, computed from slot grids and ONE bookings query (served by the unique `(facility_id, start)` index) | Implemented |
| 45 | The facilities screen uses the server-side attribute filters (`meta.*`, backed by the wildcard index on `metadata`) instead of filtering in the browser | Implemented |
| 46 | Icons come from `lucide-react` (1.75 stroke) instead of the Material Symbols font used in the Stitch exports: no external font request, tree-shaken SVGs | Implemented |
| 47 | Features in the Stitch designs that need data the system does not have (gate passes, rank, fees, court blueprints, partner invites) are deliberately not built | Implemented |

## Notes
- Decisions 5/6 (now implemented) replace the earlier pre-generated `slots` collection: one collection and one atomic
  insert removes the two-document consistency problems (orphaned slots, stale slot release).
- Analytics need MongoDB 5.0+ only if you switch to `$dateTrunc`; the current pipelines use
  operators available since 3.6 (`$dateToString`/`$hour` with a timezone), plus `$facet` (3.4).
