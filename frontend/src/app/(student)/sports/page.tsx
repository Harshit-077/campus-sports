"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Dumbbell,
  Flame,
  Layers,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
  Waves,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { catalogApi } from "@/lib/services";
import type { SportCategory } from "@/lib/types";

const CATEGORY_META: Record<
  SportCategory,
  {
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    pill: string;
    description: string;
  }
> = {
  racquet: {
    icon: Target,
    pill: "bg-secondary-fixed text-on-secondary-fixed-variant",
    description: "Indoor sprung teak courts and championship outdoor hardcourts",
  },
  team: {
    icon: Users,
    pill: "bg-primary-fixed text-on-primary-fixed-variant",
    description: "Varsity hardwood arenas and FIFA-standard synthetic turf fields",
  },
  aquatic: {
    icon: Waves,
    pill: "bg-blue-100 text-blue-900",
    description: "50m Olympic competition pool with dedicated lane booking",
  },
  fitness: {
    icon: Dumbbell,
    pill: "bg-primary-container text-white",
    description: "Performance training, conditioning facilities, and weight rooms",
  },
  individual: {
    icon: User,
    pill: "bg-surface-container-high text-on-surface",
    description: "Track & field, squash singles, and private practice spaces",
  },
  other: {
    icon: Trophy,
    pill: "bg-surface-container text-outline",
    description: "Multipurpose university recreational activity zones",
  },
};

export default function SportsPage() {
  const sports = useQuery({ queryKey: ["sports"], queryFn: catalogApi.sports });
  const facilities = useQuery({
    queryKey: ["facilities", "all"],
    queryFn: () => catalogApi.facilities({ with_availability: true }),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-sans text-label-sm font-semibold uppercase tracking-wider">
            <Trophy className="size-3.5 text-secondary-container" />
            University Athletics Directory
          </span>
          <span className="text-on-surface-variant font-sans text-label-sm">• Term 2</span>
        </div>
        <h1 className="font-display text-headline-xl font-semibold text-primary tracking-tight sm:text-4xl">
          Sports Disciplines
        </h1>
        <p className="text-base text-on-surface-variant max-w-2xl">
          Explore campus sporting categories, check operational court availability, and book your session in seconds.
        </p>
      </header>

      {/* Skeletons & Errors */}
      {sports.isPending && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      )}

      {sports.isError && (
        <ErrorState message={sports.error.message} onRetry={() => sports.refetch()} />
      )}

      {sports.data?.length === 0 && (
        <EmptyState title="No sports have been cataloged yet" />
      )}

      {/* Sport Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sports.data?.map((sport) => {
          const meta = CATEGORY_META[sport.category] ?? CATEGORY_META.other;
          const Icon = meta.icon;
          const own = (facilities.data ?? []).filter((f) => f.sport.id === sport.id);
          const open = own.reduce((sum, f) => sum + (f.availability?.open_slots_today ?? 0), 0);

          return (
            <article
              key={sport.id}
              className="flex flex-col justify-between rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary-container/40 hover:shadow-md"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-label-sm font-semibold capitalize tracking-wide",
                      meta.pill
                    )}
                  >
                    {sport.category}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-headline-md font-semibold text-primary">
                    {sport.name}
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                    {sport.description || meta.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 border-t border-line pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">
                    {own.length} {own.length === 1 ? "facility" : "facilities"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    {open} open slot{open === 1 ? "" : "s"} today
                  </span>
                </div>

                <Link
                  href={`/facilities?sport=${sport.id}`}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-container text-label-md font-semibold text-white shadow-sm transition-colors hover:bg-on-primary-fixed-variant"
                >
                  <span>View Facilities</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
