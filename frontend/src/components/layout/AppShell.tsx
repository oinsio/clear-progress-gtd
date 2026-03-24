import { type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-full overflow-hidden bg-white">
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
