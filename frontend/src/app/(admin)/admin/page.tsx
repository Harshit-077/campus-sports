"use client";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { ErrorState, Spinner } from "@/components/ui/states";
import { formatHour, formatPercent } from "@/lib/format";
import { adminApi } from "@/lib/services";

/** Functional starter: the four dashboard cards from the proposal, fed by the real analytics API. */
export default function AdminOverviewPage() {
  const summary = useQuery({ queryKey: ["admin", "summary"], queryFn: () => adminApi.analytics.summary() });

  if (summary.isPending) return <Spinner />;
  if (summary.isError) return <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />;

  const s = summary.data;
  const cards = [
    { label: "Available facilities", value: `${s.active_facilities} / ${s.total_facilities}`, note: "active right now" },
    { label: "Bookings today", value: String(s.todays_bookings), note: `${s.upcoming_bookings} upcoming in total` },
    { label: "Peak hour", value: s.peak_hour ? formatHour(s.peak_hour.hour) : "-", note: "last 30 days" },
    { label: "Most popular sport", value: s.most_popular_sport?.name ?? "-", note: "last 30 days" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          {s.range.date_from} to {s.range.date_to} - cancellation rate {formatPercent(s.cancellation_rate)}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-brand">{c.value}</p>
            <p className="mt-1 text-xs text-muted">{c.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
