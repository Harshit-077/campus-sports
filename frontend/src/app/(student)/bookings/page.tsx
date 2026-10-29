"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BookingCard } from "@/components/booking-card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatDate, formatRange } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useRules } from "@/lib/rules";
import { bookingApi } from "@/lib/services";
import type { Booking } from "@/lib/types";

const PAGE = 20;

export default function BookingsPage() {
  const { user } = useAuth();
  const rules = useRules();
  const nowMs = useNow();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [historyLimit, setHistoryLimit] = useState(PAGE);
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  const [activePass, setActivePass] = useState<Booking | null>(null);
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
  const freeSessions = Math.max(0, rules.max_active_bookings - used);

  return (
    <div className="space-y-8">
      {/* 1. Page Header & Statistical Highlights */}
      <div className="rounded-2xl border border-line bg-surface-container-low p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-sans text-label-sm font-semibold uppercase tracking-wider text-on-surface">
                <span className="size-2 rounded-full bg-secondary-container" />
                Member Athletics Portal
              </span>
              {user?.student_id && (
                <span className="text-xs text-outline font-sans">
                  Student ID: {user.student_id}
                </span>
              )}
            </div>

            <h1 className="font-display text-headline-xl font-semibold text-primary tracking-tight sm:text-4xl">
              My Bookings
            </h1>
            <p className="text-base text-on-surface-variant">
              Manage your upcoming sports sessions, inspect gate entry QR passes, and review past attendance records.
            </p>
          </div>

          {/* Quota Counter Metric Card */}
          <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-container-lowest p-4 shadow-sm shrink-0">
            <div className="grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
              <Trophy className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block">
                Active Slot Quota
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-display text-headline-md font-bold text-primary">{used}</span>
                <span className="text-xs text-outline">/ {rules.max_active_bookings} slots used</span>
              </div>
              <span className="text-[11px] font-medium text-success block">
                {freeSessions} sessions free to reserve
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Segmented Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="inline-flex p-1 rounded-full bg-surface-container self-start">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={cn(
              "px-5 py-2 rounded-full font-sans text-label-md font-semibold transition-all flex items-center gap-2",
              tab === "upcoming"
                ? "bg-primary-container text-white shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <span>Upcoming Sessions</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px]",
                tab === "upcoming" ? "bg-white/20 text-white" : "bg-surface-container-high text-on-surface"
              )}
            >
              {upcoming.data?.length ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("history")}
            className={cn(
              "px-5 py-2 rounded-full font-sans text-label-md font-semibold transition-all flex items-center gap-2",
              tab === "history"
                ? "bg-primary-container text-white shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <span>Past History</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px]",
                tab === "history" ? "bg-white/20 text-white" : "bg-surface-container-high text-on-surface"
              )}
            >
              {history.data?.length ?? 0}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <ShieldCheck className="size-4 text-success" />
          <span>Contactless NFC &amp; Turnstile gate synchronization active</span>
        </div>
      </div>

      {/* 3. Booking List Container */}
      <section aria-live="polite" className="space-y-4">
        {active.isPending && (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}

        {active.isError && (
          <ErrorState message={active.error.message} onRetry={() => active.refetch()} />
        )}

        {active.data?.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface-container-lowest p-12 text-center shadow-sm">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
              <CalendarCheck className="size-6" strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 font-display text-headline-sm font-semibold text-primary">
              {tab === "upcoming" ? "No upcoming bookings scheduled" : "No past booking history found"}
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {tab === "upcoming"
                ? "Browse open courts and reserve your next game in under 30 seconds."
                : "Completed and cancelled bookings will appear here."}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/facilities"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-container px-5 font-sans text-label-md font-semibold text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
              >
                Find a Facility
              </Link>
            )}
          </div>
        )}

        {active.data?.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            nowMs={nowMs}
            cutoffMinutes={rules.cancellation_cutoff_minutes}
            onCancel={(b) => setToCancel(b)}
            onViewPass={(b) => setActivePass(b)}
          />
        ))}

        {tab === "history" && (history.data?.length ?? 0) >= historyLimit && (
          <div className="pt-2 text-center">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setHistoryLimit((n) => n + PAGE)}
            >
              Load more past sessions
            </Button>
          </div>
        )}
      </section>

      {/* 4. Gate Pass QR Modal */}
      {activePass && (
        <Modal open={true} onClose={() => setActivePass(null)} title="Turnstile Access Gate Pass">
          <div className="space-y-5 text-center">
            {/* Procedural High-Contrast Vector SVG QR Code */}
            <div className="mx-auto size-48 bg-white p-3 rounded-2xl border border-line shadow-sm flex items-center justify-center">
              <svg className="size-40 text-primary-container" fill="currentColor" viewBox="0 0 100 100">
                <rect height="28" rx="2" width="28" x="0" y="0" />
                <rect fill="white" height="20" width="20" x="4" y="4" />
                <rect fill="currentColor" height="12" width="12" x="8" y="8" />
                <rect height="28" rx="2" width="28" x="72" y="0" />
                <rect fill="white" height="20" width="20" x="76" y="4" />
                <rect fill="currentColor" height="12" width="12" x="80" y="8" />
                <rect height="28" rx="2" width="28" x="0" y="72" />
                <rect fill="white" height="20" width="20" x="4" y="76" />
                <rect fill="currentColor" height="12" width="12" x="80" y="80" />
                <rect height="6" width="6" x="36" y="8" />
                <rect height="6" width="12" x="48" y="8" />
                <rect height="8" width="8" x="36" y="20" />
                <rect height="8" width="8" x="52" y="20" />
                <rect height="8" width="8" x="12" y="36" />
                <rect height="8" width="8" x="28" y="36" />
                <rect height="8" width="12" x="44" y="36" />
                <rect height="12" width="8" x="64" y="36" />
                <rect height="6" width="8" x="80" y="36" />
                <rect height="6" width="12" x="8" y="52" />
                <rect height="12" width="8" x="28" y="48" />
                <rect height="6" width="8" x="44" y="52" />
                <rect height="6" width="12" x="60" y="52" />
                <rect height="12" width="8" x="80" y="48" />
                <rect height="8" width="12" x="36" y="68" />
                <rect height="8" width="8" x="56" y="68" />
                <rect height="6" width="12" x="72" y="68" />
                <rect height="8" width="8" x="36" y="84" />
                <rect height="12" width="8" x="52" y="80" />
                <rect height="8" width="16" x="68" y="84" />
              </svg>
            </div>

            <div>
              <p className="font-mono text-sm font-bold text-primary tracking-wider">
                TOKEN: CSP-2025-{user?.student_id ?? "8842"}-{activePass.id.slice(-4).toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Hold within 5cm of turnstile optical reader at{" "}
                <strong className="text-on-surface">{activePass.facility.location}</strong>. Valid 10m before slot start.
              </p>
            </div>

            <dl className="space-y-2 rounded-xl bg-surface-container-low p-3.5 text-xs border border-line text-left">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Facility</dt>
                <dd className="font-semibold text-primary">{activePass.facility.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Schedule</dt>
                <dd className="font-semibold text-primary">{formatRange(activePass.start, activePass.end)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Student</dt>
                <dd className="font-semibold text-primary">{user?.name} (ID: {user?.student_id ?? "N/A"})</dd>
              </div>
            </dl>

            <Button variant="secondary" size="lg" className="w-full" onClick={() => setActivePass(null)}>
              Done
            </Button>
          </div>
        </Modal>
      )}

      {/* 5. Cancellation Modal */}
      {toCancel && (
        <Modal open={true} onClose={close} title="Cancel this booking?">
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Are you sure you want to release your reservation for{" "}
              <strong className="text-on-surface">{toCancel.facility.name}</strong> on{" "}
              {formatRange(toCancel.start, toCancel.end)}? This will immediately reopen the slot to other students.
            </p>

            <div>
              <label htmlFor="cancel-reason" className="block text-xs font-semibold text-on-surface mb-1">
                Reason for cancellation (optional):
              </label>
              <input
                id="cancel-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Class schedule change, teammate unavailable"
                className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface-container-low text-sm focus:border-primary-container focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {cancel.error && (
              <p role="alert" className="rounded-xl bg-error-container p-3 text-xs text-on-error-container font-medium">
                {cancel.error.message}
              </p>
            )}

            <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-2">
              <Button
                variant="danger"
                size="lg"
                className="flex-1"
                loading={cancel.isPending}
                onClick={() => cancel.mutate({ id: toCancel.id, why: reason })}
              >
                Confirm Cancellation
              </Button>
              <Button variant="secondary" size="lg" className="flex-1" onClick={close}>
                Keep Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
