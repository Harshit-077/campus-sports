"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock, MapPin, Zap } from "lucide-react";
import Link from "next/link";

import { Notice } from "@/components/notice";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useAuth } from "@/lib/auth";
import { dayLabel, formatRange, formatTime, startsInLabel, timeAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { slotHref, soonestOpenFacilities } from "@/lib/quick-book";
import { bookingApi, catalogApi, notificationApi } from "@/lib/services";

export default function DashboardPage() {
  const { user } = useAuth();
  const nowMs = useNow();

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
    queryFn: () => notificationApi.list({ limit: 3 }),
  });

  const next = upcoming.data?.[0];
  const soonest = soonestOpenFacilities(facilities.data ?? []);
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-white p-6">
        <div>
          {user?.student_id && (
            <span className="rounded-full bg-surface-container px-3 py-1 text-label-md text-on-surface">Student ID {user.student_id}</span>
          )}
          <h1 className="mt-3 font-display text-headline-xl text-primary max-sm:text-headline-lg">Welcome back, {firstName}</h1>
          <p className="mt-1 max-w-xl text-on-surface-variant">Pick a facility, choose a time and you are booked.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-sm">
            <CalendarDays className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
            <span className="font-display font-semibold text-on-surface">{upcoming.data?.length ?? "-"}</span>
            <span className="text-on-surface-variant">upcoming booking{upcoming.data?.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        {soonest[0] && (
          <Link href={slotHref(soonest[0])} className={buttonStyles("accent", "lg")}>
            <Zap className="size-5" strokeWidth={1.75} aria-hidden /> Quick book
          </Link>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="font-display text-headline-md text-primary">Next booking</h2>
          {upcoming.isPending && <Skeleton className="h-52" />}
          {upcoming.isError && <ErrorState message={upcoming.error.message} onRetry={() => upcoming.refetch()} />}
          {upcoming.data && !next && (
            <EmptyState title="Nothing booked yet">
              <Link href="/facilities" className="font-medium text-primary-container underline">Find a facility</Link>
            </EmptyState>
          )}
          {next && (
            <article className="space-y-3 rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label-sm uppercase tracking-wide text-outline">{next.sport.name}</span>
                {startsInLabel(next.start, nowMs) && (
                  <span className="text-label-md font-semibold text-secondary">{startsInLabel(next.start, nowMs)}</span>
                )}
              </div>
              <h3 className="font-display text-headline-lg text-primary">{next.facility.name}</h3>
              <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <MapPin className="size-4" strokeWidth={1.75} aria-hidden /> {next.facility.location}
              </p>
              <p className="flex items-center gap-1.5 rounded-xl bg-surface-container p-3 text-on-surface">
                <Clock className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
                <span className="font-display text-headline-sm">{formatRange(next.start, next.end)}</span>
              </p>
              <Link href="/bookings" className={buttonStyles("secondary", "md", "w-full")}>Manage booking</Link>
            </article>
          )}

          <h2 className="pt-2 font-display text-headline-md text-primary">Recent notifications</h2>
          {notes.data?.length === 0 && <p className="text-sm text-on-surface-variant">You are all caught up.</p>}
          <ul className="space-y-2">
            {notes.data?.map((n) => (
              <li key={n.id} className="rounded-xl border border-line bg-white p-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-on-surface">
                  {!n.read && <span className="size-2 rounded-full bg-secondary-container" aria-label="Unread" />}
                  {n.title}
                </p>
                <p className="text-on-surface-variant">{n.message}</p>
                <p className="mt-1 text-label-sm text-outline">{timeAgo(n.created_at, nowMs)}</p>
              </li>
            ))}
          </ul>
          <Link href="/notifications" className="inline-flex items-center gap-1 text-sm font-medium text-primary-container hover:underline">
            All notifications <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>

        <section className="space-y-4 lg:col-span-3">
          <div>
            <h2 className="font-display text-headline-md text-primary">Book in 30 seconds</h2>
            <p className="text-sm text-on-surface-variant">Facilities with a slot free soonest today.</p>
          </div>
          {facilities.isPending && <Skeleton className="h-56" />}
          {facilities.isError && <ErrorState message={facilities.error.message} onRetry={() => facilities.refetch()} />}
          {facilities.data && soonest.length === 0 && (
            <Notice title="No open slots left today">Check a later date from any facility page.</Notice>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {soonest.slice(0, 4).map((f) => {
              const slot = f.availability!.next_slot!;
              return (
                <article key={f.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
                  <div className="flex items-center justify-between text-label-md text-on-surface-variant">
                    <span className="truncate">{f.sport.name}</span>
                    <span>{f.availability!.open_slots_today} open today</span>
                  </div>
                  <div>
                    <h3 className="font-display text-headline-sm text-primary">{f.name}</h3>
                    <p className="text-sm text-on-surface-variant">{f.location}</p>
                  </div>
                  <p className="flex items-center justify-between rounded-xl bg-surface-container p-3 text-sm">
                    <span className="text-on-surface-variant">Next slot</span>
                    <span className="font-medium text-on-surface">
                      {formatTime(slot.start)} - {formatTime(slot.end)} {dayLabel(slot.start)}
                    </span>
                  </p>
                  <Link href={slotHref(f)} className={buttonStyles("primary", "md", "w-full")}>
                    Reserve {formatTime(slot.start)}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-headline-md text-primary">Explore by sport</h2>
            <p className="text-sm text-on-surface-variant">Facilities and today&apos;s open slots.</p>
          </div>
          <Link href="/facilities" className="inline-flex items-center gap-1 text-sm font-medium text-primary-container hover:underline">
            All facilities <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sports.data?.map((sport) => {
            const own = (facilities.data ?? []).filter((f) => f.sport.id === sport.id);
            const open = own.reduce((sum, f) => sum + (f.availability?.open_slots_today ?? 0), 0);
            return (
              <Link key={sport.id} href={`/facilities?sport=${sport.id}`} className="rounded-2xl border border-line bg-white p-4 transition-colors hover:bg-surface-container-low">
                <h3 className="font-display text-headline-sm text-primary">{sport.name}</h3>
                <p className="text-sm text-on-surface-variant">{own.length} facilit{own.length === 1 ? "y" : "ies"}</p>
                <p className="mt-3 flex justify-between border-t border-line pt-3 text-label-md text-on-surface-variant">
                  <span>Open slots today</span>
                  <span className="font-semibold text-on-surface">{open}</span>
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
