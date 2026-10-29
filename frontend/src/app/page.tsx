"use client";

import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  GraduationCap,
  Info,
  Layers,
  Lock,
  QrCode,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { homeFor, useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

interface SlotItem {
  time: string;
  status: "available" | "booked" | "past" | "mine" | "maintenance";
}

interface CourtRow {
  name: string;
  sub: string;
  slots: SlotItem[];
}

const MATRIX_DATA: CourtRow[] = [
  {
    name: "Badminton 01",
    sub: "Taraflex 1",
    slots: [
      { time: "08:00", status: "past" },
      { time: "10:00", status: "mine" },
      { time: "12:00", status: "booked" },
      { time: "14:00", status: "available" },
      { time: "16:00", status: "available" },
      { time: "18:00", status: "booked" },
    ],
  },
  {
    name: "Basketball B",
    sub: "Hardwood",
    slots: [
      { time: "08:00", status: "past" },
      { time: "10:00", status: "booked" },
      { time: "12:00", status: "maintenance" },
      { time: "14:00", status: "available" },
      { time: "16:00", status: "available" },
      { time: "18:00", status: "available" },
    ],
  },
  {
    name: "Pool Lane 04",
    sub: "50m Lap",
    slots: [
      { time: "08:00", status: "past" },
      { time: "10:00", status: "available" },
      { time: "12:00", status: "booked" },
      { time: "14:00", status: "booked" },
      { time: "16:00", status: "available" },
      { time: "18:00", status: "booked" },
    ],
  },
];

export default function LandingPage() {
  const { status, user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string>("All Sports");
  const [activeSlot, setActiveSlot] = useState<{ court: string; time: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [dayOffset, setDayOffset] = useState<number>(0);

  // 90-second countdown for interactive slot lock demonstration
  useEffect(() => {
    if (!activeSlot) return;
    setTimeLeft(90);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveSlot(null);
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSlot]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSlotClick = (court: string, time: string, slotStatus: string) => {
    if (slotStatus !== "available") return;
    if (activeSlot?.court === court && activeSlot?.time === time) {
      setActiveSlot(null);
    } else {
      setActiveSlot({ court, time });
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-on-surface antialiased flex flex-col">
      {/* 1. Fixed App Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary-container border-b border-outline-variant/30 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center text-primary-container shadow-sm">
              <Trophy className="size-5" strokeWidth={2.25} />
            </div>
            <span className="font-display text-headline-sm text-surface-container-lowest tracking-tight font-semibold">
              Campus Sports
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden sm:flex items-center gap-6 text-sm">
              <Link
                href="/facilities"
                className="text-surface-variant hover:text-surface-container-lowest transition-colors"
              >
                Facilities
              </Link>
              <Link
                href="/facilities"
                className="text-surface-variant hover:text-surface-container-lowest transition-colors"
              >
                Schedule
              </Link>
              {status === "authenticated" && user ? (
                <Link
                  href={homeFor(user.role)}
                  className="text-surface-variant hover:text-surface-container-lowest transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-surface-variant hover:text-surface-container-lowest transition-colors"
                >
                  Log in
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {status === "authenticated" && user ? (
                <Link
                  href={homeFor(user.role)}
                  className="h-10 px-4 bg-secondary-container hover:bg-secondary text-white rounded-lg font-display text-sm font-semibold flex items-center justify-center transition-all shadow-sm"
                >
                  Open Dashboard
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="h-10 px-4 bg-secondary-container hover:bg-secondary text-white rounded-lg font-display text-sm font-semibold flex items-center justify-center transition-all shadow-sm"
                >
                  Create an account
                </Link>
              )}

              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-outline-variant/40 text-on-primary">
                <User className="size-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="w-full pt-16 bg-background flex-1">
        <div className="flex flex-col w-full">
          {/* Top Hero Section (Deep Court Green) */}
          <section className="w-full bg-primary-container text-surface-container-lowest px-4 md:px-8 py-16 md:py-24 relative overflow-hidden">
            {/* Subtle architectural court schematic in background (vector line-work, 1.75px stroke) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-end pr-12 overflow-hidden"
            >
              <svg
                className="text-surface-container-lowest"
                fill="none"
                height="480"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 680 480"
                width="680"
              >
                <rect height="440" rx="16" width="640" x="20" y="20" />
                <line x1="340" x2="340" y1="20" y2="460" />
                <circle cx="340" cy="240" r="70" />
                <circle cx="340" cy="240" r="140" strokeDasharray="8 8" />
                <rect height="160" width="120" x="20" y="160" />
                <rect height="160" width="120" x="540" y="160" />
              </svg>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              {/* Hero Copy Column */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest/10 w-fit backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                  <span className="font-sans text-xs uppercase tracking-wider text-surface-variant font-medium">
                    Campus Athletics Booking Platform
                  </span>
                </div>

                {/* Headline */}
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-surface-container-lowest tracking-tight max-w-2xl leading-tight font-semibold">
                  Book campus sports facilities without the guesswork.
                </h1>

                {/* Supporting Body */}
                <p className="text-base sm:text-lg text-surface-variant max-w-xl leading-relaxed">
                  Check real-time availability across badminton courts, basketball arenas, football turfs, and the
                  Olympic pool, and lock your slot in under 30 seconds.
                </p>

                {/* CTA Row */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {status === "authenticated" && user ? (
                    <Link
                      href={homeFor(user.role)}
                      className="h-12 px-7 bg-secondary-container hover:bg-secondary text-white rounded-xl font-display text-sm font-semibold flex items-center justify-center transition-all shadow-sm"
                    >
                      Open my dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="h-12 px-7 bg-secondary-container hover:bg-secondary text-white rounded-xl font-display text-sm font-semibold flex items-center justify-center transition-all shadow-sm"
                    >
                      Create an account
                    </Link>
                  )}

                  <Link
                    href={status === "authenticated" ? "/facilities" : "/login"}
                    className="h-12 px-6 bg-transparent hover:bg-surface-container-lowest/10 text-surface-container-lowest rounded-xl text-sm font-medium flex items-center justify-center border border-white/20 transition-colors"
                  >
                    {status === "authenticated" ? "Browse facilities" : "Log in"}
                  </Link>

                  <div className="flex items-center gap-1.5 text-surface-variant text-xs font-medium pl-2">
                    <CheckCircle className="size-4 text-primary-fixed" />
                    <span>Zero reservation booking fees</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Miniature 'Live Court Pulse' */}
              <div className="lg:col-span-5 w-full">
                <div className="bg-surface-container-lowest/10 rounded-2xl p-6 backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-display text-headline-sm font-semibold text-surface-container-lowest">
                        Live Court Pulse
                      </span>
                    </div>
                    <span className="text-[11px] text-surface-variant uppercase tracking-wider">
                      Refreshed 4s ago
                    </span>
                  </div>

                  {/* Feed Items */}
                  <div className="space-y-3 pt-4">
                    {/* Feed 1: Badminton */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest/10 transition-colors hover:bg-surface-container-lowest/15">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center text-primary-fixed">
                          <Trophy className="size-4" />
                        </div>
                        <div>
                          <div className="font-display text-sm font-semibold text-surface-container-lowest">
                            Badminton Court 1
                          </div>
                          <div className="text-xs text-surface-variant">North Fieldhouse • Taraflex</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-success/30 text-emerald-300 text-xs font-semibold">
                        Open Now • 2 slots left
                      </span>
                    </div>

                    {/* Feed 2: Basketball */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest/10 transition-colors hover:bg-surface-container-lowest/15">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center text-primary-fixed">
                          <Zap className="size-4" />
                        </div>
                        <div>
                          <div className="font-display text-sm font-semibold text-surface-container-lowest">
                            Basketball Court B
                          </div>
                          <div className="text-xs text-surface-variant">Main Arena • Hardwood Maple</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/20 text-surface-container-lowest text-xs font-semibold">
                        Open 18:00
                      </span>
                    </div>

                    {/* Feed 3: Football Turf */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest/10 transition-colors hover:bg-surface-container-lowest/15">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center text-primary-fixed">
                          <Users className="size-4" />
                        </div>
                        <div>
                          <div className="font-display text-sm font-semibold text-surface-container-lowest">
                            Football Turf
                          </div>
                          <div className="text-xs text-surface-variant">South Stadium • 4G Synthetic</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-warning/30 text-amber-200 text-xs font-semibold">
                        Varsity Training
                      </span>
                    </div>

                    {/* Feed 4: Olympic Pool */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-lowest/10 transition-colors hover:bg-surface-container-lowest/15">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center text-primary-fixed">
                          <Waves className="size-4" />
                        </div>
                        <div>
                          <div className="font-display text-sm font-semibold text-surface-container-lowest">
                            Olympic Pool
                          </div>
                          <div className="text-xs text-surface-variant">Aquatics Pavilion • Heated 26°C</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-success/30 text-emerald-300 text-xs font-semibold">
                        Open Lane 4
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-surface-variant">
                    <span>Automated turnstile syncing active</span>
                    <Link
                      href="/facilities"
                      className="inline-flex items-center gap-1 text-primary-fixed font-semibold hover:underline"
                    >
                      Live status <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Credibility & Stats Ribbon */}
          <section className="w-full bg-surface-container-lowest border-b border-line">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
                <div className="flex flex-col">
                  <span className="font-display text-stat-display font-semibold text-primary-container">
                    14
                  </span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider mt-1 font-semibold">
                    Facilities Managed
                  </span>
                  <span className="text-xs text-outline mt-0.5">Across 3 athletic campuses</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-stat-display font-semibold text-primary-container">
                    &lt; 30s
                  </span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider mt-1 font-semibold">
                    Avg Booking Time
                  </span>
                  <span className="text-xs text-outline mt-0.5">Zero physical wait times</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-stat-display font-semibold text-primary-container">
                    1,400+
                  </span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider mt-1 font-semibold">
                    Active Students
                  </span>
                  <span className="text-xs text-outline mt-0.5">Weekly booking verified</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-stat-display font-semibold text-primary-container">
                    100%
                  </span>
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider mt-1 font-semibold">
                    Turnstile Synced
                  </span>
                  <span className="text-xs text-outline mt-0.5">Instant dynamic QR pass</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. How It Works Section */}
          <section className="w-full px-4 md:px-8 py-16 md:py-24">
            <div className="max-w-7xl mx-auto flex flex-col gap-12">
              <div className="max-w-xl">
                <span className="text-xs uppercase tracking-wider text-outline font-semibold">
                  Effortless Scheduling
                </span>
                <h2 className="font-display text-headline-lg font-semibold text-on-surface mt-2 tracking-tight">
                  How it works
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  Designed for collegiate speed. Secure reserved physical training time in three straightforward steps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="bg-surface-container-lowest rounded-2xl p-7 border border-line flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-primary-container">
                    <Compass className="size-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary uppercase font-semibold">Step 01</span>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface mt-1">
                      Choose a sport
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                      Explore 4 core sports and 14 campus venues with surface specifications, lighting lux, and air
                      conditioning data.
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-line flex items-center gap-2 text-xs text-outline">
                    <Info className="size-4" />
                    <span>Indoor &amp; floodlit outdoor fields</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-surface-container-lowest rounded-2xl p-7 border border-line flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-primary-container">
                    <Calendar className="size-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary uppercase font-semibold">Step 02</span>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface mt-1">
                      Pick a time
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                      View real-time 15-day forward rolling slots with instant conflict prevention. No queues, no
                      clipboards.
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-line flex items-center gap-2 text-xs text-outline">
                    <Lock className="size-4" />
                    <span>Atomic 90-second seat holding</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-surface-container-lowest rounded-2xl p-7 border border-line flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-primary-container">
                    <QrCode className="size-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-xs text-secondary uppercase font-semibold">Step 03</span>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface mt-1">
                      Show up and play
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                      Receive an instant digital turnstile QR gate pass on your phone for seamless 1-tap facility entry.
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-line flex items-center gap-2 text-xs text-outline">
                    <Sparkles className="size-4" />
                    <span>Apple / Google Wallet compatible</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Interactive Sport Directory Row */}
          <section className="w-full bg-surface-container-low px-4 md:px-8 py-16 md:py-20 border-y border-line">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-outline font-semibold">
                    Sports Inventory
                  </span>
                  <h2 className="font-display text-headline-lg font-semibold text-on-surface mt-1 tracking-tight">
                    Select your activity
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Tap a sport to view venue availability specifications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Active Venue Filter:</span>
                  <span className="text-sm font-semibold text-primary-container px-3 py-1 bg-surface-container rounded-full">
                    {selectedSport}
                  </span>
                </div>
              </div>

              {/* Sports Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Badminton */}
                <div
                  onClick={() => setSelectedSport(selectedSport === "Badminton" ? "All Sports" : "Badminton")}
                  className={cn(
                    "cursor-pointer bg-surface-container-lowest rounded-2xl p-6 border transition-all flex flex-col gap-4 shadow-sm",
                    selectedSport === "Badminton"
                      ? "ring-2 ring-primary-container border-primary-container bg-surface-container-low"
                      : "border-line hover:border-primary-container/40 hover:bg-surface-container-low/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary-container flex items-center justify-center">
                      <Trophy className="size-6" strokeWidth={1.75} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold">
                      Racquet
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface">Badminton</h3>
                    <p className="text-xs text-outline mt-0.5">4 Courts • 12 Slots Today</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      9 Open Slots
                    </span>
                    <Link
                      href="/facilities?sport=badminton"
                      className="text-xs font-semibold text-primary-container flex items-center gap-1 hover:underline"
                    >
                      Venues <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Card 2: Football */}
                <div
                  onClick={() => setSelectedSport(selectedSport === "Football" ? "All Sports" : "Football")}
                  className={cn(
                    "cursor-pointer bg-surface-container-lowest rounded-2xl p-6 border transition-all flex flex-col gap-4 shadow-sm",
                    selectedSport === "Football"
                      ? "ring-2 ring-primary-container border-primary-container bg-surface-container-low"
                      : "border-line hover:border-primary-container/40 hover:bg-surface-container-low/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary-container flex items-center justify-center">
                      <Users className="size-6" strokeWidth={1.75} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold">
                      Team
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface">Football</h3>
                    <p className="text-xs text-outline mt-0.5">2 Turfs • 6 Slots Today</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      Peak Demand
                    </span>
                    <Link
                      href="/facilities?sport=football"
                      className="text-xs font-semibold text-primary-container flex items-center gap-1 hover:underline"
                    >
                      Venues <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Card 3: Basketball */}
                <div
                  onClick={() => setSelectedSport(selectedSport === "Basketball" ? "All Sports" : "Basketball")}
                  className={cn(
                    "cursor-pointer bg-surface-container-lowest rounded-2xl p-6 border transition-all flex flex-col gap-4 shadow-sm",
                    selectedSport === "Basketball"
                      ? "ring-2 ring-primary-container border-primary-container bg-surface-container-low"
                      : "border-line hover:border-primary-container/40 hover:bg-surface-container-low/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary-container flex items-center justify-center">
                      <Zap className="size-6" strokeWidth={1.75} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold">
                      Hardwood
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface">Basketball</h3>
                    <p className="text-xs text-outline mt-0.5">3 Arenas • 8 Slots Today</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      4 Open Slots
                    </span>
                    <Link
                      href="/facilities?sport=basketball"
                      className="text-xs font-semibold text-primary-container flex items-center gap-1 hover:underline"
                    >
                      Venues <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Card 4: Swimming */}
                <div
                  onClick={() => setSelectedSport(selectedSport === "Swimming" ? "All Sports" : "Swimming")}
                  className={cn(
                    "cursor-pointer bg-surface-container-lowest rounded-2xl p-6 border transition-all flex flex-col gap-4 shadow-sm",
                    selectedSport === "Swimming"
                      ? "ring-2 ring-primary-container border-primary-container bg-surface-container-low"
                      : "border-line hover:border-primary-container/40 hover:bg-surface-container-low/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary-container flex items-center justify-center">
                      <Waves className="size-6" strokeWidth={1.75} />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold">
                      Aquatic
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface">Swimming</h3>
                    <p className="text-xs text-outline mt-0.5">8 Lanes • 18 Slots Today</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-line/60">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Lane 3 &amp; 4 Open
                    </span>
                    <Link
                      href="/facilities?sport=swimming"
                      className="text-xs font-semibold text-primary-container flex items-center gap-1 hover:underline"
                    >
                      Venues <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Informational Guarantee Band */}
          <section className="w-full px-4 md:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-tertiary-fixed rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-line">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-surface-container-lowest flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-headline-sm font-semibold text-on-surface">
                      No double bookings: a slot can only be held by one person at a time.
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-1 max-w-3xl leading-relaxed">
                      Our atomic turnstile reservation lock prevents race conditions and ensures immediate student
                      validation. When you select a slot, it is cryptographically locked for 90 seconds while you
                      confirm.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary-container text-xs font-semibold shadow-sm">
                    ISO-Compliant Sync
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Interactive Live Timetable Sneak Peek / Campus Court Pulse */}
          <section className="w-full px-4 md:px-8 py-16 md:py-20">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-outline font-semibold">
                    Campus Court Pulse
                  </span>
                  <h2 className="font-display text-headline-lg font-semibold text-on-surface mt-1 tracking-tight">
                    Interactive Timetable Sneak Peek
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Test the live 6-state slot engine. Click any available slot to preview reservation locking.
                  </p>
                </div>

                {/* 6-State Visual Legend */}
                <div className="flex flex-wrap items-center gap-3.5 bg-surface-container-lowest p-3 rounded-xl border border-line text-xs text-on-surface-variant shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-surface-container-lowest border border-primary-container" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-secondary-container" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-[#E5ECE7]" />
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-success flex items-center justify-center text-white text-[9px]">
                      ✓
                    </span>
                    <span>Booked by Me</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg, #E5ECE7, #E5ECE7 4px, #F1F5F2 4px, #F1F5F2 8px)",
                      }}
                    />
                    <span>Maintenance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-transparent text-[#A8B5AE] text-[10px] flex items-center justify-center line-through">
                      10:00
                    </span>
                    <span>Past</span>
                  </div>
                </div>
              </div>

              {/* Schedule Matrix Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 md:p-8 border border-line flex flex-col gap-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <div className="font-display text-headline-sm font-semibold text-on-surface">
                        Fieldhouse Arena: Court Matrix A
                      </div>
                      <div className="text-xs text-outline">Today • Sessions in 60-minute blocks</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDayOffset((d) => d - 1)}
                      className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                      title="Previous Day"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-xs font-semibold px-3 py-1 bg-surface-container-low rounded-lg border border-line">
                      {dayOffset === 0 ? "Today, 24 Oct" : dayOffset > 0 ? `+${dayOffset} Days` : `${dayOffset} Days`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDayOffset((d) => d + 1)}
                      className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                      title="Next Day"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Matrix Timeline */}
                <div className="overflow-x-auto">
                  <div className="min-w-[680px] space-y-4">
                    {MATRIX_DATA.map((row) => (
                      <div key={row.name} className="flex items-center gap-4">
                        <div className="w-36 shrink-0">
                          <span className="font-display text-xs font-semibold text-on-surface block">
                            {row.name}
                          </span>
                          <span className="text-[11px] text-outline">{row.sub}</span>
                        </div>

                        <div className="grid grid-cols-6 gap-2.5 flex-1">
                          {row.slots.map((s, idx) => {
                            const isSelected = activeSlot?.court === row.name && activeSlot?.time === s.time;

                            if (s.status === "past") {
                              return (
                                <div
                                  key={idx}
                                  className="h-11 rounded-xl flex items-center justify-center text-xs text-[#A8B5AE] cursor-not-allowed select-none bg-surface-container-low line-through"
                                >
                                  {s.time}
                                </div>
                              );
                            }

                            if (s.status === "mine") {
                              return (
                                <div
                                  key={idx}
                                  className="h-11 rounded-xl bg-success text-white flex items-center justify-center gap-1 text-xs font-semibold shadow-sm cursor-default"
                                >
                                  <Check className="size-3.5" strokeWidth={2.5} /> {s.time}
                                </div>
                              );
                            }

                            if (s.status === "maintenance") {
                              return (
                                <div
                                  key={idx}
                                  className="h-11 rounded-xl flex items-center justify-center text-xs text-on-surface-variant cursor-not-allowed select-none"
                                  style={{
                                    background:
                                      "repeating-linear-gradient(45deg, #E5ECE7, #E5ECE7 8px, #F1F5F2 8px, #F1F5F2 16px)",
                                  }}
                                >
                                  <span className="text-[10px] font-semibold uppercase">Maint.</span>
                                </div>
                              );
                            }

                            if (s.status === "booked") {
                              return (
                                <div
                                  key={idx}
                                  className="h-11 rounded-xl bg-[#E5ECE7] text-[#8A9A92] flex items-center justify-center text-xs cursor-not-allowed select-none font-medium"
                                >
                                  {s.time}
                                </div>
                              );
                            }

                            // Available Slot
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSlotClick(row.name, s.time, s.status)}
                                className={cn(
                                  "h-11 rounded-xl text-xs font-semibold flex items-center justify-center transition-all border",
                                  isSelected
                                    ? "bg-secondary-container text-white border-secondary-container shadow-sm"
                                    : "bg-surface-container-lowest text-on-surface border-primary-container/70 hover:bg-surface-container hover:border-primary-container"
                                )}
                              >
                                {s.time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selection Summary Bar (Appears when user clicks an available slot) */}
                {activeSlot && (
                  <div className="bg-surface-container p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-line transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        ✓
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-on-surface">Slot held for you: </span>
                        <span className="text-xs text-on-surface-variant font-medium">
                          {activeSlot.court} • {activeSlot.time} (Today)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-outline">
                        Lock expires in{" "}
                        <strong className="text-secondary font-mono">{formatTimer(timeLeft)}</strong>
                      </span>
                      <Link
                        href={status === "authenticated" ? "/facilities" : "/register"}
                        className="px-4 py-2 bg-primary-container text-white text-xs font-semibold rounded-lg hover:opacity-90 shadow-sm transition-opacity"
                      >
                        Continue to Confirm
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 8. Student & Admin Role Highlights */}
          <section className="w-full bg-surface-container-low px-4 md:px-8 py-16 md:py-24 border-t border-line">
            <div className="max-w-7xl mx-auto flex flex-col gap-12">
              <div className="max-w-2xl">
                <span className="text-xs uppercase tracking-wider text-outline font-semibold">
                  Dual Platform Experience
                </span>
                <h2 className="font-display text-headline-lg font-semibold text-on-surface mt-2 tracking-tight">
                  Tailored for athletes and facility directors
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  Whether you are squeezing in a match between lectures or managing complex varsity division
                  schedules, the system provides zero-friction tools.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Student Role Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-8 border border-line flex flex-col gap-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary-container flex items-center justify-center">
                      <GraduationCap className="size-6" strokeWidth={1.75} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                      Student / Player Portal
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface">
                      For Students &amp; Recreational Players
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                      Book within seconds right from your smartphone. No more queuing outside the sports office or
                      waiting for confirmation emails.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="size-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs font-semibold text-on-surface block">
                          Mobile-first slot reservations
                        </strong>
                        <span className="text-xs text-outline">
                          Search by preferred sport, surface type, or time slot.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="size-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs font-semibold text-on-surface block">
                          Turnstile Gate Pass QR
                        </strong>
                        <span className="text-xs text-outline">
                          Instant high-security turnstile barcode directly on lock screen.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="size-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs font-semibold text-on-surface block">
                          Fair play 5-slot quota
                        </strong>
                        <span className="text-xs text-outline">
                          Transparent limits prevent slot hogging and ensure fair student access.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-line">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-container hover:underline"
                    >
                      <span>Explore student features</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Admin Role Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-8 border border-line flex flex-col gap-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary-container flex items-center justify-center">
                      <ShieldCheck className="size-6" strokeWidth={1.75} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                      Athletics Staff Portal
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-headline-md font-semibold text-on-surface">
                      For Facility Managers &amp; Coaches
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                      Complete oversight over venue maintenance cycles, inter-collegiate tournaments, turnstile footfall,
                      and roster lockouts.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="size-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs font-semibold text-on-surface block">
                          Full Schedule Master Matrix
                        </strong>
                        <span className="text-xs text-outline">
                          Block out courts for team practice, deep cleans, or repairs.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="size-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs font-semibold text-on-surface block">
                          Real-time Turnstile Monitoring
                        </strong>
                        <span className="text-xs text-outline">
                          Audit campus ID taps, prevent unauthorized entries, and view occupancy.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="size-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs font-semibold text-on-surface block">
                          Roster overrides &amp; priority scheduling
                        </strong>
                        <span className="text-xs text-outline">
                          Prioritize varsity matches and intramural league matches automatically.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-line">
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-container hover:underline"
                    >
                      <span>View manager documentation</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 9. Final Call to Action Section (Calm Minimal) */}
          <section className="w-full bg-surface-container-lowest px-4 md:px-8 py-16 md:py-20 border-t border-line">
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed text-primary-container flex items-center justify-center shadow-sm">
                <Trophy className="size-7" strokeWidth={1.75} />
              </div>

              <h2 className="font-display text-headline-lg font-semibold text-on-surface tracking-tight sm:text-3xl">
                Ready to take the court today?
              </h2>

              <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
                Sign in with your university student or staff credentials for immediate booking rights across all
                campus athletics locations.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  href="/register"
                  className="h-12 px-8 bg-primary-container hover:bg-on-primary-fixed-variant text-surface-container-lowest rounded-xl font-display text-sm font-semibold flex items-center justify-center transition-all shadow-sm"
                >
                  Get Started with Student ID
                </Link>
                <Link
                  href="/facilities"
                  className="h-12 px-6 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-sm font-semibold flex items-center justify-center transition-colors"
                >
                  View Master Calendar
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 10. Institutional Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs text-on-surface-variant">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary-container font-display text-sm font-semibold">
              <Trophy className="size-4" />
              <span>Collegiate Athletics Division</span>
            </div>
            <p className="text-outline">
              &copy; 2025 University Physical Education &amp; Sports Board. All rights reserved.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-6 font-medium">
            <Link href="/facilities" className="hover:text-on-surface transition-colors">
              Facility Rules
            </Link>
            <Link href="/facilities" className="hover:text-on-surface transition-colors">
              Equipment Hire
            </Link>
            <Link href="/facilities" className="hover:text-on-surface transition-colors">
              Help Desk
            </Link>
            <Link href="/facilities" className="hover:text-on-surface transition-colors">
              Student Guidelines
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
