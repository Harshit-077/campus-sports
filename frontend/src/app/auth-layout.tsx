import { CheckCircle2, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Shared two-column frame for the login and register screens matching Field & Court. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-12 bg-background">
      {/* Left Collegiate Brand Panel */}
      <aside className="relative hidden md:col-span-5 lg:col-span-6 flex-col justify-between overflow-hidden bg-primary-container p-10 text-white md:flex">
        {/* Subtle geometric circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-96 rounded-full border border-white/10" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 font-display text-headline-md tracking-tight text-white">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-primary-container shadow-sm">
              <Trophy className="size-5" strokeWidth={2.25} />
            </span>
            <span>Campus Sports</span>
            <span className="rounded-full bg-surface-container-lowest/15 px-2 py-0.5 font-sans text-label-sm font-semibold uppercase tracking-wider text-primary-fixed">
              Athletics
            </span>
          </Link>
        </div>

        <div className="relative my-auto max-w-md py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-label-sm font-medium text-primary-fixed backdrop-blur-sm">
            <Sparkles className="size-3.5" /> Official University Facility Portal
          </div>
          <h2 className="mt-4 font-display text-3xl lg:text-4xl font-semibold leading-tight text-white">
            Your next game is one tap away.
          </h2>
          <p className="mt-3 text-base text-white/80">
            Real-time availability for badminton, tennis, basketball, turf pitches, and the Olympic pool.
          </p>

          <div className="mt-8 space-y-3 border-t border-white/15 pt-6 text-sm text-white/85">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-primary-fixed" />
              <span>Instant contactless RFID/QR turnstile access passes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-primary-fixed" />
              <span>Zero double bookings guaranteed by transactional locking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-primary-fixed" />
              <span>Cancel penalty-free up to 60 minutes before slot start</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/60">
          <span>University Sports Administration</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-primary-fixed" /> Active Session
          </span>
        </div>
      </aside>

      {/* Right Form Container */}
      <main className="md:col-span-7 lg:col-span-6 flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden">
            <Link href="/" className="inline-flex items-center gap-2 font-display text-headline-md text-primary">
              <span className="grid size-8 place-items-center rounded-lg bg-primary-container text-white">
                <Trophy className="size-4" />
              </span>
              Campus Sports
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-surface-container-lowest p-7 sm:p-9 shadow-sm">
            <h1 className="font-display text-headline-lg text-primary">{title}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
