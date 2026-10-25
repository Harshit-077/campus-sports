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
