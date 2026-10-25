/** One typed function per backend endpoint. Screens call these; they never call fetch directly. */
import { api } from "./api";
import type {
  AdminBooking,
  AppNotification,
  Booking,
  BookingStatus,
  CancellationStats,
  Facility,
  FacilityCount,
  FacilityStatus,
  FacilityUtilization,
  HourCount,
  MetadataValue,
  OperatingHours,
  Page,
  PeriodCount,
  Ranged,
  Role,
  Sport,
  SportCategory,
  SportCount,
  SlotsResponse,
  Summary,
  TokenResponse,
  User,
  UserAdminOut,
  AttributeDef,
} from "./types";

// ------------------------------------------------------------------ auth
export const authApi = {
  register: (body: { name: string; email: string; password: string; student_id?: string }) =>
    api<User>("/auth/register", { method: "POST", json: body, auth: false }),
  /** The backend uses the OAuth2 password form: `username` carries the email. */
  login: (email: string, password: string) =>
    api<TokenResponse>("/auth/login", {
      method: "POST",
      form: { username: email, password },
      auth: false,
    }),
  me: () => api<User>("/auth/me"),
};

// --------------------------------------------------------- sports & facilities
export interface SportInput {
  name: string;
  category: SportCategory;
  description?: string | null;
  attributes: AttributeDef[];
}
export interface FacilityInput {
  name: string;
  sport_id: string;
  location: string;
  slot_minutes?: number;
  operating_hours?: OperatingHours;
  status?: FacilityStatus;
  metadata?: Record<string, MetadataValue>;
}
export interface FacilityQuery {
  sport_id?: string;
  q?: string;
  include_inactive?: boolean;
  /** sport-specific attribute filters, e.g. { surface: "wooden", air_conditioning: true } */
  meta?: Record<string, MetadataValue>;
}

export const catalogApi = {
  sports: () => api<Sport[]>("/sports", { auth: false }),
  sport: (id: string) => api<Sport>(`/sports/${id}`, { auth: false }),
  createSport: (body: SportInput) => api<Sport>("/sports", { method: "POST", json: body }),
  updateSport: (id: string, body: Partial<SportInput>) =>
    api<Sport>(`/sports/${id}`, { method: "PATCH", json: body }),
  deleteSport: (id: string) => api<void>(`/sports/${id}`, { method: "DELETE" }),

  facilities: ({ meta, ...rest }: FacilityQuery = {}) => {
    const query: Record<string, string | number | boolean> = {};
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined) query[k] = v;
    });
    Object.entries(meta ?? {}).forEach(([k, v]) => (query[`meta.${k}`] = v));
    return api<Facility[]>("/facilities", { query });
  },
  facility: (id: string) => api<Facility>(`/facilities/${id}`, { auth: false }),
  createFacility: (body: FacilityInput) => api<Facility>("/facilities", { method: "POST", json: body }),
  updateFacility: (id: string, body: Partial<FacilityInput>) =>
    api<Facility>(`/facilities/${id}`, { method: "PATCH", json: body }),
  /** date = campus-local "YYYY-MM-DD" */
  slots: (facilityId: string, date: string) =>
    api<SlotsResponse>(`/facilities/${facilityId}/slots`, { query: { date } }),
};

// -------------------------------------------------------------------- bookings
export const bookingApi = {
  /** `start` must be an ISO datetime WITH offset, e.g. a slot's `start` straight from the API. */
  create: (facilityId: string, start: string) =>
    api<Booking>("/bookings", { method: "POST", json: { facility_id: facilityId, start } }),
  mine: (scope: "upcoming" | "history", page: { limit?: number; skip?: number } = {}) =>
    api<Booking[]>("/bookings/me", { query: { scope, ...page } }),
  get: (id: string) => api<Booking>(`/bookings/${id}`),
  cancel: (id: string, reason?: string) =>
    api<Booking>(`/bookings/${id}/cancel`, { method: "POST", json: reason ? { reason } : undefined }),
};

// --------------------------------------------------------------- notifications
export const notificationApi = {
  list: (params: { unread_only?: boolean; limit?: number; skip?: number } = {}) =>
    api<AppNotification[]>("/notifications/me", { query: params }),
  unreadCount: () => api<{ count: number }>("/notifications/me/unread-count"),
  markRead: (id: string) => api<AppNotification>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => api<{ updated: number }>("/notifications/read-all", { method: "POST" }),
};

// ----------------------------------------------------------------------- admin
export interface DateRangeParams {
  date_from?: string; // campus-local YYYY-MM-DD, inclusive
  date_to?: string;
}

export const adminApi = {
  bookings: (params: {
    status?: BookingStatus;
    facility_id?: string;
    sport_id?: string;
    user_id?: string;
    q?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    skip?: number;
  } = {}) => api<Page<AdminBooking>>("/admin/bookings", { query: params }),

  users: (params: { q?: string; role?: Role; is_active?: boolean; limit?: number; skip?: number } = {}) =>
    api<Page<User>>("/admin/users", { query: params }),
  updateUser: (
    id: string,
    body: { is_active?: boolean; role?: Role; cancel_upcoming_bookings?: boolean },
  ) => api<UserAdminOut>(`/admin/users/${id}`, { method: "PATCH", json: body }),

  analytics: {
    summary: (r: DateRangeParams = {}) => api<Summary>("/admin/analytics/summary", { query: { ...r } }),
    popularSports: (r: DateRangeParams = {}) =>
      api<Ranged<SportCount>>("/admin/analytics/popular-sports", { query: { ...r } }),
    busiestFacilities: (r: DateRangeParams & { limit?: number } = {}) =>
      api<Ranged<FacilityCount>>("/admin/analytics/busiest-facilities", { query: { ...r } }),
    peakHours: (r: DateRangeParams = {}) =>
      api<Ranged<HourCount>>("/admin/analytics/peak-hours", { query: { ...r } }),
    bookingsOverTime: (r: DateRangeParams & { granularity?: "day" | "week" | "month" } = {}) =>
      api<Ranged<PeriodCount>>("/admin/analytics/bookings-over-time", { query: { ...r } }),
    cancellations: (r: DateRangeParams = {}) =>
      api<CancellationStats>("/admin/analytics/cancellations", { query: { ...r } }),
    utilization: (r: DateRangeParams = {}) =>
      api<Ranged<FacilityUtilization>>("/admin/analytics/utilization", { query: { ...r } }),
  },
};
