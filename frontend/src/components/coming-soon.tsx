import { Card } from "@/components/ui/card";

/** Placeholder for a screen that a later step builds, so navigation already works. */
export function ComingSoon({ title, step }: { title: string; step: number }) {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      <Card className="text-sm text-muted">This screen is built in step {step}.</Card>
    </div>
  );
}
