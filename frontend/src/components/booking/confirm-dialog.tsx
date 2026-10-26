import { Check } from "lucide-react";
import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate, formatTime } from "@/lib/format";
import type { Facility, Slot } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  facility: Facility;
  slot: Slot | null;
  cutoffMinutes: number;
  pending: boolean;
  success: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onClose, facility, slot, cutoffMinutes, pending, success, errorMessage, onConfirm }: Props) {
  const summary = slot && (
    <dl className="space-y-2 rounded-xl bg-surface-container p-4 text-sm">
      {[
        ["Facility", facility.name],
        ["Sport", facility.sport.name],
        ["Date", formatDate(slot.start)],
        ["Time", `${formatTime(slot.start)} - ${formatTime(slot.end)}`],
        ["Location", facility.location],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">{label}</dt>
          <dd className="text-right font-medium text-on-surface">{value}</dd>
        </div>
      ))}
    </dl>
  );

  if (success) {
    return (
      <Modal open={open} onClose={onClose} title="You are booked!">
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-success text-white">
          <Check className="size-8" strokeWidth={2} aria-hidden />
        </div>
        {summary}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href="/bookings" className={buttonStyles("primary", "lg", "flex-1")}>
            View my bookings
          </Link>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Book another
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirm your booking">
      {summary}
      <p className="mt-3 text-sm text-on-surface-variant">
        You can cancel until {cutoffMinutes} minutes before the start.
      </p>
      {errorMessage && (
        <p role="alert" className="mt-3 rounded-xl bg-error-container px-3 py-2 text-sm text-on-error-container">
          {errorMessage}
        </p>
      )}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <Button variant="accent" size="lg" className="flex-1" loading={pending} onClick={onConfirm}>
          Confirm booking
        </Button>
        <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
          Back
        </Button>
      </div>
    </Modal>
  );
}
