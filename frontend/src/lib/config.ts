export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const API_PREFIX = "/api/v1";

/** Times are always shown in the campus timezone, whatever the visitor's browser says. */
export const CAMPUS_TIMEZONE = process.env.NEXT_PUBLIC_CAMPUS_TIMEZONE ?? "Asia/Kolkata";
