"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarCheck, LayoutDashboard, LogOut, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { notificationApi } from "@/lib/services";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", exact: true, icon: LayoutDashboard },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/facilities", label: "Facilities", icon: MapPin },
  { href: "/bookings", label: "My bookings", icon: CalendarCheck },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/sports", label: "Sports" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
];

const isActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname.startsWith(item.href);

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
      className="relative grid size-10 place-items-center rounded-full text-inverse-on-surface transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container"
    >
      <Bell className="size-[22px]" strokeWidth={1.75} aria-hidden />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-secondary-container px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-primary-container">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span aria-hidden className="grid size-8 place-items-center rounded-full bg-on-primary-fixed-variant text-xs font-semibold text-white">
      {letters || "?"}
    </span>
  );
}

export function AppShell({ variant, children }: { variant: "student" | "admin"; children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const nav = variant === "admin" ? ADMIN_NAV : STUDENT_NAV;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 bg-primary-container">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Link
            href={variant === "admin" ? "/admin" : "/dashboard"}
            className="flex shrink-0 items-center gap-2 font-display text-headline-md text-inverse-on-surface"
          >
            Campus Sports
            {variant === "admin" && (
              <span className="rounded bg-secondary-container px-1.5 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-white">
                Admin
              </span>
            )}
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm transition-colors",
                  isActive(pathname, item)
                    ? "bg-on-primary-fixed-variant font-medium text-white"
                    : "text-on-primary-container hover:bg-on-primary-fixed-variant hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {variant === "student" && <NotificationBell />}
            <div className="flex items-center gap-2 border-l border-on-primary-fixed-variant/40 pl-3">
              <Initials name={user?.name ?? ""} />
              <div className="hidden flex-col leading-tight lg:flex">
                <span className="text-label-lg text-inverse-on-surface">{user?.name}</span>
                {user?.student_id && (
                  <span className="text-label-sm text-on-primary-container">Student ID {user.student_id}</span>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="hidden h-9 items-center rounded-lg border border-outline-variant bg-white px-3 text-label-md text-on-surface transition-colors hover:bg-tertiary-fixed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-container sm:inline-flex"
            >
              Log out
            </button>
            <button
              onClick={logout}
              aria-label="Log out"
              className="grid size-10 place-items-center rounded-full text-inverse-on-surface hover:text-white sm:hidden"
            >
              <LogOut className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        {/* admin pages have no bottom bar, so the links scroll in a row under the header on small screens */}
        {variant === "admin" && (
          <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm",
                  isActive(pathname, item) ? "bg-on-primary-fixed-variant text-white" : "text-on-primary-container",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</main>

      <footer className="hidden border-t border-line bg-surface-container-low md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5 text-sm text-on-surface-variant">
          <span>
            <span className="font-display font-semibold text-primary-container">Campus Sports</span> - University
            athletic facilities portal
          </span>
        </div>
      </footer>

      {variant === "student" && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white md:hidden"
        >
          {STUDENT_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary-container" : "text-on-surface-variant",
                )}
              >
                {Icon && <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
