"use client";

import { useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
  Users,
  Calendar,
  Clock,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { adminApi, bookingApi } from "@/lib/services";
import { formatTime, formatDate, todayInCampus } from "@/lib/format";
import { Spinner, Skeleton } from "@/components/ui/states";
import type { BookingStatus } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-label-md uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p
          className={cn(
            "text-stat-display font-semibold mt-1 font-display",
            accent ? "text-secondary-container" : "text-on-surface",
          )}
        >
          {value}
        </p>
        {sub && <p className="text-label-sm text-on-surface-variant mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary-container shrink-0">
        {icon}
      </div>
    </div>
  );
}

const STATUS_TABS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

const LIMIT = 20;

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState(todayInCampus());
  const [skip, setSkip] = useState(0);

  const params = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(q.trim() ? { q: q.trim() } : {}),
    date_from: dateFilter,
    date_to: dateFilter,
    limit: LIMIT,
    skip,
  };

  const bookingsQ = useQuery({
    queryKey: ["admin", "bookings", params],
    queryFn: () => adminApi.bookings(params),
  });

  const allTodayQ = useQuery({
    queryKey: ["admin", "bookings", "today-all"],
    queryFn: () =>
      adminApi.bookings({ date_from: todayInCampus(), date_to: todayInCampus(), limit: 200 }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => bookingApi.cancel(id, "Cancelled by admin"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  const todayItems = allTodayQ.data?.items ?? [];
  const confirmed = todayItems.filter((b) => b.status === "confirmed").length;
  const cancelled = todayItems.filter((b) => b.status === "cancelled").length;
  const upcoming = todayItems.filter((b) => b.status === "confirmed" && new Date(b.start) > new Date()).length;

  const data = bookingsQ.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(skip / LIMIT) + 1;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-on-surface font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed" />
            BOOKINGS MANAGEMENT
          </span>
          <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight font-display">
            Bookings & Attendance Management
          </h1>
          <p className="text-label-lg text-on-surface-variant mt-1">
            Monitor, manage and override all student bookings across facilities.
          </p>
        </div>
        <button
          onClick={() => dialogRef.current?.showModal()}
          className="h-12 px-5 rounded-xl bg-secondary-container text-on-primary text-headline-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
        >
          <PlusCircle className="size-5" />
          Manual Booking / Admin Override
        </button>
      </div>

      {/* ── Metric Strip ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Check-ins"
          value={String(confirmed)}
          sub="confirmed today"
          icon={<CheckCircle className="size-5" />}
        />
        <StatCard
          label="Scheduled Today"
          value={String(todayItems.length)}
          sub="total bookings"
          icon={<Calendar className="size-5" />}
        />
        <StatCard
          label="Upcoming"
          value={String(upcoming)}
          sub="still to happen"
          icon={<Clock className="size-5" />}
        />
        <StatCard
          label="No-show / Cancelled"
          value={String(cancelled)}
          sub="today"
          icon={<XCircle className="size-5" />}
          accent={cancelled > 5}
        />
      </div>

      {/* ── Main content grid ── */}
      <div className="grid xl:grid-cols-12 gap-6">
        {/* ── Roster Table (9 cols) ── */}
        <div className="xl:col-span-9 space-y-4">
          {/* Filter bar */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by name, email, student ID..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setSkip(0); }}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setSkip(0); }}
              className="h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatusFilter(tab.value); setSkip(0); }}
                className={cn(
                  "h-9 px-4 rounded-full text-label-md transition-colors",
                  statusFilter === tab.value
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high",
                )}
              >
                {tab.label}
              </button>
            ))}
            <span className="ml-auto text-label-sm text-on-surface-variant">
              {total} total
            </span>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-container">
                    <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Student / Member</th>
                    <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Student ID</th>
                    <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Facility & Court</th>
                    <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Time Slot</th>
                    <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Status</th>
                    <th className="py-3 px-4 text-left text-label-md text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsQ.isPending ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="py-2 px-4">
                          <Skeleton className="h-10" />
                        </td>
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-on-surface-variant text-label-lg">
                        No bookings found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    items.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-surface-container hover:bg-surface-container-low/50 transition-colors"
                      >
                        {/* Student */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-label-sm font-semibold shrink-0">
                              {initials(booking.user.name)}
                            </div>
                            <div>
                              <p className="text-label-lg font-semibold text-on-surface leading-tight">
                                {booking.user.name}
                              </p>
                              <p className="text-label-sm text-on-surface-variant">{booking.user.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Student ID */}
                        <td className="py-3.5 px-4">
                          <span className="text-label-lg text-on-surface-variant font-mono">
                            {booking.user.student_id ?? "—"}
                          </span>
                        </td>
                        {/* Facility */}
                        <td className="py-3.5 px-4">
                          <p className="text-label-lg font-semibold text-on-surface leading-tight">
                            {booking.facility.name}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">{booking.facility.location}</p>
                        </td>
                        {/* Time slot */}
                        <td className="py-3.5 px-4">
                          <p className="text-label-lg text-on-surface">
                            {formatDate(booking.start)}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {formatTime(booking.start)} – {formatTime(booking.end)}
                          </p>
                        </td>
                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-label-sm font-semibold",
                              booking.status === "confirmed"
                                ? "bg-primary-fixed text-on-primary-fixed"
                                : "bg-error-container text-on-error-container",
                            )}
                          >
                            {booking.status === "confirmed" ? (
                              <CheckCircle className="size-3" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            {booking.status}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          {booking.status === "confirmed" && (
                            <button
                              onClick={() => cancelMut.mutate(booking.id)}
                              disabled={cancelMut.isPending}
                              className="h-8 px-3 rounded-lg bg-error-container text-on-error-container text-label-sm font-semibold hover:opacity-80 transition-opacity flex items-center gap-1 disabled:opacity-50"
                            >
                              <XCircle className="size-3.5" />
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-container bg-surface-container-low/50">
                <span className="text-label-sm text-on-surface-variant">
                  Page {currentPage} of {totalPages} · {total} results
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSkip(Math.max(0, skip - LIMIT))}
                    disabled={skip === 0}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => setSkip(skip + LIMIT)}
                    disabled={skip + LIMIT >= total}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Walk-in Quick Station (3 cols) ── */}
        <div className="xl:col-span-3">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-4 sticky top-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-5 text-primary-container" />
              <h2 className="text-headline-sm font-semibold text-on-surface">Walk-in Quick Station</h2>
            </div>
            <p className="text-label-sm text-on-surface-variant">
              Record a walk-in booking for a student directly at the facility.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant">Student ID / Name</label>
                <input
                  type="text"
                  placeholder="e.g. STU2024001"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant">Sport</label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container">
                  <option value="">Select sport…</option>
                  <option>Badminton</option>
                  <option>Tennis</option>
                  <option>Swimming</option>
                  <option>Basketball</option>
                  <option>Cricket</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant">Date</label>
                <input
                  type="date"
                  defaultValue={todayInCampus()}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div className="space-y-1">
                <label className="text-label-sm font-semibold text-on-surface-variant">Time Slot</label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container">
                  {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00 – {String(h + 1).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
              <button className="w-full h-11 rounded-xl bg-secondary-container text-on-primary text-headline-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Building2 className="size-4" />
                Record Walk-in
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Manual Booking Dialog ── */}
      <dialog
        ref={dialogRef}
        className="modal rounded-xl p-0 w-full max-w-lg bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
          <h2 className="text-headline-sm font-semibold text-on-surface">Manual Booking / Admin Override</h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant"
          >
            <XCircle className="size-5" />
          </button>
        </div>
        <form method="dialog" className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Student ID or Email</label>
            <input
              type="text"
              placeholder="e.g. student@university.edu"
              className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Facility</label>
            <select className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container">
              <option value="">Select facility…</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-label-md font-semibold text-on-surface-variant">Date</label>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-md font-semibold text-on-surface-variant">Time Slot</label>
              <select className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container">
                <option value="">Select time…</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Admin Note</label>
            <textarea
              rows={2}
              placeholder="Reason for override..."
              className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-10 px-5 rounded-lg bg-surface-container text-on-surface text-label-lg font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-secondary-container text-on-primary text-label-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Booking
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
