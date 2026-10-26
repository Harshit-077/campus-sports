import { Check } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatTime, sameInstant } from "@/lib/format";
import type { Slot } from "@/lib/types";

type Visual = "available" | "selected" | "mine" | "booked" | "past" | "unavailable";

function visualOf(slot: Slot, selectedStart: string | null): Visual {
  if (slot.status === "unavailable") return "unavailable";
  if (slot.status === "past") return "past";
  if (slot.status === "booked") return slot.booked_by_me ? "mine" : "booked";
  return selectedStart && sameInstant(slot.start, selectedStart) ? "selected" : "available";
}

const look: Record<Visual, { box: string; tag: string }> = {
  available: { box: "border border-primary-container bg-white text-on-surface hover:bg-surface-container-low", tag: "Open" },
  selected: { box: "bg-secondary-container text-white", tag: "Selected" },
  mine: { box: "bg-primary-container text-white", tag: "Your booking" },
  booked: { box: "cursor-not-allowed bg-slot-booked text-slot-booked-text", tag: "Reserved" },
  past: { box: "cursor-not-allowed text-slot-past-text", tag: "Past" },
  unavailable: { box: "slot-stripes cursor-not-allowed text-on-surface-variant", tag: "Maintenance" },
};

const LEGEND: Array<{ label: string; box: string }> = [
  { label: "Available", box: "border border-primary-container bg-white" },
  { label: "Selected", box: "bg-secondary-container" },
  { label: "Booked by me", box: "bg-primary-container" },
  { label: "Booked", box: "bg-slot-booked" },
  { label: "Past", box: "bg-surface-container-low" },
  { label: "Unavailable", box: "slot-stripes" },
];

export function SlotLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-surface-container-low px-4 py-3 text-label-md text-on-surface-variant">
      {LEGEND.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("size-3.5 rounded", item.box)} /> {item.label}
        </li>
      ))}
    </ul>
  );
}

export function SlotGrid({
  slots,
  selectedStart,
  onSelect,
}: {
  slots: Slot[];
  selectedStart: string | null;
  onSelect: (slot: Slot) => void;
}) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {slots.map((slot) => {
        const visual = visualOf(slot, selectedStart);
        const { box, tag } = look[visual];
        const selectable = visual === "available" || visual === "selected";
        return (
          <li key={slot.start}>
            <button
              disabled={!selectable}
              aria-pressed={visual === "selected"}
              onClick={() => onSelect(slot)}
              className={cn(
                "flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container",
                box,
              )}
            >
              <span className={cn(visual === "past" && "line-through")}>
                {formatTime(slot.start)} - {formatTime(slot.end)}
              </span>
              <span className="flex items-center gap-1 text-label-sm font-normal">
                {(visual === "mine" || visual === "selected") && <Check className="size-3.5" strokeWidth={2} aria-hidden />}
                {tag}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
