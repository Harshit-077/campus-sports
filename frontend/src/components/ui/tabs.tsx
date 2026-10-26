import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="inline-flex gap-1 rounded-full bg-tertiary-fixed p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container",
            value === tab.id ? "bg-primary-container text-white" : "text-on-surface hover:bg-white/60",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "grid min-w-6 place-items-center rounded-full px-1.5 text-xs",
                value === tab.id ? "bg-white/20" : "bg-white",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
