"use client";

import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { homeFor, useAuth } from "@/lib/auth";

export function HeroActions() {
  const { status, user } = useAuth();
  if (status === "authenticated" && user) {
    return (
      <Link href={homeFor(user.role)} className={buttonStyles("accent", "lg")}>
        Open my dashboard
      </Link>
    );
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/register" className={buttonStyles("accent", "lg")}>
        Create an account
      </Link>
      <Link
        href="/login"
        className={buttonStyles("secondary", "lg", "border-white/40 bg-transparent text-white hover:bg-white/10")}
      >
        Log in
      </Link>
    </div>
  );
}
