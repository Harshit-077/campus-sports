import { Check, QrCode } from "lucide-react";
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

export function ConfirmDialog({
  open,
  onClose,
  facility,
  slot,
  cutoffMinutes,
  pending,
  success,
  errorMessage,
  onConfirm,
}: Props) {
  const summary = slot && (
    <dl className="space-y-2 rounded-xl bg-surface-container-low p-4 text-sm border border-line">
      {[
        ["Facility Venue", facility.name],
        ["Sport Category", facility.sport.name],
        ["Reservation Date", formatDate(slot.start)],
        ["Time Window", `${formatTime(slot.start)} – ${formatTime(slot.end)}`],
        ["Building Location", facility.location],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">{label}</dt>
          <dd className="text-right font-semibold text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );

  if (success) {
    return (
      <Modal open={open} onClose={onClose} title="Booking Confirmed!">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-primary-fixed p-3.5 text-primary-container">
            <span className="grid size-10 place-items-center rounded-full bg-primary-container text-white shrink-0">
              <Check className="size-5" strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-primary">Your slot is locked in</p>
              <p className="text-xs text-on-primary-fixed-variant">
                Turnstile gate authorization has been issued to your student account.
              </p>
            </div>
          </div>

          {summary}

          {/* Turnstile Pass Preview */}
          <div className="rounded-xl border border-line bg-surface-container p-4 text-center">
            <div className="mx-auto size-24 bg-white p-2 rounded-lg shadow-sm flex items-center justify-center">
              <svg className="size-20 text-primary-container" fill="currentColor" viewBox="0 0 100 100">
                <rect height="28" rx="2" width="28" x="0" y="0" />
                <rect fill="white" height="20" width="20" x="4" y="4" />
                <rect fill="currentColor" height="12" width="12" x="8" y="8" />
                <rect height="28" rx="2" width="28" x="72" y="0" />
                <rect fill="white" height="20" width="20" x="76" y="4" />
                <rect fill="currentColor" height="12" width="12" x="80" y="8" />
                <rect height="28" rx="2" width="28" x="0" y="72" />
                <rect fill="white" height="20" width="20" x="4" y="76" />
                <rect fill="currentColor" height="12" width="12" x="8" y="80" />
                <rect height="6" width="6" x="36" y="8" />
                <rect height="6" width="12" x="48" y="8" />
                <rect height="8" width="8" x="36" y="20" />
                <rect height="8" width="8" x="52" y="20" />
                <rect height="8" width="8" x="12" y="36" />
                <rect height="8" width="8" x="28" y="36" />
                <rect height="8" width="12" x="44" y="36" />
                <rect height="12" width="8" x="80" y="48" />
                <rect height="8" width="12" x="36" y="68" />
                <rect height="8" width="8" x="36" y="84" />
                <rect height="8" width="16" x="68" y="84" />
              </svg>
            </div>
            <p className="mt-2 font-mono text-xs font-semibold text-primary">
              GATE-PASS-ACTIVE
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Valid at turnstiles starting 10 minutes before slot.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/bookings"
              className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary-container px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
            >
              View My Bookings
            </Link>
            <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
              Book Another
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirm Your Reservation">
      <div className="space-y-4">
        {summary}

        <p className="text-xs text-on-surface-variant rounded-lg bg-surface-container-low p-3 border border-line">
          <strong>Cancellation Policy:</strong> You may cancel this booking penalty-free up to{" "}
          {cutoffMinutes} minutes before the scheduled start time.
        </p>

        {errorMessage && (
          <p role="alert" className="rounded-xl bg-error-container px-3.5 py-2.5 text-sm text-on-error-container font-medium">
            {errorMessage}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            variant="accent"
            size="lg"
            className="flex-1"
            loading={pending}
            onClick={onConfirm}
          >
            Confirm Booking
          </Button>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Back
          </Button>
        </div>
      </div>
    </Modal>
  );
}
