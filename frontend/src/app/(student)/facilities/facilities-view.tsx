"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Filter,
  Layers,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FacilityCard } from "@/components/facility-card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { useDebounced } from "@/lib/hooks";
import { humanizeKey } from "@/lib/humanize";
import { slotHref, soonestOpenFacilities } from "@/lib/quick-book";
import { catalogApi } from "@/lib/services";
import type { MetadataValue } from "@/lib/types";

export function FacilitiesView() {
  const [sportId, setSportId] = useState<string | null>(useSearchParams().get("sport"));
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState<Record<string, MetadataValue>>({});
  const q = useDebounced(search.trim());

  const sports = useQuery({ queryKey: ["sports"], queryFn: catalogApi.sports });
  const all = useQuery({
    queryKey: ["facilities", "all"],
    queryFn: () => catalogApi.facilities({ with_availability: true }),
  });

  const noFilters = !sportId && !q && Object.keys(meta).length === 0;
  const filtered = useQuery({
    queryKey: ["facilities", "filtered", sportId, q, meta],
    queryFn: () =>
      catalogApi.facilities({
        sport_id: sportId ?? undefined,
        q: q || undefined,
        meta,
        with_availability: true,
      }),
    enabled: !noFilters,
    placeholderData: keepPreviousData,
  });

  const list = noFilters ? all : filtered;
  const sport = sports.data?.find((s) => s.id === sportId);
  const filterable = (sport?.attributes ?? []).filter((a) => a.type === "enum" || a.type === "boolean");

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const f of all.data ?? []) result[f.sport.id] = (result[f.sport.id] ?? 0) + 1;
    return result;
  }, [all.data]);

  const quick = soonestOpenFacilities(all.data ?? [])[0];

  function pickSport(id: string | null) {
    setSportId(id);
    setMeta({}); // attribute filters belong to one sport
  }

  const clearAll = () => {
    setSportId(null);
    setSearch("");
    setMeta({});
  };

  const setMetaValue = (key: string, value: MetadataValue | undefined) =>
    setMeta((m) => {
      const next = { ...m };
      if (value === undefined || value === "") delete next[key];
      else next[key] = value;
      return next;
    });

  return (
    <div className="space-y-8">
      {/* 1. Header & Overview Statistics */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-sans text-label-sm font-semibold">
              <span className="size-2 rounded-full bg-primary-container" />
              Real-Time Campus Feed
            </span>
            <span className="text-on-surface-variant font-sans text-label-sm">Academic Term 2</span>
          </div>
          <h1 className="font-display text-headline-xl font-semibold text-primary tracking-tight sm:text-4xl">
            Campus Facilities
          </h1>
          <p className="text-base text-on-surface-variant">
            Browse, filter, and inspect live slot availability across all university athletic complexes.
          </p>
        </div>

        {quick && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={slotHref(quick)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary-container px-6 font-display text-headline-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary active:translate-y-0.5"
            >
              <Zap className="size-5" />
              Quick Book Slot
            </Link>
          </div>
        )}
      </header>

      {/* 2. Filter & Search Station */}
      <section className="rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm space-y-5">
        {/* Sport Selectors Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => pickSport(null)}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-full px-5 font-sans text-label-md font-semibold transition-colors whitespace-nowrap",
              sportId === null
                ? "bg-primary-container text-white shadow-sm"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            )}
          >
            All Venues ({all.data?.length ?? 0})
          </button>

          {(sports.data ?? []).map((s) => {
            const count = counts[s.id] ?? 0;
            const active = sportId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSport(s.id)}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-5 font-sans text-label-md font-semibold transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary-container text-white shadow-sm"
                    : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                )}
              >
                <span>{s.name}</span>
                <span className={cn("text-xs font-normal", active ? "text-white/80" : "text-outline")}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Clear Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-outline pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by facility name or building location (e.g. Block A, Arena)..."
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-surface-container-low text-on-surface font-sans text-sm placeholder:text-outline border border-transparent focus:border-primary-container focus:bg-white focus:outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {!noFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-container-low px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface-container"
            >
              <RotateCcw className="size-4" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Dynamic Parametric Sport-Specific Attributes Bar */}
        {filterable.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-3.5 border border-line">
            <span className="font-sans text-label-sm font-semibold uppercase tracking-wider text-outline flex items-center gap-1 mr-1">
              <SlidersHorizontal className="size-3.5" /> Filter {sport?.name}:
            </span>

            {filterable.map((attr) => {
              if (attr.type === "enum" && attr.options) {
                const current = (meta[attr.key] as string) ?? "";
                return (
                  <div key={attr.key} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 border border-line shadow-sm">
                    <label htmlFor={`filter-${attr.key}`} className="text-xs font-medium text-on-surface-variant">
                      {attr.label}:
                    </label>
                    <select
                      id={`filter-${attr.key}`}
                      value={current}
                      onChange={(e) => setMetaValue(attr.key, e.target.value || undefined)}
                      className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
                    >
                      <option value="">All {attr.label}s</option>
                      {attr.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {humanizeKey(opt)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (attr.type === "boolean") {
                const active = meta[attr.key] === true;
                return (
                  <button
                    key={attr.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setMetaValue(attr.key, active ? undefined : true)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors shadow-sm",
                      active
                        ? "bg-primary-container text-white border-primary-container"
                        : "bg-white text-on-surface border-line hover:bg-surface-container"
                    )}
                  >
                    <span>{attr.label}</span>
                    <span className={cn("size-2 rounded-full", active ? "bg-primary-fixed" : "bg-line")} />
                  </button>
                );
              }

              return null;
            })}
          </div>
        )}
      </section>

      {/* 3. Main Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-headline-lg font-semibold text-primary">
            {sport ? `Available ${sport.name} Courts` : "All Campus Facilities"}
          </h2>
          <span className="text-sm text-on-surface-variant">
            ({list.data?.length ?? 0} facilities active)
          </span>
        </div>
      </div>

      {/* 4. Results Grid */}
      {list.isPending && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      )}

      {list.isError && (
        <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
      )}

      {list.data && list.data.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface-container-lowest p-12 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
            <Trophy className="size-6" strokeWidth={1.75} />
          </div>
          <h3 className="mt-4 font-display text-headline-sm font-semibold text-primary">
            No facilities match your filters
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Try adjusting your search query, selecting another sport, or clearing active filters.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary-container px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
          >
            Clear all filters
          </button>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>
      )}
    </div>
  );
}
