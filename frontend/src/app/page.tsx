import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  GraduationCap,
  Layers,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { HeroActions } from "./hero-actions";

const SPORTS_PREVIEW = [
  { name: "Badminton", courts: "6 Courts", type: "Wooden & Taraflex", icon: Trophy, category: "Racquet" },
  { name: "Basketball", courts: "2 Arenas", type: "Maple Hardwood", icon: Dumbbell, category: "Indoor Arena" },
  { name: "Tennis", courts: "4 Courts", type: "Synthetic Hardcourt", icon: Flame, category: "Outdoor Pavilion" },
  { name: "Football", courts: "2 Turfs", type: "FIFA 2-Star Synthetic", icon: Users, category: "South Complex" },
  { name: "Swimming", courts: "8 Lanes", type: "50m Olympic Pool", icon: Waves, category: "Aquatics Center" },
];

const STEPS = [
  {
    step: "01",
    title: "Choose your sport",
    desc: "Browse 8 campus venues across badminton, basketball, tennis, swimming, and outdoor turfs.",
    icon: Trophy,
  },
  {
    step: "02",
    title: "Pick an open slot",
    desc: "View live vacancy in 60-minute windows up to 14 days in advance. Real-time slot locking guarantees zero double-bookings.",
    icon: Clock,
  },
  {
    step: "03",
    title: "Scan turnstile & play",
    desc: "Receive an instant contactless QR gate pass on your phone. Tap at turnstile scanners for effortless entry.",
    icon: QrCode,
  },
];

const GUARANTEES = [
  {
    title: "Zero Double Bookings",
    desc: "Atomic reservation locks ensure a slot can only ever be held by one person at any given second.",
    icon: ShieldCheck,
  },
  {
    title: "Instant Turnstile QR",
    desc: "Automatic gate token generation syncs directly with campus athletic hub RFID turnstiles.",
    icon: QrCode,
  },
  {
    title: "Fair Play Quota System",
    desc: "Balanced 5-slot active reservation allowance ensures equal court access for all university students.",
    icon: Sparkles,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-primary-container/20 bg-primary-container text-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-display text-headline-md tracking-tight text-white">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-primary-container shadow-sm">
              <Trophy className="size-5" strokeWidth={2.25} />
            </span>
            <span>Campus Sports</span>
            <span className="hidden rounded-full bg-surface-container-lowest/15 px-2 py-0.5 font-sans text-label-sm font-semibold uppercase tracking-wider text-primary-fixed sm:inline-block">
              University Athletics
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-1.5 text-label-md font-medium text-on-primary-container transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-secondary-container px-4 text-label-md font-semibold text-white shadow-sm transition-colors hover:bg-secondary"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-container text-white">
        {/* Subtle geometric lines backdrop */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 size-96 rounded-full border-2 border-white/40" />
          <div className="absolute right-0 top-1/2 size-[500px] -translate-y-1/2 rounded-full border border-white/30" />
          <div className="absolute bottom-0 left-1/3 h-48 w-96 border-t-2 border-white/20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 backdrop-blur-sm">
              <span className="size-2 rounded-full bg-secondary-container" />
              <span className="font-sans text-label-sm font-semibold uppercase tracking-wider text-primary-fixed">
                Real-Time Campus Scheduling
              </span>
              <span className="text-white/40">•</span>
              <span className="font-sans text-label-sm text-white/80">Term 2 Academic Session</span>
            </div>

            <h1 className="font-display text-headline-xl text-white sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
              Book campus sports facilities without the guesswork.
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-white/80 sm:text-xl">
              Discover courts, fields, and pools. Check live university availability slot by slot and reserve in under
              30 seconds with automatic gate turnstile access.
            </p>

            <div className="mt-8 sm:mt-10">
              <HeroActions />
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-6">
              <div>
                <p className="font-display text-headline-lg font-semibold text-primary-fixed">8</p>
                <p className="font-sans text-label-sm text-white/70">Athletic Venues</p>
              </div>
              <div>
                <p className="font-display text-headline-lg font-semibold text-primary-fixed">24</p>
                <p className="font-sans text-label-sm text-white/70">Courts & Pools</p>
              </div>
              <div>
                <p className="font-display text-headline-lg font-semibold text-primary-fixed">&lt; 30s</p>
                <p className="font-sans text-label-sm text-white/70">Average Booking Time</p>
              </div>
              <div>
                <p className="font-display text-headline-lg font-semibold text-secondary-container">100%</p>
                <p className="font-sans text-label-sm text-white/70">Turnstile Synchronized</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Campus Directive Strip */}
      <div className="border-y border-line bg-surface-container-low px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-primary-fixed text-primary-container">
              <CheckCircle2 className="size-4" />
            </span>
            <span className="font-medium text-on-surface">Campus Facility Notice:</span>
            <span className="text-on-surface-variant">
              Non-marking rubber soles mandatory on wooden courts. Carry physical student ID card.
            </span>
          </div>
          <div className="flex items-center gap-4 text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> All Venues Open (06:00 – 22:00)
            </span>
            <span>•</span>
            <span>Equipment Lockers Active</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="max-w-2xl">
          <span className="font-sans text-label-sm font-semibold uppercase tracking-wider text-secondary">
            Effortless 3-Step Process
          </span>
          <h2 className="mt-1 font-display text-headline-lg text-primary sm:text-headline-xl">
            From classroom to court in under a minute
          </h2>
          <p className="mt-2 text-on-surface-variant">
            No messy WhatsApp groups, paper signup sheets, or front desk queues. Everything syncs directly with the university schedule.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative flex flex-col justify-between rounded-2xl border border-line bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-primary-container/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-headline-sm font-bold text-secondary-container">
                      {s.step}
                    </span>
                    <span className="grid size-10 place-items-center rounded-xl bg-surface-container-low text-primary-container">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-headline-md text-primary">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{s.desc}</p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 border-t border-line pt-4 font-sans text-label-sm font-medium text-primary-container">
                  <span className="size-1.5 rounded-full bg-primary-container" />
                  Instant confirmation
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sports Showcase */}
      <section className="border-t border-line bg-surface-container-low/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-sans text-label-sm font-semibold uppercase tracking-wider text-secondary">
                Campus Athletics Roster
              </span>
              <h2 className="mt-1 font-display text-headline-lg text-primary sm:text-headline-xl">
                Available Sports & Facilities
              </h2>
              <p className="mt-1 text-on-surface-variant">
                Standardized courts and championship-grade surfaces open daily for university students.
              </p>
            </div>
            <Link
              href="/facilities"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-5 font-sans text-label-md font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container"
            >
              Browse All Facilities
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {SPORTS_PREVIEW.map((sport) => {
              const Icon = sport.icon;
              return (
                <div
                  key={sport.name}
                  className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:border-primary-container/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-xl bg-surface-container text-primary-container">
                        <Icon className="size-6" strokeWidth={1.75} />
                      </span>
                      <span className="rounded-full bg-surface-container-low px-2.5 py-0.5 text-label-sm font-semibold text-primary-container">
                        {sport.courts}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-headline-md text-primary">{sport.name}</h3>
                    <p className="text-xs text-on-surface-variant">{sport.category}</p>
                    <p className="mt-2 text-sm text-outline">{sport.type}</p>
                  </div>
                  <div className="mt-5 border-t border-line pt-3">
                    <span className="inline-flex items-center gap-1 text-label-sm font-medium text-success">
                      <span className="size-1.5 rounded-full bg-success" />
                      Live slots open today
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built for University Excellence / Guarantee */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="rounded-3xl border border-line bg-primary-container p-8 text-white sm:p-12 lg:p-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-sans text-label-sm font-semibold uppercase tracking-wider text-primary-fixed">
              <ShieldCheck className="size-3.5" /> Engineered Reliability
            </span>
            <h2 className="mt-3 font-display text-headline-lg font-semibold leading-tight text-white sm:text-4xl">
              Architected for zero friction, zero double-bookings
            </h2>
            <p className="mt-3 text-base text-white/80 sm:text-lg">
              Campus Sports operates with transactional state isolation. When you tap to reserve a slot, the system locks it exclusively for your student ID, preventing collisions.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {GUARANTEES.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.title} className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                  <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-primary-fixed">
                    <Icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 font-display text-headline-md text-white">{g.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{g.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-surface-container-low text-on-surface-variant">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-primary-container" />
            <span className="font-display font-semibold text-primary-container">Campus Sports</span>
            <span>— University Athletic Facilities Management System</span>
          </div>
          <div className="flex items-center gap-6 text-label-sm">
            <Link href="/login" className="hover:text-primary">
              Student Sign-in
            </Link>
            <Link href="/facilities" className="hover:text-primary">
              Public Directory
            </Link>
            <Link href="/admin" className="hover:text-primary">
              Administration Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
