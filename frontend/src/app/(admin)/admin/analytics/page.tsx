"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  TrendingUp,
  Users,
  Building2,
  XCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { adminApi } from "@/lib/services";
import { formatPercent, formatHour, addDays, todayInCampus } from "@/lib/format";
import { Skeleton } from "@/components/ui/states";

// ── Types ─────────────────────────────────────────────────────────────────────
type DateRange = "7d" | "30d" | "90d";

const RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-container">
        <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const today = todayInCampus();
  const [range, setRange] = useState<DateRange>("30d");

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const dateFrom = addDays(today, -days + 1);
  const dateTo = today;
  const rangeParams = { date_from: dateFrom, date_to: dateTo };

  const summaryQ = useQuery({
    queryKey: ["admin", "analytics", "summary", rangeParams],
    queryFn: () => adminApi.analytics.summary(rangeParams),
  });
  const sportsQ = useQuery({
    queryKey: ["admin", "analytics", "sports", rangeParams],
    queryFn: () => adminApi.analytics.popularSports(rangeParams),
  });
  const hoursQ = useQuery({
    queryKey: ["admin", "analytics", "hours", rangeParams],
    queryFn: () => adminApi.analytics.peakHours(rangeParams),
  });
  const facilitiesQ = useQuery({
    queryKey: ["admin", "analytics", "facilities", rangeParams],
    queryFn: () => adminApi.analytics.busiestFacilities({ ...rangeParams, limit: 8 }),
  });
  const cancellationsQ = useQuery({
    queryKey: ["admin", "analytics", "cancellations", rangeParams],
    queryFn: () => adminApi.analytics.cancellations(rangeParams),
  });
  const overTimeQ = useQuery({
    queryKey: ["admin", "analytics", "over-time", rangeParams],
    queryFn: () => adminApi.analytics.bookingsOverTime({ ...rangeParams, granularity: "day" }),
  });
  const utilizationQ = useQuery({
    queryKey: ["admin", "analytics", "utilization", rangeParams],
    queryFn: () => adminApi.analytics.utilization(rangeParams),
  });

  const s = summaryQ.data;
  const sports = sportsQ.data?.items ?? [];
  const hours = hoursQ.data?.items ?? [];
  const facilities = facilitiesQ.data?.items ?? [];
  const cancels = cancellationsQ.data;
  const overTime = overTimeQ.data?.items ?? [];
  const utilization = utilizationQ.data?.items ?? [];

  // Max values for bar scaling
  const maxSportShare = Math.max(...sports.map((s) => s.share), 0.01);
  const maxHourBookings = Math.max(...hours.map((h) => h.bookings), 1);
  const maxOTBookings = Math.max(...overTime.map((p) => p.bookings), 1);

  const isLoading = summaryQ.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-label-sm text-on-surface font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-primary-fixed" />
            ANALYTICS
          </span>
          <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight font-display">
            Analytics & Insights
          </h1>
          <p className="text-label-lg text-on-surface-variant mt-1">
            {dateFrom} – {dateTo} ({days} days)
          </p>
        </div>
        {/* Date range selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.entries(RANGE_LABELS) as [DateRange, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={cn(
                "h-9 px-4 rounded-full text-label-md transition-colors",
                range === key
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high",
              )}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => {
              summaryQ.refetch();
              sportsQ.refetch();
              hoursQ.refetch();
              facilitiesQ.refetch();
              cancellationsQ.refetch();
              overTimeQ.refetch();
              utilizationQ.refetch();
            }}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Summary KPI Strip ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Bookings"
            value={String(s?.total_bookings ?? 0)}
            sub={`${s?.confirmed ?? 0} confirmed`}
            icon={<Calendar className="size-5" />}
          />
          <StatCard
            label="Cancellation Rate"
            value={formatPercent(s?.cancellation_rate ?? 0)}
            sub={`${s?.cancelled ?? 0} cancelled`}
            icon={<XCircle className="size-5" />}
            accent={(s?.cancellation_rate ?? 0) > 0.15}
          />
          <StatCard
            label="Unique Students"
            value={String(s?.unique_students ?? 0)}
            sub="active this period"
            icon={<Users className="size-5" />}
          />
          <StatCard
            label="Active Facilities"
            value={`${s?.active_facilities ?? 0} / ${s?.total_facilities ?? 0}`}
            sub="operational"
            icon={<Building2 className="size-5" />}
          />
        </div>
      )}

      {/* ── Top row: Popular Sports + Peak Hours ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Sports */}
        <SectionCard title="Popular Sports">
          {sportsQ.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : sports.length === 0 ? (
            <p className="text-label-lg text-on-surface-variant text-center py-4">No data.</p>
          ) : (
            <div className="space-y-3">
              {sports.map((sport, i) => (
                <div key={sport.sport_id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-label-sm font-bold text-on-surface-variant">
                        {i + 1}
                      </span>
                      <span className="text-label-lg font-semibold text-on-surface">{sport.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-label-sm text-on-surface-variant">{sport.bookings} bookings</span>
                      <span className="text-label-sm font-semibold text-on-surface min-w-[40px] text-right">
                        {formatPercent(sport.share)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-container transition-all duration-500"
                      style={{ width: `${(sport.share / maxSportShare) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Peak Hours */}
        <SectionCard title="Peak Hours">
          {hoursQ.isPending ? (
            <Skeleton className="h-40" />
          ) : hours.length === 0 ? (
            <p className="text-label-lg text-on-surface-variant text-center py-4">No data.</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => {
                const found = hours.find((hr) => hr.hour === h);
                const count = found?.bookings ?? 0;
                const heightPct = maxHourBookings > 0 ? (count / maxHourBookings) * 100 : 0;
                const isTop = count === maxHourBookings && count > 0;
                return (
                  <div
                    key={h}
                    className="flex-1 flex flex-col items-center gap-1 group"
                    title={`${formatHour(h)}: ${count} bookings`}
                  >
                    <div className="relative w-full flex items-end" style={{ height: "120px" }}>
                      <div
                        className={cn(
                          "w-full rounded-t-sm transition-all duration-500",
                          isTop
                            ? "bg-secondary-container"
                            : count > 0
                              ? "bg-primary-container"
                              : "bg-surface-container-highest",
                        )}
                        style={{ height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="text-label-sm text-on-surface-variant" style={{ fontSize: "9px" }}>
                      {h}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {!hoursQ.isPending && hours.length > 0 && (
            <p className="text-label-sm text-on-surface-variant mt-2 text-center">
              Peak:{" "}
              <span className="font-semibold text-secondary-container">
                {formatHour(hours.reduce((a, b) => (a.bookings > b.bookings ? a : b)).hour)}
              </span>
            </p>
          )}
        </SectionCard>
      </div>

      {/* ── Second row: Busiest Facilities + Cancellations ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Busiest Facilities — 3 cols */}
        <div className="lg:col-span-3">
          <SectionCard title="Busiest Facilities">
            {facilitiesQ.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : facilities.length === 0 ? (
              <p className="text-label-lg text-on-surface-variant text-center py-4">No data.</p>
            ) : (
              <div className="space-y-2">
                {facilities.map((fac, i) => {
                  const utilItem = utilization.find((u) => u.facility_id === fac.facility_id);
                  const utilPct = utilItem?.utilization ?? 0;
                  return (
                    <div
                      key={fac.facility_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-label-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-label-lg font-semibold text-on-surface truncate">{fac.name}</p>
                            <p className="text-label-sm text-on-surface-variant">{fac.sport_name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-label-lg font-semibold text-on-surface">{fac.bookings}</p>
                            <p className="text-label-sm text-on-surface-variant">bookings</p>
                          </div>
                        </div>
                        {utilPct > 0 && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary-container"
                                style={{ width: `${Math.min(utilPct * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-label-sm text-on-surface-variant shrink-0">
                              {formatPercent(utilPct)} util.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Cancellations — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Cancellations Breakdown">
            {cancellationsQ.isPending ? (
              <Skeleton className="h-48" />
            ) : !cancels ? (
              <p className="text-label-lg text-on-surface-variant text-center py-4">No data.</p>
            ) : (
              <div className="space-y-4">
                {/* Rate circle */}
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke="var(--color-surface-container-highest)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke="var(--color-secondary-container)"
                        strokeWidth="3"
                        strokeDasharray={`${cancels.cancellation_rate * 100} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-headline-md font-bold text-on-surface font-display">
                        {(cancels.cancellation_rate * 100).toFixed(0)}%
                      </span>
                      <span className="text-label-sm text-on-surface-variant">rate</span>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-surface-container-low text-center">
                    <p className="text-stat-display font-semibold text-on-surface font-display" style={{ fontSize: "24px" }}>
                      {cancels.cancelled_by_student}
                    </p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">By Student</p>
                  </div>
                  <div className="p-3 rounded-lg bg-error-container/30 text-center">
                    <p className="text-stat-display font-semibold text-error font-display" style={{ fontSize: "24px" }}>
                      {cancels.cancelled_by_admin}
                    </p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">By Admin</p>
                  </div>
                </div>

                <div className="space-y-1 text-label-sm text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Total Bookings</span>
                    <span className="font-semibold text-on-surface">{cancels.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confirmed</span>
                    <span className="font-semibold text-on-surface">{cancels.confirmed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancelled</span>
                    <span className="font-semibold text-error">{cancels.cancelled}</span>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── Bookings Over Time ── */}
      <SectionCard title="Bookings Over Time">
        {overTimeQ.isPending ? (
          <Skeleton className="h-28" />
        ) : overTime.length === 0 ? (
          <p className="text-label-lg text-on-surface-variant text-center py-4">No data for this period.</p>
        ) : (
          <div>
            <div className="flex items-end gap-0.5 h-28 overflow-x-auto pb-2">
              {overTime.map((pt) => {
                const heightPct = (pt.bookings / maxOTBookings) * 100;
                return (
                  <div
                    key={pt.period}
                    className="flex flex-col items-center gap-0.5 group flex-1 min-w-[8px]"
                    title={`${pt.period}: ${pt.bookings}`}
                  >
                    <div className="relative w-full flex items-end" style={{ height: "88px" }}>
                      <div
                        className="w-full rounded-t-sm bg-primary-container hover:bg-secondary-container transition-colors duration-150"
                        style={{ height: `${Math.max(heightPct, pt.bookings > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    {overTime.length <= 14 && (
                      <span className="text-label-sm text-on-surface-variant" style={{ fontSize: "9px", whiteSpace: "nowrap" }}>
                        {pt.period.slice(5)} {/* MM-DD */}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-label-sm text-on-surface-variant">{overTime[0]?.period}</span>
              <span className="text-label-sm text-on-surface-variant">
                Peak: <span className="font-semibold text-on-surface">{maxOTBookings} bookings</span>
              </span>
              <span className="text-label-sm text-on-surface-variant">{overTime[overTime.length - 1]?.period}</span>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
