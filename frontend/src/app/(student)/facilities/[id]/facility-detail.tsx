"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

import { BookingSummary } from "@/components/booking/booking-summary";
import { ConfirmDialog } from "@/components/booking/confirm-dialog";
import { DateStrip } from "@/components/booking/date-strip";
import { SlotGrid, SlotLegend } from "@/components/booking/slot-grid";
import { Notice } from "@/components/notice";
import { StatusPill } from "@/components/status-pill";
import { Button, buttonStyles } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { addDays, campusDateOf, describeWindows, formatDay, sameInstant, todayInCampus, weekdayOf } from "@/lib/format";
import { metadataEntries } from "@/lib/humanize";
import { useRules } from "@/lib/rules";
import { bookingApi, catalogApi } from "@/lib/services";
import type { Weekday } from "@/lib/types";

const WEEK: Array<[Weekday, string]> = [
  ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"],
  ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"],
];

export function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const slotParam = useSearchParams().get("slot");
  const presetSlot = slotParam && !Number.isNaN(Date.parse(slotParam)) ? slotParam : null;

  const { user } = useAuth();
  const rules = useRules();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(() => (presetSlot ? campusDateOf(presetSlot) : todayInCampus()));
  const [selectedStart, setSelectedStart] = useState<string | null>(presetSlot);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const facilityQ = useQuery({ queryKey: ["facility", id], queryFn: () => catalogApi.facility(id) });
  const slotsQ = useQuery({
    queryKey: ["slots", id, date],
    queryFn: () => catalogApi.slots(id, date),
    refetchInterval: 30_000, // pick up other people's bookings
  });
  const upcomingQ = useQuery({
    queryKey: ["bookings", "mine", "upcoming", "all"],
    queryFn: () => bookingApi.mine("upcoming", { limit: 100 }),
  });

  const book = useMutation({
    mutationFn: (start: string) => bookingApi.create(id, start),
    onSuccess: () => {
      for (const key of ["slots", "bookings", "notifications", "facilities"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "SLOT_TAKEN") {
        setConflict(true);
        setSelectedStart(null);
        setConfirmOpen(false);
        void queryClient.invalidateQueries({ queryKey: ["slots", id] });
      }
    },
  });

  if (facilityQ.isPending) return <Skeleton className="h-96" />;
  if (facilityQ.isError) {
    const notFound = facilityQ.error instanceof ApiError && facilityQ.error.status === 404;
    return (
      <div className="space-y-4">
        <ErrorState message={notFound ? "This facility does not exist." : facilityQ.error.message} onRetry={notFound ? undefined : () => facilityQ.refetch()} />
        <Link href="/facilities" className={buttonStyles("secondary", "md")}>Back to facilities</Link>
      </div>
    );
  }

  const facility = facilityQ.data;
  const today = todayInCampus();
  const days = Array.from({ length: rules.booking_window_days + 1 }, (_, i) => addDays(today, i));
  const isClosed = (day: string) => facility.operating_hours[weekdayOf(day)].length === 0;
  const nextOpenDay = days.find((d) => d > date && !isClosed(d));

  const slots = slotsQ.data?.slots ?? [];
  const selectedSlot = slots.find((s) => selectedStart && sameInstant(s.start, selectedStart) && s.status === "available") ?? null;
  const upcomingCount = upcomingQ.data?.length ?? 0;
  const limitReached = upcomingCount >= rules.max_active_bookings;
  const maintenance = facility.status === "maintenance";

  const blockedReason = maintenance
    ? "Booking is paused while the facility is under maintenance."
    : limitReached
      ? `You already have ${upcomingCount} upcoming bookings (the limit).`
      : null;

  const pickDate = (day: string) => {
    setDate(day);
    setSelectedStart(null);
    setConflict(false);
  };
  const closeDialog = () => {
    setConfirmOpen(false);
    if (book.isSuccess) setSelectedStart(null);
    book.reset();
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-label-md text-outline">
        <Link href="/sports" className="hover:text-primary">Sports</Link>
        <ChevronRight className="size-4" aria-hidden />
        <Link href={`/facilities?sport=${facility.sport.id}`} className="hover:text-primary">{facility.sport.name}</Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="font-medium text-on-surface">{facility.name}</span>
      </nav>

      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-surface-container px-3 py-1 text-label-md text-on-surface">{facility.sport.name}</span>
              <StatusPill status={facility.status} />
            </div>
            <h1 className="mt-2 font-display text-headline-xl text-primary max-sm:text-headline-lg">{facility.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-on-surface-variant">
              <MapPin className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden /> {facility.location}
            </p>
            {Object.keys(facility.metadata).length > 0 && (
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {metadataEntries(facility.metadata).map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-surface-container-low p-3">
                    <dt className="text-label-sm text-outline">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-on-surface">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="w-full rounded-xl bg-surface-container p-4 lg:w-72">
            <button
              onClick={() => setHoursOpen((o) => !o)}
              aria-expanded={hoursOpen}
              className="flex w-full items-center justify-between text-label-lg text-on-surface"
            >
              <span className="flex items-center gap-2">
                <Clock className="size-5 text-primary" strokeWidth={1.75} aria-hidden /> Opening hours
              </span>
              <ChevronDown className={`size-5 text-outline transition-transform ${hoursOpen ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {hoursOpen && (
              <dl className="mt-3 space-y-1.5 text-sm">
                {WEEK.map(([key, label]) => {
                  const hours = describeWindows(facility.operating_hours[key]);
                  return (
                    <div key={key} className="flex justify-between gap-3">
                      <dt className="text-on-surface-variant">{label}</dt>
                      <dd className={hours ? "font-medium text-on-surface" : "font-medium text-error"}>{hours ?? "Closed"}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </div>
        </div>
      </section>

      <div className="space-y-3 empty:hidden">
        {maintenance && <Notice tone="danger" title="Under maintenance">Booking is paused while the facility is being serviced.</Notice>}
        {limitReached && !maintenance && (
          <Notice tone="warning" title={`Booking limit reached (${upcomingCount}/${rules.max_active_bookings})`}
            action={<Link href="/bookings" className="text-sm font-medium underline">View my bookings</Link>}>
            You already have {upcomingCount} upcoming bookings. Cancel one to book another.
          </Notice>
        )}
        {conflict && (
          <Notice tone="warning" title="Slot conflict" action={<Button variant="secondary" size="sm" onClick={() => slotsQ.refetch()}>Refresh availability</Button>}>
            That slot was just booked by someone else. Please pick another time.
          </Notice>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <DateStrip days={days} selected={date} onSelect={pickDate} isClosed={isClosed} />

          <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
            <div>
              <h2 className="font-display text-headline-sm text-primary">{formatDay(date)} schedule</h2>
              <p className="text-sm text-on-surface-variant">Choose an available {facility.slot_minutes}-minute slot.</p>
            </div>
            <SlotLegend />

            {slotsQ.isPending && <Skeleton className="h-48" />}
            {slotsQ.isError && <ErrorState message={slotsQ.error.message} onRetry={() => slotsQ.refetch()} />}
            {slotsQ.data && slots.length === 0 && (
              <Notice title={`Closed on ${WEEK.find(([k]) => k === weekdayOf(date))?.[1]}s`}
                action={nextOpenDay && <Button variant="secondary" size="sm" onClick={() => pickDate(nextOpenDay)}>Jump to next open day</Button>}>
                There are no slots on this day.
              </Notice>
            )}
            {slots.length > 0 && (
              <SlotGrid slots={slots} selectedStart={selectedSlot?.start ?? null}
                onSelect={(slot) => { setSelectedStart(slot.start); setConflict(false); }} />
            )}
          </section>
        </div>

        <div className="hidden lg:col-span-4 lg:block lg:sticky lg:top-24">
          <BookingSummary facility={facility} slot={selectedSlot} studentName={user?.name ?? ""} studentId={user?.student_id ?? null}
            cutoffMinutes={rules.cancellation_cutoff_minutes} upcomingCount={upcomingCount} maxActive={rules.max_active_bookings}
            blockedReason={blockedReason} onBook={() => setConfirmOpen(true)} />
        </div>
      </div>

      {/* phones: the summary sits below the slot grid */}
      <div className="lg:hidden">
        <BookingSummary facility={facility} slot={selectedSlot} studentName={user?.name ?? ""} studentId={user?.student_id ?? null}
          cutoffMinutes={rules.cancellation_cutoff_minutes} upcomingCount={upcomingCount} maxActive={rules.max_active_bookings}
          blockedReason={blockedReason} onBook={() => setConfirmOpen(true)} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeDialog}
        facility={facility}
        slot={selectedSlot ?? (book.isSuccess ? (slots.find((s) => selectedStart && sameInstant(s.start, selectedStart)) ?? null) : null)}
        cutoffMinutes={rules.cancellation_cutoff_minutes}
        pending={book.isPending}
        success={book.isSuccess}
        errorMessage={book.error && !(book.error instanceof ApiError && book.error.code === "SLOT_TAKEN") ? book.error.message : null}
        onConfirm={() => selectedSlot && book.mutate(selectedSlot.start)}
      />
    </div>
  );
}
