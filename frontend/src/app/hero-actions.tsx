"use client";

import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { homeFor, useAuth } from "@/lib/auth";

export function HeroActions() {
  const { status, user } = useAuth();
  if (status === "authenticated" && user) {
    return (
      <Link
        href={homeFor(user.role)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary-container px-6 font-display text-headline-sm text-white shadow-sm transition-all hover:bg-secondary active:translate-y-0.5"
      >
        <LayoutDashboard className="size-5" strokeWidth={1.75} aria-hidden />
        Open my dashboard
      </Link>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/register"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary-container px-6 font-display text-headline-sm text-white shadow-sm transition-all hover:bg-secondary active:translate-y-0.5"
      >
        Create an account
        <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
      </Link>
      <Link
        href="/login"
        className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 font-display text-headline-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        Log in
      </Link>
    </div>
  );
}

