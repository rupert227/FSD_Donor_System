"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Navbar, NavbarPreset } from "@/components/Navbar";

interface AppShellProps {
  navbarPreset: NavbarPreset;
  children: ReactNode;
}

export function AppShell({ navbarPreset, children }: AppShellProps) {
  const [calculatedNavbarHeight, setCalculatedNavbarHeight] = useState("0rem");
  const [contentPadding, setContentPadding] = useState("0rem");

  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContentPadding(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--content-padding")
        .trim(),
    );
  }, []);

  useEffect(() => {
    if (!navbarRef.current) return;

    setCalculatedNavbarHeight(
      `${navbarRef.current.offsetHeight / (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)}rem`,
    );
  }, [navbarPreset]);

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col">
        <div ref={navbarRef} className="fixed z-50 w-full shadow-sm">
          <Navbar navbarPreset={navbarPreset} />
        </div>
        <main
          className="bg-content-background flex-1"
          style={{
            padding: contentPadding,
            paddingTop: `calc(${contentPadding} + ${calculatedNavbarHeight})`,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
