import { ArrowRight, CalendarDays, CheckCircle2, Clock, Info, ShieldCheck } from "lucide-react";

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
  const range = slot ? `${formatTime(slot.start)} – ${formatTime(slot.end)}` : null;
  const remaining = Math.max(0, maxActive - upcomingCount);
  const quotaPercent = Math.min(100, Math.round((upcomingCount / maxActive) * 100));

  return (
    <aside className="rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="font-display text-headline-sm font-semibold text-primary">
          Booking Summary
        </h2>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success uppercase tracking-wider">
          <span className="size-1.5 rounded-full bg-success" /> Live Holding
        </span>
      </div>

      {/* Selected Slot Highlight Box */}
      <div className="flex items-center gap-3.5 rounded-xl bg-surface-container-low p-4 border border-line">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary-container text-white shadow-sm">
          <CalendarDays className="size-5" />
        </div>
        {slot ? (
          <div>
            <p className="font-display text-headline-sm font-bold text-primary">{range}</p>
            <p className="text-xs text-on-surface-variant font-medium">{formatDate(slot.start)}</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-on-surface">No slot selected</p>
            <p className="text-xs text-on-surface-variant">Click an open time slot to reserve</p>
          </div>
        )}
      </div>

      {/* Metadata Specification Table */}
      <dl className="space-y-2.5 text-xs border-b border-line pb-4">
        {[
          ["Facility", facility.name],
          ["Sport Category", facility.sport.name],
          ["Location", facility.location],
          ["Booked for", studentId ? `${studentName} (ID: ${studentId})` : studentName],
          ["Access Hub", "Contactless RFID Turnstile"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-on-surface-variant">{label}</dt>
            <dd className="font-semibold text-primary text-right">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Cancellation Notice */}
      <div className="flex gap-2 rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant border border-line">
        <Info className="size-4 shrink-0 text-primary-container mt-0.5" />
        <span>
          Penalty-free cancellation permitted up to {cutoffMinutes} minutes before slot start.
        </span>
      </div>

      {blockedReason && (
        <p className="rounded-lg bg-error-container p-2.5 text-xs text-on-error-container font-medium">
          {blockedReason}
        </p>
      )}

      {/* Single Primary Accent Orange Button */}
      <Button
        variant="accent"
        size="lg"
        className="w-full text-headline-sm font-semibold h-12 shadow-sm"
        disabled={!slot || !!blockedReason}
        onClick={onBook}
      >
        <span>{slot ? `Confirm Booking — ${range}` : "Select a Time Slot"}</span>
        <ArrowRight className="size-4 ml-1" />
      </Button>

      {/* Quota Progress Meter */}
      <div className="rounded-xl bg-surface-container-low p-3.5 border border-line space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-outline uppercase text-[10px] font-semibold">Active Quota</span>
          <span className="font-semibold text-primary">
            {upcomingCount} / {maxActive} slots used
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-container transition-all"
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-on-surface-variant">
          <span>{remaining} booking{remaining === 1 ? "" : "s"} free</span>
          <span className="text-success font-medium">University Fair Play</span>
        </div>
      </div>
    </aside>
  );
}
