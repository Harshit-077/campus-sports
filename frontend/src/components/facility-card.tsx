import { ArrowRight, LayoutGrid, MapPin, Wrench } from "lucide-react";
import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { buttonStyles } from "@/components/ui/button";
import { dayLabel, formatTime } from "@/lib/format";
import { metadataChips } from "@/lib/humanize";
import type { Facility } from "@/lib/types";

export function FacilityCard({ facility }: { facility: Facility }) {
  const maintenance = facility.status === "maintenance";
  const availability = facility.availability;
  const next = availability?.next_slot;
  const chips = metadataChips(facility.metadata);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label-sm uppercase tracking-wide text-outline">{facility.sport.name}</span>
            <StatusPill status={facility.status} />
          </div>
          <h3 className="mt-1 font-display text-headline-md text-primary">{facility.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
            <MapPin className="size-4 shrink-0" strokeWidth={1.75} aria-hidden /> {facility.location}
          </p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-container text-primary-container">
          {maintenance ? (
            <Wrench className="size-6" strokeWidth={1.75} aria-hidden />
          ) : (
            <LayoutGrid className="size-6" strokeWidth={1.75} aria-hidden />
          )}
        </span>
      </header>

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip} className="rounded-md bg-surface-container px-2 py-1 text-label-md text-on-surface">
              {chip}
            </li>
          ))}
        </ul>
      )}

      {maintenance ? (
        <div className="rounded-xl bg-surface-container p-3 text-sm">
          <p className="font-medium text-on-surface">Under maintenance</p>
          <p className="text-on-surface-variant">Booking is paused until the facility reopens.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-container p-3">
            <p className="text-label-sm text-outline">Slot length</p>
            <p className="mt-0.5 font-display text-headline-sm text-on-surface">{facility.slot_minutes} min</p>
          </div>
          <div className="rounded-xl bg-surface-container p-3">
            <p className="text-label-sm text-outline">Next slot</p>
            <p className="mt-0.5 font-display text-headline-sm text-on-surface">
              {next ? `${dayLabel(next.start)}, ${formatTime(next.start)} - ${formatTime(next.end)}` : "None left today"}
            </p>
          </div>
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between gap-3">
        <span className="text-label-md text-on-surface-variant">
          {!maintenance && availability
            ? `${availability.open_slots_today} open slot${availability.open_slots_today === 1 ? "" : "s"} today`
            : ""}
        </span>
        {maintenance ? (
          <span className="inline-flex h-11 items-center rounded-xl bg-surface-container-high px-4 text-sm font-medium text-on-surface-variant">
            Maintenance active
          </span>
        ) : (
          <Link href={`/facilities/${facility.id}`} className={buttonStyles("primary", "md")}>
            View slots <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </footer>
    </article>
  );
}
