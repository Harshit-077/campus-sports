"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, Spinner } from "@/components/ui/states";
import { useAuth } from "@/lib/auth";
import { formatRange } from "@/lib/format";
import { bookingApi } from "@/lib/services";

/** Functional starter (proves auth + API wiring); the designed version arrives in step 7. */
export default function DashboardPage() {
  const { user } = useAuth();
  const upcoming = useQuery({
    queryKey: ["bookings", "mine", "upcoming", 3],
    queryFn: () => bookingApi.mine("upcoming", { limit: 3 }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Hi {user?.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted">Here is what is coming up.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Upcoming bookings</h2>
        {upcoming.isPending && <Spinner />}
        {upcoming.isError && <ErrorState message={upcoming.error.message} onRetry={() => upcoming.refetch()} />}
        {upcoming.data?.length === 0 && (
          <EmptyState title="Nothing booked yet">
            <Link href="/facilities" className="font-medium text-brand underline">
              Find a facility
            </Link>
          </EmptyState>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {upcoming.data?.map((b) => (
            <Card key={b.id} className="space-y-2">
              <Badge tone="success">{b.sport.name}</Badge>
              <p className="font-medium text-ink">{b.facility.name}</p>
              <p className="text-sm text-muted">{formatRange(b.start, b.end)}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
