# Design notes: how the Stitch designs became screens

Source: `design/stitch/`. The design system (`field_court/DESIGN.md`) matches the palette and fonts
in `docs/DESIGN_BRIEF.md`; its colour roles and type scale are in `frontend/src/app/globals.css`
under Stitch's own names (`bg-surface-container-lowest`, `text-on-surface`, `text-headline-md`, ...).

## Screens built (step 7)
| Screen | Route | Built from |
|--------|-------|-----------|
| Facilities | `/facilities` | `06_facilities_directory` |
| Facility details, slot picker, booking dialog | `/facilities/[id]` | `07_facility_details_slot_picker` |
| My bookings | `/bookings` | `09_my_bookings` |
| Dashboard | `/dashboard` | `student_dashboard` |
| Sports, notifications, profile | `/sports`, `/notifications`, `/profile` | no design supplied: built from the design system and the brief |
| Login, register, landing | `/login`, `/register`, `/` | functional versions from step 6, restyled by the shared tokens; the landing page still needs a design |

`facility_slot_picker` and `slot_pick` are byte-identical to each other and an earlier take on the slot
picker; they are not used. `admin_*` designs are for step 8.

## What was left out on purpose
The designs contain features this system does not have. Building them would show invented data, so
they are not built:

| In the design | Why not | What the screen shows instead |
|---------------|---------|-------------------------------|
| Gate pass, QR code, "Token #TK-..." (dashboard, my bookings) | no entry system | cancel / manage actions |
| "Rank #12", "Played this month", "Verified student, B.Tech Year 3" | no such data | student ID and upcoming-bookings count |
| "Equipment lockers", "21 C indoor", "Facility rule" strip | no such data | removed |
| Court ID "#BC-01", capacity "4 players", access fee, equipment hire, court blueprint | not in the data model | sport name, slot length, the facility's own attributes |
| "Invite partner", "Share timetable", "Add peer" | no social features | removed |
| "Peak demand hours" badge, "Instant confirm" | not tracked | removed |
| Per-day "9 open" counts on the date strip | would need one request per day | "Closed" days (from opening hours) and the month |
| "Directory map", grid/list toggle, "Academic term" | out of scope | removed |

## What the designs needed that the backend gained
- `GET /facilities?with_availability=true`: open slots left today and the next free slot, per facility
  (the "Next slot" tile, "N open slots today", **Quick book**, and the dashboard's "Book in 30 seconds").
- `GET /rules`: booking window, cancellation cut-off and booking cap, so every message ("cancel until
  60 minutes before", "2 / 5 bookings") shows the real configured numbers.

## Edge states from the designs, and where they appear
Slot conflict (409 `SLOT_TAKEN` -> warning banner, grid refreshed), closed day (with "Jump to next open
day"), maintenance (banner, striped slots, disabled booking), booking limit reached (banner, disabled
button), loading skeletons and empty states on every list.
