"use client";

import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Target, Trophy, User, Users, Waves } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import { buttonStyles } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { catalogApi } from "@/lib/services";
import type { SportCategory } from "@/lib/types";

const ICONS: Record<SportCategory, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  team: Users,
  racquet: Target,
  aquatic: Waves,
  fitness: Dumbbell,
  individual: User,
  other: Trophy,
};

export default function SportsPage() {
  const sports = useQuery({ queryKey: ["sports"], queryFn: catalogApi.sports });
  const facilities = useQuery({
    queryKey: ["facilities", "all"],
    queryFn: () => catalogApi.facilities({ with_availability: true }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-headline-xl text-primary max-sm:text-headline-lg">Sports</h1>
        <p className="mt-1 text-on-surface-variant">Choose a sport to see its facilities.</p>
      </div>

      {sports.isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      )}
      {sports.isError && <ErrorState message={sports.error.message} onRetry={() => sports.refetch()} />}
      {sports.data?.length === 0 && <EmptyState title="No sports have been added yet" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sports.data?.map((sport) => {
          const Icon = ICONS[sport.category];
          const own = (facilities.data ?? []).filter((f) => f.sport.id === sport.id);
          const open = own.reduce((sum, f) => sum + (f.availability?.open_slots_today ?? 0), 0);
          return (
            <article key={sport.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
                  <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="rounded-full bg-tertiary-fixed px-3 py-1 text-label-md capitalize text-on-surface">{sport.category}</span>
              </div>
              <div>
                <h2 className="font-display text-headline-md text-primary">{sport.name}</h2>
                {sport.description && <p className="mt-1 text-sm text-on-surface-variant">{sport.description}</p>}
              </div>
              <p className="mt-auto text-sm text-on-surface-variant">
                {own.length} facilit{own.length === 1 ? "y" : "ies"} - {open} open slot{open === 1 ? "" : "s"} today
              </p>
              <Link href={`/facilities?sport=${sport.id}`} className={buttonStyles("primary", "md")}>
                View facilities
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
