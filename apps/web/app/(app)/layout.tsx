import { AppShell } from "@/components/app-shell";
import { SessionGate } from "@/components/session-gate";

export default function AppLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <SessionGate>
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
