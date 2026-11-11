"use client";

import { Navbar, NavbarPreset } from "@/components/Navbar";
import { type ReactNode } from "react";

interface AppShellProps {
  navbarPreset?: NavbarPreset;
  children: ReactNode;
}

export function AppShell({ navbarPreset, children }: AppShellProps) {
  return (
    <div className="bg-content-background flex min-h-screen flex-col">
      <div className="min-h-navbar-height h-navbar-height max-h-navbar-height no-print fixed top-0 z-50 w-full shadow-sm">
        <Navbar navbarPreset={navbarPreset} />
      </div>

      <main className="m-auto flex w-[90%] max-w-[90%] flex-1 flex-col pt-[calc(var(--content-padding)+var(--navbar-height))] pb-[var(--content-padding)]">
        {children}
      </main>
    </div>
  );
}
