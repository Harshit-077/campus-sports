"use client";

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
    <div className="space-y-6">
      <h1 className="font-display text-headline-xl text-primary max-sm:text-headline-lg">Profile</h1>
      <Card className="max-w-xl space-y-5">
        <div className="flex items-center gap-4">
          <span aria-hidden className="grid size-16 place-items-center rounded-full bg-primary-container font-display text-headline-md text-white">
            {initials}
          </span>
          <div>
            <p className="font-display text-headline-md text-primary">{user.name}</p>
            <Badge tone="neutral" className="capitalize">{user.role}</Badge>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          {[
            ["Email", user.email],
            ["Student ID", user.student_id ?? "Not provided"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-t border-line pt-3">
              <dt className="text-on-surface-variant">{label}</dt>
              <dd className="font-medium text-on-surface">{value}</dd>
            </div>
          ))}
        </dl>
        <Button variant="secondary" onClick={logout}>Log out</Button>
      </Card>
    </div>
  );
}
