"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Notice } from "@/components/notice";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { dayLabel, formatRange, formatTime, startsInLabel, timeAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { slotHref, soonestOpenFacilities } from "@/lib/quick-book";
import { bookingApi, catalogApi, notificationApi } from "@/lib/services";

export default function DashboardPage() {
  const { user } = useAuth();
  const nowMs = useNow();
  const queryClient = useQueryClient();
  const [copiedPass, setCopiedPass] = useState(false);

  const upcoming = useQuery({
    queryKey: ["bookings", "mine", "upcoming", "all"],
    queryFn: () => bookingApi.mine("upcoming", { limit: 100 }),
  });
  const facilities = useQuery({
    queryKey: ["facilities", "all"],
    queryFn: () => catalogApi.facilities({ with_availability: true }),
  });
  const sports = useQuery({ queryKey: ["sports"], queryFn: catalogApi.sports });
  const notes = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => notificationApi.list({ limit: 4 }),
  });

  const next = upcoming.data?.[0];
  const soonest = soonestOpenFacilities(facilities.data ?? []);
  const firstName = user?.name.split(" ")[0] ?? "Student";

  const handleCopyPass = (token: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(token);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2500);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP HERO & WELCOME PANEL */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {user?.student_id && (
                <span className="rounded-full bg-surface-container-high px-3 py-1 font-sans text-label-sm font-semibold uppercase tracking-wider text-on-surface">
                  Student ID {user.student_id}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 font-sans text-label-sm font-semibold text-on-primary-fixed-variant">
                <span className="size-2 rounded-full bg-primary-container" />
                Verified Student • Academic Term 2
              </span>
            </div>

            <div>
              <h1 className="font-display text-headline-xl font-semibold tracking-tight text-primary sm:text-4xl">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1 text-base text-on-surface-variant">
                Book campus courts, access active turnstile passes, and manage your university sports reservations in under 30 seconds.
              </p>
            </div>

            {/* Quick Metrics Counter Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3.5 py-2">
                <CalendarDays className="size-4 text-primary-container" strokeWidth={2} />
                <span className="font-display text-headline-sm font-bold text-primary">
                  {upcoming.data?.length ?? 0}
                </span>
                <span className="text-xs text-on-surface-variant">Active Bookings</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3.5 py-2">
                <Trophy className="size-4 text-primary-container" strokeWidth={2} />
                <span className="font-display text-headline-sm font-bold text-primary">
                  {facilities.data?.length ?? 8}
                </span>
                <span className="text-xs text-on-surface-variant">Facilities Synchronized</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3.5 py-2">
                <ShieldCheck className="size-4 text-success" strokeWidth={2} />
                <span className="font-display text-headline-sm font-bold text-primary">
                  100%
                </span>
                <span className="text-xs text-on-surface-variant">Turnstiles Active</span>
              </div>
            </div>
          </div>

          {/* Primary Action: Single Accent Orange CTA */}
          <div className="flex flex-col items-start gap-1.5 lg:items-end">
            <Link
              href="/facilities"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary-container px-6 font-display text-headline-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary active:translate-y-0.5"
            >
              <Zap className="size-5" strokeWidth={2} />
              Quick Book a Court
            </Link>
            <span className="text-xs text-on-surface-variant">Average reservation time: 24 sec</span>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATUS & FACILITY DIRECTIVE STRIP */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-surface-container-low px-5 py-3.5 text-sm md:flex-row md:items-center">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-5 shrink-0 text-primary-container" />
          <p className="text-on-surface-variant">
            <strong className="font-semibold text-primary">Campus Facility Rule:</strong> Non-marking rubber soles mandatory on wooden courts. Carry student ID card.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-2 rounded-full bg-success" />
            Equipment Lockers: Open until 22:00
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Flame className="size-3.5 text-secondary" /> 21°C Indoor Arena
          </span>
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN WORKFLOW SECTION */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: UPCOMING ACTIVE BOOKING & TURNSTILE PASS (5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-success animate-pulse" />
              <h2 className="font-display text-headline-md font-semibold text-primary">
                Next Booking Today
              </h2>
            </div>
            {next && startsInLabel(next.start, nowMs) && (
              <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm font-semibold text-on-secondary-fixed-variant">
                {startsInLabel(next.start, nowMs)}
              </span>
            )}
          </div>

          {upcoming.isPending && <Skeleton className="h-72" />}
          {upcoming.isError && (
            <ErrorState message={upcoming.error.message} onRetry={() => upcoming.refetch()} />
          )}

          {upcoming.data && !next && (
            <div className="rounded-2xl border border-line bg-surface-container-lowest p-8 text-center shadow-sm">
              <div className="mx-auto grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
                <CalendarDays className="size-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-display text-headline-sm font-semibold text-primary">
                Nothing booked right now
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Reserve an open court or lane in seconds to get your active turnstile pass.
              </p>
              <Link
                href="/facilities"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary-container px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
              >
                Find an available facility
              </Link>
            </div>
          )}

          {next && (
            <div className="rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm space-y-4">
              {/* Ticket Header */}
              <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <span className="text-label-sm uppercase tracking-wider text-outline font-semibold">
                    {next.sport.name} • Confirmed
                  </span>
                  <h3 className="mt-1 font-display text-headline-lg font-semibold text-primary">
                    {next.facility.name}
                  </h3>
                  <p className="flex items-center gap-1.5 text-sm text-on-surface-variant mt-0.5">
                    <MapPin className="size-4 shrink-0 text-outline" /> {next.facility.location}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-semibold text-on-primary-fixed-variant">
                  <CheckCircle2 className="size-3.5" /> Confirmed
                </span>
              </div>

              {/* Schedule Details Box */}
              <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-surface-container-lowest text-primary-container shadow-sm">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <div className="font-display text-headline-sm font-semibold text-primary">
                      {formatRange(next.start, next.end)}
                    </div>
                    <div className="text-xs text-on-surface-variant">{dayLabel(next.start)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-outline">Access Hub</span>
                  <p className="text-xs font-semibold text-primary">Main Turnstile A</p>
                </div>
              </div>

              {/* Turnstile Procedural QR Gate Pass */}
              <div className="rounded-xl border border-line bg-surface-container p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Procedural High-Contrast Vector SVG QR Code */}
                  <div className="shrink-0 rounded-lg bg-white p-2 shadow-sm">
                    <svg className="size-20 text-primary-container" fill="currentColor" viewBox="0 0 100 100">
                      {/* Top-left finder pattern */}
                      <rect height="28" rx="2" width="28" x="0" y="0" />
                      <rect fill="white" height="20" width="20" x="4" y="4" />
                      <rect fill="currentColor" height="12" width="12" x="8" y="8" />
                      {/* Top-right finder pattern */}
                      <rect height="28" rx="2" width="28" x="72" y="0" />
                      <rect fill="white" height="20" width="20" x="76" y="4" />
                      <rect fill="currentColor" height="12" width="12" x="80" y="8" />
                      {/* Bottom-left finder pattern */}
                      <rect height="28" rx="2" width="28" x="0" y="72" />
                      <rect fill="white" height="20" width="20" x="4" y="76" />
                      <rect fill="currentColor" height="12" width="12" x="8" y="80" />
                      {/* Data bits */}
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

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="font-display text-sm font-semibold text-primary">
                      Turnstile Gate Access Pass
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      Hold within 5cm of turnstile reader at Block Entrance. Valid 10 min prior to start.
                    </p>
                    <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-mono text-xs font-semibold text-primary-container">
                        CSP-2025-{user?.student_id ?? "8842"}-{next.id.slice(-4).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href="/bookings"
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-surface-container-high px-4 font-sans text-label-md font-semibold text-primary transition-colors hover:bg-surface-container-highest"
                >
                  <CalendarCheck className="size-4" />
                  Pass Details
                </Link>
                <Link
                  href="/bookings"
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-4 font-sans text-label-md font-semibold text-on-surface-variant transition-colors hover:border-error/30 hover:bg-error-container/20 hover:text-error"
                >
                  <XCircle className="size-4" />
                  Manage / Cancel
                </Link>
              </div>
            </div>
          )}

          {/* Quick Peer Invite Widget */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-fixed text-primary-container font-semibold">
                <UserPlus className="size-5" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-primary">Invite a Hitting Partner</p>
                <p className="text-xs text-on-surface-variant">Share court pass with fellow varsity students</p>
              </div>
            </div>
            <Link
              href="/facilities"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-surface-container-high px-3 text-label-sm font-semibold text-primary transition-colors hover:bg-primary-container hover:text-white"
            >
              Invite
            </Link>
          </div>

          {/* Recent Notifications Card */}
          <div className="rounded-2xl border border-line bg-surface-container-lowest p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-headline-sm font-semibold text-primary">
                Recent Notifications
              </h3>
              <Link
                href="/notifications"
                className="text-label-sm font-semibold text-primary-container hover:underline"
              >
                View all
              </Link>
            </div>

            {notes.data?.length === 0 && (
              <p className="text-sm text-on-surface-variant">You are all caught up.</p>
            )}

            <div className="space-y-2">
              {notes.data?.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-xl border border-line/70 bg-surface-container-low/50 p-3 text-sm transition-colors hover:bg-surface-container-low"
                >
                  <div className="mt-0.5">
                    {!n.read ? (
                      <span className="size-2 rounded-full bg-secondary-container block" />
                    ) : (
                      <span className="size-2 rounded-full bg-line block" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-on-surface leading-snug">{n.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{n.message}</p>
                    <span className="mt-1 block text-[11px] text-outline">
                      {timeAgo(n.created_at, nowMs)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 1-TAP QUICK BOOKING & EXPLORE (7 Cols) */}
        <div className="space-y-6 lg:col-span-7" id="quick-book-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-headline-md font-semibold text-primary">
                Book in 30 Seconds
              </h2>
              <p className="text-sm text-on-surface-variant">
                Instant reservations for courts with immediate vacancy today
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-success font-medium">
              <span className="size-2 rounded-full bg-success" />
              Live University Availability
            </div>
          </div>

          {facilities.isPending && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          )}

          {facilities.isError && (
            <ErrorState message={facilities.error.message} onRetry={() => facilities.refetch()} />
          )}

          {facilities.data && soonest.length === 0 && (
            <Notice title="No open slots left today">
              Check future dates or view our complete facilities directory.
            </Notice>
          )}

          {/* Quick Booking 4-Card Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {soonest.slice(0, 4).map((f) => {
              const slot = f.availability!.next_slot!;
              return (
                <div
                  key={f.id}
                  className="flex flex-col justify-between rounded-2xl border border-line bg-surface-container-lowest p-5 shadow-sm transition-all hover:border-primary-container/40 hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 font-medium text-primary">
                        {f.sport.name}
                      </span>
                      <span className="font-semibold text-success">
                        {f.availability!.open_slots_today} slots open
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-headline-sm font-semibold text-primary leading-tight">
                        {f.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-on-surface-variant flex items-center gap-1">
                        <MapPin className="size-3.5 text-outline" /> {f.location}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface-container-low p-2.5 text-xs">
                      <span className="text-outline uppercase text-[10px] font-semibold block">Next Open Window</span>
                      <span className="font-display font-semibold text-primary">
                        {formatTime(slot.start)} – {formatTime(slot.end)} {dayLabel(slot.start)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 pt-1 border-t border-line">
                    <Link
                      href={slotHref(f)}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 text-label-md font-semibold text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
                    >
                      <Zap className="size-4" />
                      Reserve {formatTime(slot.start)}
                    </Link>
                    <Link
                      href={`/facilities/${f.id}`}
                      className="grid size-10 place-items-center rounded-lg bg-surface-container-high text-primary transition-colors hover:bg-surface-container-highest"
                      title="View all slots"
                    >
                      <CalendarDays className="size-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explore by Sport Section */}
          <div className="rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-display text-headline-md font-semibold text-primary">
                  Explore by Sport
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Browse dedicated venues and real-time open slots
                </p>
              </div>
              <Link
                href="/facilities"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-container hover:underline"
              >
                All facilities <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sports.data?.map((sport) => {
                const own = (facilities.data ?? []).filter((f) => f.sport.id === sport.id);
                const open = own.reduce((sum, f) => sum + (f.availability?.open_slots_today ?? 0), 0);
                return (
                  <Link
                    key={sport.id}
                    href={`/facilities?sport=${sport.id}`}
                    className="flex flex-col justify-between rounded-xl border border-line bg-surface-container-low/40 p-4 transition-all hover:border-primary-container/40 hover:bg-surface-container-low"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-display text-headline-sm font-semibold text-primary">
                          {sport.name}
                        </span>
                        <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-outline">
                          {own.length} {own.length === 1 ? "court" : "courts"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant capitalize">
                        {sport.category} sport
                      </p>
                    </div>

                    <div className="mt-4 border-t border-line/60 pt-2.5 flex items-center justify-between text-xs">
                      <span className="text-outline">Open today</span>
                      <span className="font-semibold text-primary-container">{open} slots</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
