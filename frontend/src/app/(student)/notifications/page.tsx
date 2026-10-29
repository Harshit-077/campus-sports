"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
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
  const list = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => notificationApi.list({ limit: 100 }),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({ mutationFn: notificationApi.markRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: refresh });
  const unread = list.data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-sans text-label-sm font-semibold uppercase tracking-wider">
              <Bell className="size-3.5 text-primary-container" />
              Directives &amp; Confirmations
            </span>
            {unread > 0 && (
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-white">
                {unread} unread
              </span>
            )}
          </div>
          <h1 className="font-display text-headline-xl font-semibold text-primary tracking-tight sm:text-4xl">
            Notifications
          </h1>
          <p className="text-base text-on-surface-variant">
            Live turnstile passes, reservation confirmations, and official notices from facility administration.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          disabled={unread === 0}
          loading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          <Check className="size-4 mr-1.5" />
          Mark all as read
        </Button>
      </div>

      {/* Skeletons & Errors */}
      {list.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {list.isError && (
        <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
      )}

      {list.data?.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface-container-lowest p-12 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
            <Bell className="size-6" strokeWidth={1.75} />
          </div>
          <h3 className="mt-4 font-display text-headline-sm font-semibold text-primary">
            You are all caught up
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            No pending notifications or facility schedule alerts.
          </p>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {list.data?.map((n) => {
          const cancelled = n.type === "booking_cancelled_by_admin";
          const Icon = cancelled ? CircleAlert : CheckCircle2;
          return (
            <Link
              key={n.id}
              href="/bookings"
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={cn(
                "flex items-start gap-4 rounded-2xl border p-5 transition-all hover:shadow-sm",
                n.read
                  ? "border-line bg-surface-container-lowest hover:bg-surface-container-low"
                  : "border-primary-container/40 bg-surface-container-low/60 hover:bg-surface-container-low"
              )}
            >
              <div
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-xl",
                  cancelled
                    ? "bg-error-container text-error"
                    : "bg-primary-fixed text-primary-container"
                )}
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-headline-sm font-semibold text-primary leading-tight">
                    {n.title}
                  </h3>
                  {!n.read && (
                    <span className="size-2 rounded-full bg-secondary-container shrink-0" aria-label="Unread" />
                  )}
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed">{n.message}</p>

                <div className="flex items-center gap-1.5 text-xs text-outline pt-1">
                  <Clock className="size-3" />
                  <span>{timeAgo(n.created_at, nowMs)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
