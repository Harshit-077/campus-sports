"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { BookingCard } from "@/components/booking-card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { formatRange } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useRules } from "@/lib/rules";
import { bookingApi } from "@/lib/services";
import type { Booking } from "@/lib/types";

const PAGE = 20;

export default function BookingsPage() {
  const rules = useRules();
  const nowMs = useNow();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [historyLimit, setHistoryLimit] = useState(PAGE);
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [reason, setReason] = useState("");

  const upcoming = useQuery({
    queryKey: ["bookings", "mine", "upcoming", "all"],
    queryFn: () => bookingApi.mine("upcoming", { limit: 100 }),
  });
  const history = useQuery({
    queryKey: ["bookings", "mine", "history", historyLimit],
    queryFn: () => bookingApi.mine("history", { limit: historyLimit }),
    enabled: tab === "history",
    placeholderData: keepPreviousData,
  });

  const cancel = useMutation({
    mutationFn: ({ id, why }: { id: string; why: string }) => bookingApi.cancel(id, why.trim() || undefined),
    onSuccess: () => {
      for (const key of ["bookings", "slots", "facilities", "notifications"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      close();
    },
  });

  function close() {
    setToCancel(null);
    setReason("");
    cancel.reset();
  }

  const used = upcoming.data?.length ?? 0;
  const active = tab === "upcoming" ? upcoming : history;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-xl text-primary max-sm:text-headline-lg">My bookings</h1>
          <p className="mt-1 text-on-surface-variant">Manage upcoming sessions and review past ones.</p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-5 py-4">
          <p className="text-label-sm uppercase tracking-wide text-outline">Upcoming bookings</p>
          <p className="font-display text-headline-lg text-primary">
            {used} <span className="text-base font-normal text-on-surface-variant">/ {rules.max_active_bookings} allowed</span>
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "upcoming", label: "Upcoming", count: upcoming.data?.length },
          { id: "history", label: "History" },
        ]}
      />

      <section aria-live="polite" className="space-y-4">
        {active.isPending && (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        )}
        {active.isError && <ErrorState message={active.error.message} onRetry={() => active.refetch()} />}

        {active.data?.length === 0 && (
          <EmptyState title={tab === "upcoming" ? "Nothing booked yet" : "No past bookings yet"}>
            {tab === "upcoming" && (
              <Link href="/facilities" className={buttonStyles("primary", "md", "mt-3")}>Find a facility</Link>
            )}
          </EmptyState>
        )}

        {active.data?.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            nowMs={nowMs}
            cutoffMinutes={rules.cancellation_cutoff_minutes}
            onCancel={tab === "upcoming" ? setToCancel : undefined}
          />
        ))}

        {tab === "history" && history.data && history.data.length >= historyLimit && (
          <div className="text-center">
            <Button variant="secondary" onClick={() => setHistoryLimit((n) => n + PAGE)} loading={history.isFetching}>
              Load more
            </Button>
          </div>
        )}
      </section>

      <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
        Bookings can be cancelled until {rules.cancellation_cutoff_minutes} minutes before they start, and you can hold up
        to {rules.max_active_bookings} upcoming bookings at a time.
      </p>

      <Modal open={toCancel !== null} onClose={close} title="Cancel this booking?">
        {toCancel && (
          <>
            <p className="text-sm text-on-surface-variant">
              {toCancel.facility.name}, {formatRange(toCancel.start, toCancel.end)}
            </p>
            <label className="mt-4 block text-sm font-medium text-on-surface" htmlFor="cancel-reason">
              Reason (optional)
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 h-24 w-full rounded-xl border border-line p-3 text-sm focus-visible:border-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
            />
            {cancel.error && (
              <p role="alert" className="mt-3 rounded-xl bg-error-container px-3 py-2 text-sm text-on-error-container">
                {cancel.error.message}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <Button variant="danger" size="lg" className="flex-1" loading={cancel.isPending}
                onClick={() => cancel.mutate({ id: toCancel.id, why: reason })}>
                Cancel booking
              </Button>
              <Button variant="secondary" size="lg" className="flex-1" onClick={close}>
                Keep booking
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
