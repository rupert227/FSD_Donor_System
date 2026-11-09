import type { ReactNode } from "react";
import { Navbar, NavbarPreset } from "@/components/Navbar";

interface AppShellProps {
  navbarPreset: NavbarPreset;
  children: ReactNode;
}

export function AppShell({ navbarPreset, children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      <div className="flex min-h-screen min-w-0 w-full max-w-full flex-col overflow-x-hidden">
        <Navbar navbarPreset={navbarPreset} />

        <main className="flex-1 bg-[#f7f6f6] p-4 sm:p-6 lg:p-8 min-w-0 w-full max-w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
