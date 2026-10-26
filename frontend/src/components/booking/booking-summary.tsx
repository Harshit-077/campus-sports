import { ArrowRight, CalendarDays, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/format";
import type { Facility, Slot } from "@/lib/types";

interface Props {
  facility: Facility;
  slot: Slot | null;
  studentName: string;
  studentId: string | null;
  cutoffMinutes: number;
  upcomingCount: number;
  maxActive: number;
  blockedReason: string | null;
  onBook: () => void;
}

export function BookingSummary({
  facility,
  slot,
  studentName,
  studentId,
  cutoffMinutes,
  upcomingCount,
  maxActive,
  blockedReason,
  onBook,
}: Props) {
  const range = slot ? `${formatTime(slot.start)} - ${formatTime(slot.end)}` : null;
  const quota = Math.min(100, Math.round((upcomingCount / maxActive) * 100));

  return (
    <aside className="rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-headline-sm text-primary">Booking summary</h2>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-container p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary-container text-white">
          <CalendarDays className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        {slot ? (
          <div>
            <p className="font-display text-headline-md text-on-surface">{range}</p>
            <p className="text-sm text-on-surface-variant">{formatDate(slot.start)}</p>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Select an open time slot to continue.</p>
        )}
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        {[
          ["Facility", facility.name],
          ["Location", facility.location],
          ["Booked for", studentId ? `${studentName} (${studentId})` : studentName],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">{label}</dt>
            <dd className="text-right font-medium text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 flex gap-2 rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        You can cancel up to {cutoffMinutes} minutes before the start.
      </p>

      {blockedReason && <p className="mt-3 text-sm text-error">{blockedReason}</p>}

      <Button variant="accent" size="lg" className="mt-4 w-full" disabled={!slot || !!blockedReason} onClick={onBook}>
        {slot ? `Book this slot - ${range}` : "Book this slot"}
        <ArrowRight className="size-5" strokeWidth={1.75} aria-hidden />
      </Button>

      <div className="mt-4 rounded-xl bg-surface-container-low p-3">
        <div className="flex justify-between text-label-md text-on-surface-variant">
          <span>Upcoming bookings</span>
          <span>
            {upcomingCount} / {maxActive}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary-container" style={{ width: `${quota}%` }} />
        </div>
      </div>
    </aside>
  );
}
