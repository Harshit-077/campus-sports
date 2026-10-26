"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { notificationApi } from "@/lib/services";

export default function NotificationsPage() {
  const nowMs = useNow();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["notifications", "all"], queryFn: () => notificationApi.list({ limit: 100 }) });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: refresh });
  const unread = list.data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-xl text-primary max-sm:text-headline-lg">Notifications</h1>
          <p className="mt-1 text-on-surface-variant">Booking confirmations and changes from administrators.</p>
        </div>
        <Button variant="secondary" disabled={unread === 0} loading={markAll.isPending} onClick={() => markAll.mutate()}>
          Mark all as read
        </Button>
      </div>

      {list.isPending && <Skeleton className="h-40" />}
      {list.isError && <ErrorState message={list.error.message} onRetry={() => list.refetch()} />}
      {list.data?.length === 0 && <EmptyState title="You are all caught up" />}

      <ul className="space-y-3">
        {list.data?.map((n) => {
          const cancelled = n.type === "booking_cancelled_by_admin";
          const Icon = cancelled ? CircleAlert : CircleCheck;
          return (
            <li key={n.id}>
              <Link
                href="/bookings"
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={cn(
                  "flex gap-3 rounded-2xl border p-4 transition-colors hover:bg-surface-container-low",
                  n.read ? "border-line bg-white" : "border-primary-container/30 bg-white",
                )}
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", cancelled ? "bg-error-container text-error" : "bg-primary-fixed text-primary-container")}>
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium text-on-surface">
                    {n.title}
                    {!n.read && <span className="size-2 rounded-full bg-secondary-container" aria-label="Unread" />}
                  </span>
                  <span className="mt-0.5 block text-sm text-on-surface-variant">{n.message}</span>
                  <span className="mt-1 block text-label-sm text-outline">{timeAgo(n.created_at, nowMs)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
