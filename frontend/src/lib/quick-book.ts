import type { Facility } from "./types";

/** Active facilities that still have an open slot today, soonest first. */
export function soonestOpenFacilities(facilities: Facility[]): Facility[] {
  return facilities
    .filter((f) => f.status === "active" && f.availability?.next_slot)
    .sort(
      (a, b) =>
        new Date(a.availability!.next_slot!.start).getTime() - new Date(b.availability!.next_slot!.start).getTime(),
    );
}

/** Link that opens the facility with its next free slot already selected. */
export function slotHref(facility: Facility): string {
  const slot = facility.availability?.next_slot;
  return slot ? `/facilities/${facility.id}?slot=${encodeURIComponent(slot.start)}` : `/facilities/${facility.id}`;
}
