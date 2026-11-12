"use client";

import { Navbar, NavbarPreset } from "@/components/Navbar";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

interface AppShellProps {
  navbarPreset?: NavbarPreset;
  children: ReactNode;
}

export function AppShell({ navbarPreset, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="bg-content-background flex min-h-screen flex-col min-w-full w-fit">
      <div className="min-h-navbar-height h-navbar-height max-h-navbar-height no-print fixed top-0 z-50 w-full shadow-sm">
        <Navbar navbarPreset={navbarPreset} />
      </div>

      <main className="mx-auto flex w-[90%] max-w-[90%] flex-1 flex-col pt-[calc(var(--content-padding)+var(--navbar-height))] pb-[var(--content-padding)]">
        <div
          key={pathname}
          className="flex flex-1 flex-col w-full animate-in fade-in duration-300"
        >
          {children}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
