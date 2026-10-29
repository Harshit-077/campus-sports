"use client";

import { CheckCircle2, GraduationCap, LogOut, ShieldCheck, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-sans text-label-sm font-semibold uppercase tracking-wider">
            <User className="size-3.5 text-primary-container" />
            University Member Profile
          </span>
        </div>
        <h1 className="font-display text-headline-xl font-semibold text-primary tracking-tight sm:text-4xl">
          Account &amp; Credentials
        </h1>
        <p className="text-base text-on-surface-variant">
          Your varsity registration, contactless turnstile identity, and active member status.
        </p>
      </header>

      <div className="rounded-2xl border border-line bg-surface-container-lowest p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-5">
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary-container font-display text-headline-md font-bold text-white shadow-sm"
          >
            {initials || "ST"}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-headline-lg font-semibold text-primary truncate">
              {user.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-0.5 text-label-sm font-semibold text-on-primary-fixed-variant">
                <CheckCircle2 className="size-3" /> Verified {user.role === "admin" ? "Staff" : "Student"}
              </span>
              <span className="text-xs text-outline font-mono">
                Active Member
              </span>
            </div>
          </div>
        </div>

        <dl className="space-y-3.5 text-sm border-t border-line pt-6">
          {[
            ["Registered Email", user.email],
            ["Student ID Number", user.student_id ?? "Not provided"],
            ["Account Role", user.role.toUpperCase()],
            ["Turnstile Pass Status", "NFC / Optical QR Synchronized"],
            ["Booking Quota", "5 Active Concurrent Reservations"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-1">
              <dt className="text-on-surface-variant">{label}</dt>
              <dd className="font-semibold text-primary text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="pt-4 border-t border-line flex items-center justify-between">
          <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-success" /> End-to-end authenticated
          </span>
          <Button variant="secondary" size="md" onClick={logout} className="gap-2">
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
