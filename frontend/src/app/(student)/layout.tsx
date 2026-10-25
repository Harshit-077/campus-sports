import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="student">
      <AppShell variant="student">{children}</AppShell>
    </RequireAuth>
  );
}
