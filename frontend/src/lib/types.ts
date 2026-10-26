/** TypeScript mirror of the backend's JSON. Keep in sync with backend/app/models/*. */

export type Role = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  student_id: string | null;
  is_active: boolean;
  created_at: string;
}
export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

// ---- sports & facilities
export type AttrType = "string" | "number" | "boolean" | "enum";
export interface AttributeDef {
  key: string;
  label: string;
  type: AttrType;
  required: boolean;
  options?: string[] | null;
}
export type SportCategory = "team" | "racquet" | "aquatic" | "fitness" | "individual" | "other";
export interface Sport {
  id: string;
  name: string;
  category: SportCategory;
  description: string | null;
  attributes: AttributeDef[];
  created_at: string;
  updated_at: string;
}
export interface SportSummary {
  id: string;
  name: string;
  category: string;
}

export type FacilityStatus = "active" | "maintenance" | "inactive";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export interface TimeWindow {
  open: string; // "HH:MM", campus-local
  close: string;
}
export type OperatingHours = Record<Weekday, TimeWindow[]>;
export type MetadataValue = string | number | boolean;
export interface FacilityAvailability {
  open_slots_today: number;
  next_slot: { start: string; end: string } | null;
}
export interface Facility {
  id: string;
  name: string;
  sport: SportSummary;
  location: string;
  slot_minutes: number;
  operating_hours: OperatingHours;
  status: FacilityStatus;
  metadata: Record<string, MetadataValue>;
  created_at: string;
  updated_at: string;
  /** only present when requested with `with_availability` (and the facility is active) */
  availability?: FacilityAvailability | null;
}

export interface Rules {
  booking_window_days: number;
  cancellation_cutoff_minutes: number;
  max_active_bookings: number;
  campus_timezone: string;
}

// ---- slots & bookings
export type SlotStatus = "available" | "booked" | "past" | "unavailable";
export interface Slot {
  start: string; // ISO, UTC
  end: string;
  status: SlotStatus;
  booked_by_me: boolean;
}
export interface SlotsResponse {
  facility_id: string;
  date: string;
  timezone: string;
  slot_minutes: number;
  facility_status: string;
  slots: Slot[];
}

export type BookingStatus = "confirmed" | "cancelled";
export interface Booking {
  id: string;
  status: BookingStatus;
  start: string;
  end: string;
  user_id: string;
  facility: { id: string; name: string; location: string };
  sport: { id: string; name: string };
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: "student" | "admin" | null;
  cancel_reason: string | null;
  can_cancel: boolean;
}
export interface UserRef {
  id: string;
  name: string;
  email: string;
  student_id: string | null;
}
export interface AdminBooking extends Booking {
  user: UserRef;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  skip: number;
}

export type NotificationType = "booking_confirmed" | "booking_cancelled_by_admin";
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  booking_id: string | null;
  read: boolean;
  created_at: string;
}

// ---- analytics
export interface DateRangeOut {
  date_from: string;
  date_to: string;
  timezone: string;
}
export interface Ranged<T> {
  range: DateRangeOut;
  items: T[];
}
export interface SportCount {
  sport_id: string;
  name: string;
  bookings: number;
  share: number;
}
export interface FacilityCount {
  facility_id: string;
  name: string;
  sport_name: string;
  bookings: number;
}
export interface HourCount {
  hour: number;
  bookings: number;
}
export interface PeriodCount {
  period: string;
  bookings: number;
}
export interface FacilityUtilization {
  facility_id: string;
  name: string;
  sport_name: string;
  booked: number;
  capacity: number;
  utilization: number;
}
export interface CancellationStats {
  range: DateRangeOut;
  total: number;
  confirmed: number;
  cancelled: number;
  cancellation_rate: number;
  cancelled_by_student: number;
  cancelled_by_admin: number;
}
export interface Summary {
  range: DateRangeOut;
  total_bookings: number;
  confirmed: number;
  cancelled: number;
  cancellation_rate: number;
  unique_students: number;
  most_popular_sport: { sport_id: string; name: string; bookings: number } | null;
  peak_hour: { hour: number; bookings: number } | null;
  active_facilities: number;
  total_facilities: number;
  todays_bookings: number;
  upcoming_bookings: number;
}

export interface UserAdminOut extends User {
  cancelled_bookings: number;
}
