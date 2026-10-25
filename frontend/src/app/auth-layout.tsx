import Link from "next/link";
import type { ReactNode } from "react";

/** Shared two-column frame for the login and register screens. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand p-10 text-white md:flex">
        <Link href="/" className="font-display text-lg font-semibold">Campus Sports</Link>
        <div>
          <p className="font-display text-3xl font-semibold leading-snug">Your next game is one booking away.</p>
          <p className="mt-3 max-w-sm text-white/70">Real-time availability for every facility on campus.</p>
        </div>
        <p className="text-xs text-white/50">University sports booking</p>
      </aside>
      <main className="grid place-items-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
