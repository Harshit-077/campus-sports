"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { cn } from "@/lib/cn";
import { dateParts, todayInCampus } from "@/lib/format";

interface DateStripProps {
  days: string[]; // "YYYY-MM-DD", campus-local, today first
  selected: string;
  onSelect: (day: string) => void;
  isClosed: (day: string) => boolean;
}

export function DateStrip({ days, selected, onSelect, isClosed }: DateStripProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = todayInCampus();
  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-headline-sm text-primary">Select booking date</h2>
          <p className="text-sm text-on-surface-variant">{days.length}-day booking window</p>
        </div>
        <div className="flex gap-1">
          {[
            { label: "Earlier dates", dx: -220, Icon: ChevronLeft },
            { label: "Later dates", dx: 220, Icon: ChevronRight },
          ].map(({ label, dx, Icon }) => (
            <button
              key={label}
              aria-label={label}
              onClick={() => scrollBy(dx)}
              className="grid size-9 place-items-center rounded-lg bg-surface-container text-on-surface hover:bg-tertiary-fixed"
            >
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div ref={scroller} className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => {
          const { weekday, day: dayNumber, month } = dateParts(day);
          const closed = isClosed(day);
          const active = day === selected;
          return (
            <button
              key={day}
              disabled={closed}
              aria-pressed={active}
              onClick={() => onSelect(day)}
              className={cn(
                "w-20 shrink-0 rounded-xl px-2 py-2.5 text-center transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container",
                active && "bg-primary-container text-white",
                !active && !closed && "bg-surface-container-low text-on-surface hover:bg-surface-container",
                closed && "cursor-not-allowed bg-surface-container-low text-outline opacity-50",
              )}
            >
              <span className="block text-label-sm">{day === today ? "Today" : weekday}</span>
              <span className="block font-display text-headline-sm">{dayNumber}</span>
              <span className="mt-1 block text-[10px]">{closed ? "Closed" : month}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
