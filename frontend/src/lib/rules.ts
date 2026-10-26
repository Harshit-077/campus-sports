"use client";

import { useQuery } from "@tanstack/react-query";

import { rulesApi } from "./services";
import type { Rules } from "./types";

/** Used until the real rules arrive (or if the request fails). They match the backend defaults. */
export const DEFAULT_RULES: Rules = {
  booking_window_days: 14,
  cancellation_cutoff_minutes: 60,
  max_active_bookings: 5,
  campus_timezone: "Asia/Kolkata",
};

export function useRules(): Rules {
  const { data } = useQuery({ queryKey: ["rules"], queryFn: rulesApi.get, staleTime: Infinity });
  return data ?? DEFAULT_RULES;
}
