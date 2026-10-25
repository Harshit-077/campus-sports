"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { ErrorState, FullPageSpinner } from "@/components/ui/states";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

/**
 * Client-side route guard. Not-logged-in visitors go to /login (and come back afterwards);
 * a student opening an admin page (or vice versa) is sent to their own home.
 *
 * This is a usability layer only. Real protection is the backend: every admin endpoint
 * rejects non-admin tokens, whatever the UI shows.
 */
export function RequireAuth({ role, children }: { role: Role; children: ReactNode }) {
  const { status, user, retry } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const wrongRole = status === "authenticated" && user !== null && user.role !== role;

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (wrongRole && user) {
      router.replace(homeFor(user.role));
    }
  }, [status, wrongRole, user, pathname, router]);

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md p-8">
        <ErrorState message="Could not load your account. Check that the backend is running." onRetry={retry} />
      </div>
    );
  }
  if (status !== "authenticated" || wrongRole) return <FullPageSpinner />;
  return <>{children}</>;
}
