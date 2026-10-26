import type { MetadataValue } from "./types";

/** "air_conditioning" -> "Air conditioning" */
export function humanizeKey(key: string): string {
  const spaced = key.replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export interface Chip {
  label: string; // "Surface"
  value: string; // "Wooden"
}

/** Facility metadata as readable label/value pairs (a boolean becomes "Yes"/"No"). */
export function metadataEntries(metadata: Record<string, MetadataValue>): Chip[] {
  return Object.entries(metadata).map(([key, value]) => ({
    label: humanizeKey(key),
    value: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
  }));
}

/** Short chips for a card: true booleans show their name, everything else its value. */
export function metadataChips(metadata: Record<string, MetadataValue>, max = 3): string[] {
  const chips: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (value === false) continue;
    if (value === true) chips.push(humanizeKey(key));
    else if (typeof value === "number") chips.push(`${humanizeKey(key)}: ${value}`);
    else chips.push(value);
  }
  return chips.slice(0, max);
}
