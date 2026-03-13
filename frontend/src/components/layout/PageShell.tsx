import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Mobile bottom nav — hidden on desktop */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
