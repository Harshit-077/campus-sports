import { HeroActions } from "./hero-actions";

const FEATURES = [
  { title: "See what is free", text: "Live availability for every court, field and pool, slot by slot." },
  { title: "Book in a few taps", text: "Pick a sport, a facility and a time. No registers, no group chats." },
  { title: "No double bookings", text: "A slot can only ever be held by one person at a time." },
];

/** Temporary landing page. Replaced by the converted Stitch design (see docs/DESIGN_BRIEF.md). */
export default function LandingPage() {
  return (
    <main>
      <section className="bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">University sports</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Book campus sports facilities without the guesswork.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            Discover courts, fields and pools, check real-time availability and reserve a slot in seconds.
          </p>
          <div className="mt-8">
            <HeroActions />
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-16 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-sage-soft p-6">
            <h2 className="font-display text-lg font-semibold text-ink">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
