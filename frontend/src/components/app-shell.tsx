"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { notificationApi } from "@/lib/services";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/sports", label: "Sports" },
  { href: "/facilities", label: "Facilities" },
  { href: "/bookings", label: "My bookings" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/sports", label: "Sports" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
];

function NotificationBell() {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationApi.unreadCount,
    refetchInterval: 30_000, // simple polling; fine at campus scale
  });
  const count = data?.count ?? 0;
  return (
    <Link
      href="/notifications"
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
      className="relative grid size-10 place-items-center rounded-lg text-ink hover:bg-sage-soft"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export function AppShell({ variant, children }: { variant: "student" | "admin"; children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const nav = variant === "admin" ? ADMIN_NAV : STUDENT_NAV;

  return (
    <div className="min-h-screen bg-sage-soft">
      <header className="sticky top-0 z-10 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href={variant === "admin" ? "/admin" : "/dashboard"} className="font-display text-lg font-semibold text-brand">
            Campus Sports
            {variant === "admin" && <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-xs text-accent-strong">Admin</span>}
          </Link>

          <nav aria-label="Main" className="-mx-1 flex flex-1 gap-1 overflow-x-auto px-1">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                    active ? "bg-brand text-white" : "text-ink hover:bg-sage-soft",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {variant === "student" && <NotificationBell />}
          <div className="hidden items-center gap-3 sm:flex">
            <Link href={variant === "student" ? "/profile" : "/admin"} className="text-sm text-muted hover:text-ink">
              {user?.name}
            </Link>
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
          <Button variant="secondary" size="sm" className="sm:hidden" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
