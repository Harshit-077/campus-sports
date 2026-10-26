import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "info" | "warning" | "danger";

const styles: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: "border-line bg-surface-container-low text-on-surface", icon: Info },
  warning: { box: "border-secondary-container/40 bg-secondary-fixed text-on-secondary-fixed-variant", icon: TriangleAlert },
  danger: { box: "border-error/30 bg-error-container text-on-error-container", icon: CircleAlert },
};

/** An inline message for edge states (slot conflict, closed day, maintenance, limit reached...). */
export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const { box, icon: Icon } = styles[tone];
  return (
    <div role={tone === "info" ? "status" : "alert"} className={cn("flex gap-3 rounded-xl border p-4", box)}>
      <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-label-lg">{title}</p>
        {children && <p className="mt-0.5 text-sm opacity-90">{children}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
