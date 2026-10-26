# Frontend guide

Next.js (App Router) + TypeScript + Tailwind CSS v4 + TanStack Query. It talks to the FastAPI
backend over the REST API only.

## Setup
```bash
# generated once with create-next-app (see README), then:
cd frontend
npm install @tanstack/react-query lucide-react
cp .env.local.example .env.local      # API URL + campus timezone
npm run dev                           # http://localhost:3000  (backend on :8000, CORS already allows it)
```

## Structure
```
src/app/
  layout.tsx, providers.tsx          fonts, QueryClient, AuthProvider
  page.tsx                           landing (placeholder until the Stitch design is converted)
  login/, register/                  working forms
  (student)/                         layout = RequireAuth(student) + AppShell
    dashboard/ sports/ facilities/ facilities/[id]/ bookings/ notifications/ profile/
  (admin)/admin/                     layout = RequireAuth(admin) + AppShell
    page.tsx (overview) sports/ facilities/ bookings/ users/ analytics/
src/components/
  ui/            Button, Field, Card, Badge, Modal (native <dialog>), Tabs, Spinner/Skeleton/ErrorState/EmptyState
  booking/       DateStrip, SlotGrid (+legend), BookingSummary, ConfirmDialog
  facility-card, booking-card, notice (inline edge-state banners), status-pill
  app-shell.tsx  top bar, navigation, notification bell     require-auth.tsx  route guard
src/lib/
  config.ts      API URL, campus timezone          types.ts     TypeScript mirror of the API JSON
  api.ts         fetch wrapper + ApiError          services.ts  one typed function per endpoint
  auth.tsx       AuthProvider / useAuth            token-store.ts  where the token lives
  format.ts      dates in the campus timezone      cn.ts        class-name helper
  rules.ts       useRules() from GET /rules        hooks.ts     useDebounced, useNow
  quick-book.ts  soonest-open facility + link     humanize.ts  metadata keys -> labels/chips
```
Route groups `(student)` and `(admin)` do not appear in URLs: `/dashboard`, `/admin/users`, ...
Student screens are built (step 7). Admin screens are placeholders (`ComingSoon`) until step 8.

## How things work
**Login.** `POST /auth/login` (form-encoded) returns a JWT plus the user. The token goes to
`localStorage` through `token-store.ts`; `AuthProvider` reads it with `useSyncExternalStore` and loads
the profile with `GET /auth/me`. Every `api()` call adds `Authorization: Bearer ...`. A 401 on an
authenticated call clears the token, which sends the user back to `/login`.

**Route protection.** `RequireAuth` redirects visitors who are not logged in to
`/login?next=<page>` and sends a student who opens an admin page (or the reverse) to their own home.
This is only about usability: the backend rejects every request that lacks the right role.

**Errors.** The backend always answers errors as `{"error": {"code", "message", "details?"}}`.
`api()` turns that into an `ApiError`; `err.fieldErrors()` gives a field -> message map for forms.

**Time.** The API sends UTC instants. `lib/format.ts` always renders them in the campus timezone
(`NEXT_PUBLIC_CAMPUS_TIMEZONE`), whatever the visitor's computer says. When booking, send a slot's
`start` exactly as the API returned it.

**Data fetching.** `useQuery({ queryKey, queryFn: () => bookingApi.mine("upcoming") })`. Never call
`fetch` in a component. After a mutation, invalidate the affected keys
(`queryClient.invalidateQueries({ queryKey: ["bookings"] })`).

## Turning a Stitch screen into a component
1. Use the tokens, not the exported hex codes. They carry Stitch's names: `bg-surface-container-lowest`,
   `text-on-surface`, `bg-primary-container`, `bg-secondary-container` (the orange CTA), `text-headline-md`,
   `font-display` (Sora). See `globals.css` and `docs/DESIGN_NOTES.md`.
2. Reuse `components/ui/*` before adding markup; add a new primitive only if two screens need it.
3. Split the page: a thin `page.tsx` (data fetching) + presentational components.
4. Wire the data through `lib/services.ts`, and cover loading, error and empty states.
5. Check keyboard focus, labels on inputs, and contrast.

## Checklist for steps 6 and 7
- `/` shows the landing page; **Create an account** registers and lands on `/dashboard`.
- Log out, then log in again; a wrong password shows the backend's message.
- Opening `/dashboard` while logged out goes to `/login?next=/dashboard` and returns after login.
- Logged in as the admin (`make create-admin`): `/admin` shows the four cards from the analytics API.
- A student opening `/admin` is redirected to `/dashboard`.
- `npm run build` and `npm run lint` pass.
- `/facilities`: sport pills show counts; picking Badminton reveals Surface / Air conditioning filters; the
  search box filters by name or location; **Quick book** opens the soonest free slot.
- `/facilities/<id>`: pick a date and a slot, **Book this slot**, confirm; the slot turns into "Your booking".
  Booking the same slot as another student shows the "Slot conflict" banner.
- `/bookings`: upcoming and history tabs; cancelling inside the cut-off is disabled with the reason shown.
- The bell in the top bar counts unread notifications; `/notifications` lists them.
