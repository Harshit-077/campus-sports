import { CAMPUS_TIMEZONE } from "./config";

const inCampus = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  timeZone: CAMPUS_TIMEZONE,
  ...options,
});

/** "Tue, 03 Nov" */
export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("en-IN", inCampus({ weekday: "short", day: "2-digit", month: "short" })).format(
    new Date(iso),
  );

/** "10:00" (24-hour) */
export const formatTime = (iso: string): string =>
  new Intl.DateTimeFormat("en-IN", inCampus({ hour: "2-digit", minute: "2-digit", hour12: false })).format(
    new Date(iso),
  );

/** "Tue, 03 Nov, 10:00-11:00" */
export const formatRange = (start: string, end: string): string =>
  `${formatDate(start)}, ${formatTime(start)}-${formatTime(end)}`;

/** 17 -> "17:00" */
export const formatHour = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;

/** Today's date in the campus timezone as "YYYY-MM-DD". */
export const todayInCampus = (): string =>
  new Intl.DateTimeFormat("en-CA", inCampus({ year: "numeric", month: "2-digit", day: "2-digit" })).format(
    new Date(),
  );

/** Adds days to a "YYYY-MM-DD" date (calendar arithmetic, no timezone involved). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0.0164 -> "1.6%" */
export const formatPercent = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;

/** Whole minutes from `nowMs` until `iso` (negative once it has started). */
export const minutesUntil = (iso: string, nowMs: number): number =>
  Math.floor((new Date(iso).getTime() - nowMs) / 60_000);

/** "Starts in 25 min", "Starts in 3h 15m", "In progress", or null when it is a day or more away. */
export function startsInLabel(iso: string, nowMs: number): string | null {
  const minutes = minutesUntil(iso, nowMs);
  if (minutes < 0) return "In progress";
  if (minutes < 60) return `Starts in ${minutes} min`;
  if (minutes < 24 * 60) return `Starts in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return null;
}

/** "Today", "Tomorrow" or "Tue, 03 Nov" for a slot's start instant. */
export function dayLabel(iso: string): string {
  const day = new Intl.DateTimeFormat("en-CA", inCampus({ year: "numeric", month: "2-digit", day: "2-digit" })).format(
    new Date(iso),
  );
  const today = todayInCampus();
  if (day === today) return "Today";
  if (day === addDays(today, 1)) return "Tomorrow";
  return formatDate(iso);
}

/** The campus-local "YYYY-MM-DD" of an instant. */
export const campusDateOf = (iso: string): string =>
  new Intl.DateTimeFormat("en-CA", inCampus({ year: "numeric", month: "2-digit", day: "2-digit" })).format(
    new Date(iso),
  );

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
/** Weekday key ("mon"...) of a "YYYY-MM-DD" date. */
export const weekdayOf = (isoDate: string): (typeof WEEKDAYS)[number] =>
  WEEKDAYS[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];

/** "Mon", "03" parts for the date strip. */
export function dateParts(isoDate: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...o }).format(d);
  return { weekday: fmt({ weekday: "short" }), day: fmt({ day: "2-digit" }), month: fmt({ month: "short" }) };
}

/** "5 min ago", "3 hours ago", "2 days ago" */
export function timeAgo(iso: string, nowMs: number): string {
  const seconds = Math.round((new Date(iso).getTime() - nowMs) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

/** Human description of a weekday's hours: "06:00 - 21:00" or null when closed. */
export const describeWindows = (windows: { open: string; close: string }[]): string | null =>
  windows.length ? windows.map((w) => `${w.open} - ${w.close}`).join(", ") : null;

/** True when two ISO strings are the same instant (they may use "Z" or "+00:00"). */
export const sameInstant = (a: string, b: string): boolean => new Date(a).getTime() === new Date(b).getTime();

/** "Tue, 03 Nov" for a campus-local "YYYY-MM-DD" date (no timezone maths involved). */
export const formatDay = (isoDate: string): string =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
