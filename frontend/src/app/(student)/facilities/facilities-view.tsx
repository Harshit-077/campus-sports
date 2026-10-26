"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RotateCcw, Search, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { FacilityCard } from "@/components/facility-card";
import { Button, buttonStyles } from "@/components/ui/button";
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
  // Every facility once: powers the pill counts and "Quick book" (and the list while no filter is set).
  const all = useQuery({
    queryKey: ["facilities", "all"],
    queryFn: () => catalogApi.facilities({ with_availability: true }),
  });

  const noFilters = !sportId && !q && Object.keys(meta).length === 0;
  const filtered = useQuery({
    queryKey: ["facilities", "filtered", sportId, q, meta],
    queryFn: () =>
      catalogApi.facilities({ sport_id: sportId ?? undefined, q: q || undefined, meta, with_availability: true }),
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-xl text-primary max-sm:text-headline-lg">Campus facilities</h1>
          <p className="mt-1 text-on-surface-variant">Browse, filter and check real-time availability.</p>
        </div>
        {quick && (
          <Link href={slotHref(quick)} className={buttonStyles("accent", "lg")}>
            <Zap className="size-5" strokeWidth={1.75} aria-hidden /> Quick book
          </Link>
        )}
      </div>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sport">
          {[{ id: null as string | null, name: "All", count: all.data?.length }, ...(sports.data ?? []).map((s) => ({ id: s.id as string | null, name: s.name, count: counts[s.id] ?? 0 }))].map((pill) => (
            <button
              key={pill.id ?? "all"}
              aria-pressed={sportId === pill.id}
              onClick={() => pickSport(pill.id)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container",
                sportId === pill.id ? "bg-primary-container text-white" : "bg-tertiary-fixed text-on-surface hover:bg-surface-container-high",
              )}
            >
              {pill.name}
              {pill.count !== undefined && ` (${pill.count})`}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-outline" strokeWidth={1.75} aria-hidden />
          <input
            type="search"
            aria-label="Search by name or location"
            placeholder="Search by name or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-surface-container-low pl-10 pr-3 text-sm focus-visible:border-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
          />
        </div>

        {(filterable.length > 0 || !noFilters) && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-3">
            {filterable.map((attr) =>
              attr.type === "enum" ? (
                <label key={attr.key} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm">
                  <span className="text-on-surface-variant">{attr.label}</span>
                  <select
                    value={String(meta[attr.key] ?? "")}
                    onChange={(e) => setMetaValue(attr.key, e.target.value)}
                    className="rounded-md bg-transparent py-1 font-medium text-on-surface focus-visible:outline-2 focus-visible:outline-secondary-container"
                  >
                    <option value="">Any</option>
                    {(attr.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label key={attr.key} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={meta[attr.key] === true}
                    onChange={(e) => setMetaValue(attr.key, e.target.checked ? true : undefined)}
                    className="size-4 accent-primary-container"
                  />
                  {humanizeKey(attr.key)}
                </label>
              ),
            )}
            {!noFilters && (
              <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary-container hover:underline">
                <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden /> Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      <section aria-live="polite" className="space-y-4">
        <h2 className="font-display text-headline-md text-primary">
          {sport ? `${sport.name} facilities` : "All facilities"}
          {list.data && <span className="ml-2 text-sm font-normal text-on-surface-variant">({list.data.length})</span>}
        </h2>

        {list.isPending && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        )}
        {list.isError && <ErrorState message={list.error.message} onRetry={() => list.refetch()} />}
        {list.data?.length === 0 && (
          <EmptyState title="No facilities match your filters">
            <Button variant="secondary" size="sm" className="mt-3" onClick={clearAll}>
              Clear all filters
            </Button>
          </EmptyState>
        )}
        <div className={cn("grid gap-4 lg:grid-cols-2", list.isPlaceholderData && "opacity-60 transition-opacity")}>
          {list.data?.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}
        </div>
      </section>
    </div>
  );
}
