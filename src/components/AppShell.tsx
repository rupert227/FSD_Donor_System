import type { ReactNode } from "react";
import { Navbar, NavbarPreset } from "@/components/Navbar";

interface AppShellProps {
  navbarPreset: NavbarPreset;
  children: ReactNode;
}

export function AppShell({
  navbarPreset,
  children
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen min-w-[var(--min-width)] flex-col">
        <Navbar navbarPreset={navbarPreset} />

        <main className="flex-1 bg-gray-50 p-8">{children}</main>
      </div>
    </div>
  );
}
