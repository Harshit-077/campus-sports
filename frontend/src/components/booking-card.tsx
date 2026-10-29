import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  MapPin,
  QrCode,
  ShieldAlert,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatRange, minutesUntil, startsInLabel } from "@/lib/format";
import type { Booking } from "@/lib/types";

interface Props {
  booking: Booking;
  nowMs: number;
  cutoffMinutes: number;
  onCancel?: (booking: Booking) => void;
  onViewPass?: (booking: Booking) => void;
}

function StatusChip({ booking, ended }: { booking: Booking; ended: boolean }) {
  if (booking.status === "cancelled") {
    const byAdmin = booking.cancelled_by === "admin";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${
          byAdmin
            ? "bg-error-container text-on-error-container"
            : "bg-surface-container-high text-on-surface-variant"
        }`}
      >
        <ShieldAlert className="size-3" />
        {byAdmin ? "Cancelled by Admin" : "Cancelled by You"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-0.5 text-label-sm font-semibold text-on-primary-fixed">
      <CheckCircle2 className="size-3.5" />
      {ended ? "Completed" : "Confirmed"}
    </span>
  );
}

export function BookingCard({
  booking,
  nowMs,
  cutoffMinutes,
  onCancel,
  onViewPass,
}: Props) {
  const ended = new Date(booking.end).getTime() <= nowMs;
  const live = booking.status === "confirmed" && !ended;
  const minutes = minutesUntil(booking.start, nowMs);
  const canCancel = live && minutes > cutoffMinutes;
  const startsIn = live ? startsInLabel(booking.start, nowMs) : null;
  const token = `TK-${booking.id.slice(-6).toUpperCase()}`;

  return (
    <article className="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm transition-all hover:shadow-md lg:flex-row lg:items-center">
      {/* Left Details */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5 flex-1 min-w-0">
        {/* Athletic Schematic Badge */}
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface-container text-primary-container">
          <Trophy className="size-7" strokeWidth={1.75} />
        </div>

        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-label-sm font-semibold uppercase tracking-wider text-outline">
              {booking.sport.name}
            </span>
            <StatusChip booking={booking} ended={ended} />
            {startsIn && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-label-sm font-semibold ${
                  minutes < 60
                    ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                {startsIn}
              </span>
            )}
          </div>

          <h3 className="font-display text-headline-md font-semibold text-primary truncate">
            {booking.facility.name}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant pt-0.5">
            <span className="flex items-center gap-1.5 font-medium text-on-surface">
              <Clock className="size-3.5 text-primary-container" />
              {formatRange(booking.start, booking.end)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-outline" />
              {booking.facility.location}
            </span>
          </div>

          {booking.status === "cancelled" && booking.cancel_reason && (
            <p className="text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg mt-1 border border-line">
              <strong>Cancellation Reason:</strong> {booking.cancel_reason}
            </p>
          )}
        </div>
      </div>

      {/* Right Side: Turnstile Token & Action Controls */}
      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 border-t border-line sm:border-none pt-4 sm:pt-0 shrink-0">
        {live && (
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 border border-line">
            <QrCode className="size-4 text-primary-container" />
            <span className="font-mono text-xs font-semibold text-primary">
              Token #{token}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {live && onViewPass && (
            <button
              type="button"
              onClick={() => onViewPass(booking)}
              className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-surface-container-high px-4 font-sans text-label-md font-semibold text-primary transition-colors hover:bg-surface-container-highest"
            >
              <QrCode className="size-4" />
              Gate Pass
            </button>
          )}

          {live && onCancel && (
            <div className="flex flex-col items-start sm:items-end">
              <button
                type="button"
                disabled={!canCancel}
                onClick={() => onCancel(booking)}
                className={`flex-1 sm:flex-initial inline-flex h-10 items-center justify-center rounded-xl px-4 font-sans text-label-md font-semibold transition-colors ${
                  canCancel
                    ? "border border-line bg-white text-on-surface-variant hover:border-error/40 hover:bg-error-container/20 hover:text-error"
                    : "bg-surface-container text-outline cursor-not-allowed"
                }`}
              >
                Cancel Booking
              </button>
              {!canCancel && (
                <span className="mt-1 flex items-center gap-1 text-[11px] text-error font-medium">
                  <Lock className="size-3" />
                  Cutoff passed (&le; {cutoffMinutes}m)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
