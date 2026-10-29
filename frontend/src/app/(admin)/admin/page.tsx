"use client";

import { useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle,
  Calendar,
  TrendingUp,
  Building2,
  XCircle,
  Clock,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { adminApi, catalogApi } from "@/lib/services";
import { formatPercent, todayInCampus, formatHour } from "@/lib/format";
import { Spinner, Skeleton } from "@/components/ui/states";

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── Sport filter categories ───────────────────────────────────────────────────
const SPORT_FILTERS = ["All", "Racquet", "Indoor", "Outdoor", "Aquatics"] as const;
type SportFilter = (typeof SPORT_FILTERS)[number];

// ── Time slots for matrix header ─────────────────────────────────────────────
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6-21

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  const today = todayInCampus();
  const currentHour = new Date().getHours();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sportFilter, setSportFilter] = useState<SportFilter>("All");

  const summaryQ = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: () => adminApi.analytics.summary(),
  });

  const facilitiesQ = useQuery({
    queryKey: ["facilities", { with_availability: true }],
    queryFn: () => catalogApi.facilities({ with_availability: true }),
  });

  const s = summaryQ.data;
  const facilities = facilitiesQ.data ?? [];

  // Filter facilities by sport keyword
  const filtered = facilities.filter((f) => {
    if (sportFilter === "All") return true;
    const cat = f.sport.category?.toLowerCase() ?? "";
    const name = f.sport.name?.toLowerCase() ?? "";
    if (sportFilter === "Racquet") return cat === "racquet" || name.includes("racquet") || name.includes("tennis") || name.includes("badminton");
    if (sportFilter === "Aquatics") return cat === "aquatic" || name.includes("swim") || name.includes("pool");
    if (sportFilter === "Indoor") return name.includes("indoor") || name.includes("basketball") || name.includes("table");
    if (sportFilter === "Outdoor") return name.includes("outdoor") || name.includes("cricket") || name.includes("football");
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-on-surface font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed" />
            ADMIN DASHBOARD
          </span>
          <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight font-display">
            Facilities Operations Overview
          </h1>
          <p className="text-label-lg text-on-surface-variant mt-1">
            {new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </p>
        </div>
        <button
          onClick={() => dialogRef.current?.showModal()}
          className="h-12 px-5 rounded-xl bg-secondary-container text-on-primary text-headline-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
        >
          <PlusCircle className="size-5" />
          Create Blockout / Reservation
        </button>
      </div>

      {/* ── KPI Cards ── */}
      {summaryQ.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : summaryQ.isError ? (
        <p className="text-error text-label-md">Failed to load summary.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Bookings Today"
            value={String(s!.todays_bookings)}
            sub={`of ~${Math.max(160, s!.todays_bookings)} capacity`}
            icon={<Calendar className="size-5" />}
          />
          <StatCard
            label="Upcoming Bookings"
            value={String(s!.upcoming_bookings)}
            sub="within next 7 days"
            icon={<Clock className="size-5" />}
          />
          <StatCard
            label="Active Facilities"
            value={`${s!.active_facilities} / ${s!.total_facilities}`}
            sub="currently operational"
            icon={<Building2 className="size-5" />}
          />
          <StatCard
            label="Cancellation Rate"
            value={formatPercent(s!.cancellation_rate)}
            sub={`${s!.cancelled} cancelled bookings`}
            icon={<XCircle className="size-5" />}
            accent={s!.cancellation_rate > 0.15}
          />
        </div>
      )}

      {/* ── Quick Filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-label-md text-on-surface-variant font-semibold mr-1">Filter:</span>
        {SPORT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setSportFilter(f)}
            className={cn(
              "h-9 px-4 rounded-full text-label-md transition-colors",
              sportFilter === f
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Schedule Matrix ── */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary-container" />
            <h2 className="text-headline-sm font-semibold text-on-surface">Schedule Matrix</h2>
            <span className="text-label-sm text-on-surface-variant ml-1">Today, {today}</span>
          </div>
          <TrendingUp className="size-4 text-on-surface-variant" />
        </div>

        {facilitiesQ.isPending ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="sticky left-0 z-10 bg-surface-container-low py-3 px-4 text-label-md text-on-surface-variant w-52 min-w-[200px]">
                    Facility
                  </th>
                  {HOURS.map((h) => (
                    <th
                      key={h}
                      className={cn(
                        "py-3 px-1 text-label-sm text-on-surface-variant text-center min-w-[52px]",
                        h === currentHour && "bg-primary-fixed/30 text-primary-container",
                      )}
                    >
                      {formatHour(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={HOURS.length + 1} className="py-8 text-center text-on-surface-variant text-label-lg">
                      No facilities match this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((facility) => {
                    const openSlots = facility.availability?.open_slots_today ?? 0;
                    const slotsPerDay = 16; // rough estimate
                    const utilPct = Math.max(0, 1 - openSlots / Math.max(slotsPerDay, 1));

                    return (
                      <tr
                        key={facility.id}
                        className="border-b border-surface-container hover:bg-surface-container-low/50 transition-colors"
                      >
                        {/* Facility name cell */}
                        <td className="sticky left-0 z-10 bg-surface-container-lowest py-3 px-4 border-r border-surface-container">
                          <p className="text-label-lg font-semibold text-on-surface leading-tight">{facility.name}</p>
                          <p className="text-label-sm text-on-surface-variant">{facility.location}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="h-1.5 w-20 rounded-full bg-surface-container-highest overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary-container"
                                style={{ width: `${utilPct * 100}%` }}
                              />
                            </div>
                            <span className="text-label-sm text-on-surface-variant">
                              {openSlots} open
                            </span>
                          </div>
                        </td>

                        {/* Hour cells */}
                        {HOURS.map((h) => {
                          const isPast = h < currentHour;
                          const isCurrent = h === currentHour;
                          // Approximate: slots in the past are "done", current hour might be active
                          return (
                            <td
                              key={h}
                              className={cn(
                                "py-2 px-1 text-center",
                                isCurrent && "bg-primary-fixed/30",
                              )}
                            >
                              <div
                                className={cn(
                                  "mx-auto w-8 h-8 rounded-lg flex items-center justify-center text-label-sm",
                                  isPast
                                    ? "bg-surface-container-highest text-on-surface-variant opacity-50"
                                    : facility.status === "maintenance"
                                      ? "slot-stripes"
                                      : facility.status === "inactive"
                                        ? "bg-error-container text-on-error-container opacity-60"
                                        : isCurrent
                                          ? "bg-primary-container text-on-primary"
                                          : "bg-primary-fixed text-on-primary-fixed",
                                )}
                              >
                                {isPast ? "–" : isCurrent ? "●" : "✓"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-surface-container bg-surface-container-low/50">
          {[
            { color: "bg-primary-fixed", label: "Available" },
            { color: "bg-primary-container", label: "Current Hour" },
            { color: "bg-surface-container-highest opacity-50", label: "Past" },
            { color: "slot-stripes", label: "Maintenance" },
            { color: "bg-error-container opacity-60", label: "Inactive" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn("w-4 h-4 rounded", color)} />
              <span className="text-label-sm text-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Blockout / Reservation Dialog ── */}
      <dialog
        ref={dialogRef}
        className="modal rounded-xl p-0 w-full max-w-lg bg-surface-container-lowest shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
          <h2 className="text-headline-sm font-semibold text-on-surface">Create Blockout / Reservation</h2>
          <button
            onClick={() => dialogRef.current?.close()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant"
          >
            <XCircle className="size-5" />
          </button>
        </div>
        <form
          method="dialog"
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            dialogRef.current?.close();
          }}
        >
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Type</label>
            <select className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container">
              <option value="blockout">Blockout (close facility)</option>
              <option value="reservation">Admin Reservation</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Facility</label>
            <select className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container">
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-label-md font-semibold text-on-surface-variant">Start</label>
              <input
                type="datetime-local"
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-md font-semibold text-on-surface-variant">End</label>
              <input
                type="datetime-local"
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-label-lg focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-label-md font-semibold text-on-surface-variant">Note (optional)</label>
            <textarea
              rows={3}
              placeholder="Reason for blockout or reservation details..."
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
              className="h-10 px-5 rounded-lg bg-secondary-container text-on-primary text-label-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <ChevronRight className="size-4" />
              Create
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
