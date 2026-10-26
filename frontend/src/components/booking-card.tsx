import { CircleCheck, Clock, Lock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatRange, minutesUntil, startsInLabel } from "@/lib/format";
import type { Booking } from "@/lib/types";

interface Props {
  booking: Booking;
  nowMs: number;
  cutoffMinutes: number;
  onCancel?: (booking: Booking) => void;
}

function StatusChip({ booking, ended }: { booking: Booking; ended: boolean }) {
  if (booking.status === "cancelled") {
    const byAdmin = booking.cancelled_by === "admin";
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-label-md ${byAdmin ? "bg-error-container text-on-error-container" : "bg-surface-container-high text-on-surface-variant"}`}>
        {byAdmin ? "Cancelled by admin" : "Cancelled by you"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-0.5 text-label-md text-on-primary-fixed">
      <CircleCheck className="size-3.5" strokeWidth={1.75} aria-hidden /> {ended ? "Completed" : "Confirmed"}
    </span>
  );
}

export function BookingCard({ booking, nowMs, cutoffMinutes, onCancel }: Props) {
  const ended = new Date(booking.end).getTime() <= nowMs;
  const live = booking.status === "confirmed" && !ended;
  const minutes = minutesUntil(booking.start, nowMs);
  const canCancel = live && minutes > cutoffMinutes;
  const startsIn = live ? startsInLabel(booking.start, nowMs) : null;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label-sm uppercase tracking-wide text-outline">{booking.sport.name}</span>
          <StatusChip booking={booking} ended={ended} />
          {startsIn && (
            <span className={`rounded-full px-2.5 py-0.5 text-label-md ${minutes < 60 ? "bg-secondary-fixed text-on-secondary-fixed-variant" : "bg-surface-container text-on-surface"}`}>
              {startsIn}
            </span>
          )}
        </div>
        <h3 className="font-display text-headline-md text-primary">{booking.facility.name}</h3>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" strokeWidth={1.75} aria-hidden /> {formatRange(booking.start, booking.end)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" strokeWidth={1.75} aria-hidden /> {booking.facility.location}
          </span>
        </p>
        {booking.status === "cancelled" && booking.cancel_reason && (
          <p className="text-sm text-on-surface-variant">Reason: {booking.cancel_reason}</p>
        )}
      </div>

      {live && onCancel && (
        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <Button variant="secondary" size="md" disabled={!canCancel} onClick={() => onCancel(booking)}>
            Cancel booking
          </Button>
          {!canCancel && (
            <p className="flex items-center gap-1 text-label-md text-error">
              <Lock className="size-3.5" strokeWidth={1.75} aria-hidden />
              Cancellation closed: starts in {Math.max(minutes, 0)} min ({cutoffMinutes} min policy)
            </p>
          )}
        </div>
      )}
    </article>
  );
}
