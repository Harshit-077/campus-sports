# Campus Sports Management & Booking System

A full-stack platform for discovering and booking university sports facilities.
**Next.js** (frontend) - **FastAPI** (backend) - **MongoDB** (database; Atlas in deployment).

> Status: the backend is feature-complete and the student screens are built. The admin screens come in step 8.
> See `docs/DECISIONS.md` for what is decided vs. implemented.

## Prerequisites
- Python 3.12, Node.js 20+, `make`
- MongoDB running locally on `localhost:27017` (e.g. `brew services start mongodb-community`)

## Quick start
**Run every `make` command from the repository root** (the folder containing the `Makefile`).

```bash
# 1. Backend config
cp backend/.env.example backend/.env
python3.12 -c "import secrets; print(secrets.token_urlsafe(48))"   # paste into JWT_SECRET in backend/.env

# 2. Install, test, run
make backend-install
make backend-test        # needs MongoDB running
make backend-run         # http://localhost:8000/docs  and  /health

# 3. Create your first admin (interactive), and load demo sports/facilities
make create-admin
make seed
make seed-demo           # optional: demo students + bookings so dashboards have data
```

## Frontend setup (first time only)
From the repo root:
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --disable-git
rm -rf frontend/.git   # safety net: the repo must have exactly one .git, at the root

cd frontend && npm install @tanstack/react-query lucide-react && cp .env.local.example .env.local
```
See `docs/FRONTEND.md` for the structure and conventions, and `docs/DESIGN_BRIEF.md` for the Stitch prompts.

## API (so far)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | none | API + database status |
| POST | `/api/v1/auth/register` | none | JSON `{name, email, password, student_id?}`; always creates a student |
| POST | `/api/v1/auth/login` | none | **form-encoded** `username` (email) + `password`; returns JWT + user |
| GET | `/api/v1/auth/me` | Bearer | current user |

| GET | `/api/v1/sports`, `/api/v1/sports/{id}` | none | sports with their attribute definitions |
| POST / PATCH / DELETE | `/api/v1/sports[/{id}]` | admin | delete is blocked while facilities use the sport |
| GET | `/api/v1/facilities` | none | filters: `sport_id`, `q`, `meta.<attr>=<value>` (needs `sport_id`); `include_inactive=true` is admin-only; `with_availability=true` adds today's open slots and next free slot |
| GET | `/api/v1/facilities/{id}` | none | facility with its sport joined in |
| GET | `/api/v1/rules` | none | booking window, cancellation cut-off, booking cap |
| POST / PATCH | `/api/v1/facilities[/{id}]` | admin | metadata is validated against the sport's attributes; no hard delete (set `status: "inactive"`) |
| GET | `/api/v1/facilities/{id}/slots?date=YYYY-MM-DD` | none (optional) | slot grid with `available` / `booked` / `past` / `unavailable`; `booked_by_me` when logged in |
| POST | `/api/v1/bookings` | student | `{facility_id, start}` (ISO datetime **with** UTC offset); 409 `SLOT_TAKEN` if someone else holds it |
| GET | `/api/v1/bookings/me?scope=upcoming\|history` | any user | own bookings, facility and sport joined in |
| GET | `/api/v1/bookings/{id}` | owner or admin | someone else's booking is a 404 |
| POST | `/api/v1/bookings/{id}/cancel` | owner or admin | optional `{reason}`; students until the cut-off, admins until the booking ends |

**Notifications** (any logged-in user)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/notifications/me?unread_only=` | newest first |
| GET | `/api/v1/notifications/me/unread-count` | `{count}` |
| POST | `/api/v1/notifications/{id}/read`, `/api/v1/notifications/read-all` | |

**Admin** (all require an admin token)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/bookings` | filters: `status`, `facility_id`, `sport_id`, `user_id`, `q` (student name/email), `date_from`, `date_to`; paging with `total` |
| GET | `/api/v1/admin/users` | filters: `q`, `role`, `is_active`; paging with `total` |
| PATCH | `/api/v1/admin/users/{id}` | `{is_active?, role?, cancel_upcoming_bookings?}`; you cannot change yourself |
| GET | `/api/v1/admin/analytics/summary` | dashboard cards |
| GET | `/api/v1/admin/analytics/popular-sports`, `busiest-facilities`, `peak-hours`, `bookings-over-time?granularity=day\|week\|month`, `cancellations`, `utilization` | all take `date_from` / `date_to` (inclusive, campus-local; default last 30 days) |

Cancelling someone's booking as an admin uses the same `POST /api/v1/bookings/{id}/cancel` and notifies the student.

Booking rules (configurable in `backend/.env`): bookable up to 14 days ahead, students can cancel until
60 minutes before the start, at most 5 upcoming bookings per student.

Errors always look like `{"error": {"code": "...", "message": "...", "details": [...]}}`.
In Swagger UI (`/docs`) use the **Authorize** button; it logs in through the same endpoint.

## Layout
```
backend/    FastAPI app (app/), CLI scripts (scripts/: admin, seeds, explain), tests (tests/)
frontend/   Next.js app (generated, see above)
docs/       DECISIONS.md, DATA_MODEL.md, FRONTEND.md, DESIGN_BRIEF.md, DESIGN_NOTES.md
design/     Google Stitch exports (reference for the screens)
```

## Conventions
- One git repo at the root. Real secrets live only in untracked `.env` files.
- Tests run against a separate database (`campus_sports_test`), never the dev one.
- Docs describe what the code does today; planned work is marked "Proposed".

## Useful commands
- `make seed-demo` - demo students (`demo.student1@campus.edu`, password `demo-password-123`) and ~6 weeks of bookings
- `make explain` - shows which index MongoDB uses for each key query (run after the seeds)
