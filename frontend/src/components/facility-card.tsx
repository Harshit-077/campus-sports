import { ArrowRight, Clock, Layers, MapPin, Wrench, Zap } from "lucide-react";
import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { dayLabel, formatTime } from "@/lib/format";
import { metadataChips } from "@/lib/humanize";
import type { Facility } from "@/lib/types";

export function FacilityCard({ facility }: { facility: Facility }) {
  const maintenance = facility.status === "maintenance";
  const availability = facility.availability;
  const next = availability?.next_slot;
  const chips = metadataChips(facility.metadata);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary-container/40 hover:shadow-md">
      <div className="space-y-4">
        {/* Header Strip */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-sans text-label-sm font-semibold uppercase tracking-wider text-outline">
                {facility.sport.name}
              </span>
              <StatusPill status={facility.status} />
            </div>
            <h3 className="font-display text-headline-md font-semibold text-primary truncate">
              {facility.name}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
              <MapPin className="size-4 shrink-0 text-outline" /> {facility.location}
            </p>
          </div>
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-container text-primary-container">
            {maintenance ? (
              <Wrench className="size-5" strokeWidth={1.75} />
            ) : (
              <Layers className="size-5" strokeWidth={1.75} />
            )}
          </div>
        </div>

        {/* Attribute Metadata Chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-md bg-surface-container px-2.5 py-1 text-label-sm font-medium text-on-surface"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Operating & Slot State Box */}
        {maintenance ? (
          <div className="rounded-xl border border-line p-3.5 slot-stripes text-sm">
            <p className="font-semibold text-on-surface">Scheduled Facility Maintenance</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Court offline for servicing. Bookings will resume once inspection is completed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-surface-container-low p-3">
              <span className="text-outline uppercase text-[10px] font-semibold block">Slot Duration</span>
              <span className="mt-0.5 font-display text-headline-sm font-semibold text-primary">
                {facility.slot_minutes} min
              </span>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <span className="text-outline uppercase text-[10px] font-semibold block">Next Availability</span>
              <span className="mt-0.5 font-display text-xs font-semibold text-primary line-clamp-1">
                {next ? `${formatTime(next.start)} – ${formatTime(next.end)}` : "None left today"}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {next ? dayLabel(next.start) : "Check future dates"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <footer className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div>
          {!maintenance && availability ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
              <span className="size-2 rounded-full bg-success" />
              {availability.open_slots_today} slots free today
            </span>
          ) : (
            <span className="text-xs text-on-surface-variant">Facility offline</span>
          )}
        </div>

        {maintenance ? (
          <span className="inline-flex h-10 items-center rounded-xl bg-surface-container px-4 text-xs font-medium text-outline">
            Maintenance Active
          </span>
        ) : (
          <Link
            href={`/facilities/${facility.id}`}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary-container px-4 text-label-md font-semibold text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
          >
            <span>View Slots</span>
            <ArrowRight className="size-4" />
          </Link>
        )}
      </footer>
    </article>
  );
}
