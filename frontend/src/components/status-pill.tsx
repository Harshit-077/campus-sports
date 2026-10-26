import { Wrench } from "lucide-react";

import type { FacilityStatus } from "@/lib/types";

export function StatusPill({ status }: { status: FacilityStatus }) {
  if (status === "maintenance") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2.5 py-0.5 text-label-md text-on-error-container">
        <Wrench className="size-3" strokeWidth={1.75} aria-hidden /> Under maintenance
      </span>
    );
  }
  if (status === "inactive") {
    return <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-md text-on-surface-variant">Inactive</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-0.5 text-label-md text-on-primary-fixed">
      <span className="size-1.5 rounded-full bg-primary-container" aria-hidden /> Operational
    </span>
  );
}
