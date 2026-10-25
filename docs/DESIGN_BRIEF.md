# Design brief for Google Stitch

How to use this file: open Stitch, paste the **master style prompt** first, then generate the
screens one by one with their prompts (recommended order is at the end). Each prompt says what the
screen must show, using the real data the backend provides, so the designs convert cleanly into
working screens.

Stitch changes often; check which export options your version offers (screenshot, HTML/CSS, Figma).
Save results in `design/stitch/` (see `design/README.md`).

---

## 1. Master style prompt (paste first, reuse for every screen)

```text
Design a responsive web app called "Campus Sports": a booking platform for university sports
facilities (badminton courts, football fields, basketball courts, a swimming pool).

Two audiences:
- Students, mostly on phones, who want to book a facility in under 30 seconds.
- Administrators, on laptops, who manage facilities and bookings and read analytics.

Visual style: clean, modern, sporty but calm. Generous whitespace. Rounded corners (12-16px).
Thin 1px borders instead of heavy shadows. No stock photos. No gradients on interface elements.

Colour palette (use exactly these):
- Deep court green #14382B: primary (top bar, primary buttons, dark hero sections)
- Orange #FF6B35: accent, ONLY for the main call to action (at most one per screen)
- Sage #DCE5DE: soft fills and chips
- Sage soft #F1F5F2: page background
- Ink #1A2420: text.  Muted #5B6B63: secondary text.  Line #D7DFD9: borders.
- Success #1F7A4D, Warning #9A6700, Danger #B42318

Typography: Sora (semi-bold) for headings and big numbers; Inter for everything else.
Body text 14-16px. Tap targets at least 44px high.

Icons: simple 1.75px line icons (Lucide style).

Time slot states (reused on several screens):
- Available: white with a green border
- Selected: solid orange with white text
- Booked: grey fill
- Past: light grey text, no border
- Unavailable (maintenance): diagonal grey stripes
- Booked by me: green fill with a check mark

Navigation:
- Students: top bar with logo "Campus Sports", links (Dashboard, Sports, Facilities, My bookings),
  a notification bell with an orange unread badge, the user's name and a "Log out" button.
  On mobile, a bottom tab bar with the same four links.
- Admins: the same top bar with a small orange "Admin" tag and links
  (Overview, Sports, Facilities, Bookings, Users, Analytics).

Accessibility: WCAG AA contrast, visible orange focus rings, labels on every input.
Copy: short, friendly, plain English. Times in 24-hour format like 17:00-18:00.
Use realistic sample data, never lorem ipsum (for example "Badminton Court 1, Sports Complex
Block A", "Tue 03 Nov, 10:00-11:00", student "Asha Verma").
Design every screen at desktop width (1440px) and mobile width (390px) unless told otherwise.
```

---

## 2. Screens, routes and data

| # | Screen | Route | API it uses |
|---|--------|-------|-------------|
| 01 | Landing | `/` | none |
| 02 | Login | `/login` | `POST /auth/login` |
| 03 | Register | `/register` | `POST /auth/register` |
| 04 | Student dashboard | `/dashboard` | `GET /bookings/me?scope=upcoming`, `GET /notifications/me` |
| 05 | Sports | `/sports` | `GET /sports` |
| 06 | Facilities | `/facilities` | `GET /facilities` (filters: `sport_id`, `q`, `meta.<attr>`) |
| 07 | Facility details and slot picker | `/facilities/[id]` | `GET /facilities/{id}`, `GET /facilities/{id}/slots?date=` |
| 08 | Booking confirmation | dialog on 07 | `POST /bookings` |
| 09 | My bookings | `/bookings` | `GET /bookings/me?scope=`, `POST /bookings/{id}/cancel` |
| 10 | Notifications | `/notifications` | `GET /notifications/me`, `POST /notifications/read-all` |
| 11 | Profile | `/profile` | `GET /auth/me` |
| 12 | Admin overview | `/admin` | `GET /admin/analytics/summary`, `GET /admin/bookings` |
| 13 | Admin analytics | `/admin/analytics` | all `/admin/analytics/*` |
| 14 | Admin sports | `/admin/sports` | `/sports` (create, update, delete) |
| 15 | Admin facilities | `/admin/facilities` | `/facilities` (create, update), `/sports` |
| 16 | Admin bookings | `/admin/bookings` | `GET /admin/bookings`, `POST /bookings/{id}/cancel` |
| 17 | Admin users | `/admin/users` | `GET /admin/users`, `PATCH /admin/users/{id}` |

The core booking flow (design 05 -> 06 -> 07 -> 08 as one smooth path):
`Choose sport -> Choose facility -> Choose date -> See slots -> Select slot -> Confirm -> Booked`.

---

## 3. Screen prompts

Paste the master style prompt first, then one of these.

### 01 Landing
```text
Landing page for Campus Sports (desktop + mobile).
- Top bar: logo left; "Log in" text link and "Create an account" button right.
- Hero on a deep green background: headline "Book campus sports facilities without the guesswork.",
  one supporting sentence about real-time availability, an orange primary button "Create an
  account" and an outlined secondary button "Log in".
- "How it works" with three numbered steps: Choose a sport / Pick a time / Show up and play.
- A row of sport cards (Badminton, Football, Basketball, Swimming) each with a line icon and name.
- A short band "No double bookings: a slot can only be held by one person at a time."
- Simple footer.
```

### 02 Login
```text
Login screen. Split layout on desktop: left a deep green panel with the logo and the line
"Your next game is one booking away."; right a centered form (max 380px wide): title "Welcome back",
Email, Password, full-width orange "Log in" button, and "New here? Create an account" link.
Also show these states: error banner "Incorrect email or password", and the button in a loading state.
On mobile hide the green panel and show the logo above the form.
```

### 03 Register
```text
Register screen, same layout as login. Title "Create your account". Fields: Full name, Email,
Password (hint: "At least 8 characters."), Student ID (optional). Full-width orange "Create account"
button and "Already registered? Log in". Show an inline field error under Email:
"An account with this email already exists."
```

### 04 Student dashboard
```text
Student dashboard (logged in as Asha Verma). Student top bar and, on mobile, bottom tab bar.
- Greeting "Hi Asha".
- Highlighted "Next booking" card: sport badge "Badminton", facility "Badminton Court 1",
  "Tue 03 Nov, 10:00-11:00", location "Sports Complex, Block A", and a secondary "Cancel" button.
- "Upcoming bookings" list of up to 3 compact cards.
- Primary orange button "Book a facility" and a secondary "Browse sports".
- "Recent notifications" with 3 items (icon, title, message, relative time, unread dot).
- Include the empty state: "Nothing booked yet" with a "Find a facility" link.
```

### 05 Sports
```text
"Sports" page: a responsive grid of sport cards (4 sports). Each card: line icon, name, category
badge (Team / Racquet / Aquatic), one-line description, "3 facilities" count and a
"View facilities" button. Include a loading skeleton state and an empty state.
```

### 06 Facilities
```text
"Facilities" page.
- Filter bar: sport chips (All, Badminton, Football, Basketball, Swimming) and a search box
  ("Search by name or location").
- When a sport chip is selected, extra filters for that sport appear. Example for Badminton:
  "Surface" dropdown (Wooden / Synthetic) and an "Air conditioning" switch. Show this state.
- Grid of facility cards: name, sport badge, location, 3 attribute chips from the facility's
  details (for example "Wooden", "Air-conditioned", "LED lighting"), a status badge only when the
  facility is "Under maintenance", and a "View slots" button.
- Loading skeletons, and an empty state "No facilities match your filters" with "Clear filters".
```

### 07 Facility details and slot picker (most important screen)
```text
Facility details with slot picker for "Badminton Court 1".
- Header: facility name, sport badge, location, status.
- "Details" chips from the facility's attributes (label + value pairs: Surface: Wooden,
  Air conditioning: Yes, Lighting: LED).
- Collapsible "Opening hours" table: Mon-Fri 06:00-21:00, Sat-Sun closed.
- Date strip: a horizontally scrollable row of the next 15 days (weekday, day number, "Today"
  highlighted, selected day in green).
- Slot grid for the selected day: 15 one-hour slots (06:00-07:00 ... 20:00-21:00) using the slot
  states from the style prompt. Show a realistic mix: some past, some booked, one booked by me,
  one selected.
- Summary panel: on desktop a sticky right column, on mobile a bottom sheet. Shows the selected
  slot ("Tue 03 Nov, 10:00-11:00") and an orange "Book this slot" button.
- Also design these states: closed day ("Closed on Saturdays"), maintenance banner ("Under
  maintenance, booking is paused"), toast "That slot was just booked by someone else. Pick another.",
  message "You already have 5 upcoming bookings" (booking limit reached).
```

### 08 Booking confirmation
```text
Booking confirmation dialog (centered modal on desktop, bottom sheet on mobile).
Step 1: summary card (facility, sport, date, time, location), the note "You can cancel until 60
minutes before the start", buttons "Confirm booking" (orange) and "Back".
Step 2 (success): large green check, "You are booked!", the same summary, buttons
"View my bookings" and "Book another".
```

### 09 My bookings
```text
"My bookings" page with tabs "Upcoming" and "History".
Booking cards: facility, sport badge, date and time, location, and a status chip:
Confirmed (green), "Cancelled by you" (grey), "Cancelled by admin" (red, with the reason
"Court flooded" below).
Upcoming cards have a "Cancel" button. Show one card where cancelling is no longer allowed:
disabled button with the hint "Cancellation closed: starts in 30 min".
Cancel dialog: "Cancel this booking?", optional reason field, "Keep booking" and a red
"Cancel booking" button.
History tab: list with a "Load more" button. Include empty states for both tabs.
```

### 10 Notifications
```text
Notifications: (a) a full page listing notifications with an icon per type (confirmed = green
check, cancelled by admin = red alert), title, message ("Badminton Court 1 on Tue 03 Nov,
10:00-11:00. Reason: Court flooded."), relative time and an unread dot, plus a "Mark all as read"
button; (b) the dropdown that opens from the top bar bell showing the latest 5. Include the empty
state "You are all caught up".
```

### 11 Profile
```text
Profile page: a card with avatar initials, name, email, student ID and a "Student" role badge,
and a "Log out" button. Keep it minimal.
```

### 12 Admin overview
```text
Admin overview (admin top bar with the "Admin" tag).
- Four stat cards: "Available facilities 12 / 14", "Bookings today 18" (note: "46 upcoming in
  total"), "Peak hour 18:00", "Most popular sport Badminton".
- A line: "Last 30 days - cancellation rate 9.8%".
- "Recent bookings" table (5 rows): Student, Facility, Date and time, Status.
- Quick links: "Manage facilities", "View all bookings", "Open analytics".
```

### 13 Admin analytics
```text
Analytics dashboard.
- Header with a date range control (presets Last 7 days / Last 30 days / Last 90 days / Custom).
- KPI row: Total bookings, Cancellation rate (with a small split "62% by students, 38% by admins"),
  Unique students.
- Chart "Bookings over time": line or area chart with a Day / Week / Month toggle.
- Chart "Popular sports": donut or horizontal bars with percentages.
- Chart "Peak hours": 24 column bars (00-23), the busiest bar highlighted in orange.
- "Busiest facilities": ranked horizontal bars, top 5, showing sport name under each facility.
- "Facility utilization" table: Facility, Sport, Booked / Capacity (for example 38 / 120),
  progress bar with percentage.
Use the palette for charts: green shades first, orange only to highlight.
```

### 14 Admin sports
```text
Admin "Sports" page. Table: Name, Category, Number of attributes, Description, row actions
(Edit, Delete). "New sport" button opens a right-side drawer form: Name, Category select, Description,
and an "Attributes" builder where each row has Label, Type (Text / Number / Yes-No / Choice),
a Required switch, and, for Choice, an options chips input; "Add attribute" and a remove icon per
row. Show an example for Badminton: Surface (Choice: Wooden, Synthetic, required), Air
conditioning (Yes-No), Lighting (Choice: LED, Fluorescent).
Also a delete confirmation with the error "Cannot delete a sport that still has facilities."
```

### 15 Admin facilities
```text
Admin "Facilities" page. Filters: sport select, status select (Active / Maintenance / Inactive).
Table: Name, Sport, Location, Status badge, Slot length, Edit action.
"New facility" opens a wide right-side drawer form:
- Name, Sport select, Location, Slot length select (30 / 45 / 60 / 90 / 120 minutes), Status.
- "Details" section whose fields come from the selected sport's attributes (Choice -> select,
  Yes-No -> switch, Number -> number input, Text -> text input; required ones marked).
- "Opening hours" editor: seven rows Monday to Sunday, each with a "Closed" switch or one or more
  time windows (open time, close time, "Add window"), and a "Copy to all weekdays" helper.
- Inline validation list, for example "Monday: window is shorter than one slot".
```

### 16 Admin bookings
```text
Admin "Bookings" page. Filter bar: status, sport, facility, date range, and a search box
("Student name or email"). Table columns: Student (name + email), Facility, Sport, Date, Time,
Status chip, Booked on, and a "Cancel" action for confirmed bookings. Pagination showing
"1-50 of 312". Cancel dialog: warning "The student will be notified.", optional reason field,
"Keep booking" and red "Cancel booking" buttons.
```

### 17 Admin users
```text
Admin "Users" page. Search box ("Name, email or student ID"), role filter, status filter.
Table: Name, Email, Student ID, Role badge, Status badge (Active / Disabled), Joined, row actions
(Disable or Enable, Make admin or Make student). The "Disable" dialog has the checkbox "Also
cancel their upcoming bookings". The signed-in admin's own row has its actions disabled with the
tooltip "You can't change your own account."
```

---

## 4. Suggested order and tips

1. Master style prompt, then **07** (the hardest screen sets the visual language).
2. **06**, **09**, **04**, then **02/03**, **01**, then **08/10/11**.
3. Admin: **12**, **16**, **13**, **14**, **15**, **17**.
4. If a generated screen drifts from the palette or fonts, correct it with a short follow-up
   ("Use only the specified palette; headings in Sora") instead of regenerating from scratch.
5. When a screen looks right, save a screenshot (and the exported code if offered) in
   `design/stitch/NN-name/`, then tell me which folders are ready. I convert them into components in
   steps 7 and 8 using the design tokens already in `frontend/src/app/globals.css`.
