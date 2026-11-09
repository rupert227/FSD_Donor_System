"use client";

import { Navbar, NavbarPreset } from "@/components/Navbar";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

interface AppShellProps {
  navbarPreset: NavbarPreset;
  children: ReactNode;
}

export function AppShell({ navbarPreset, children }: AppShellProps) {
  const [calculatedNavbarHeight, setCalculatedNavbarHeight] = useState("0rem");
  const [contentPadding, setContentPadding] = useState("0rem");
  const [isMeasured, setIsMeasured] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setContentPadding(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--content-padding")
        .trim(),
    );
  }, []);

  useLayoutEffect(() => {
    if (!navbarRef.current) return;

    setCalculatedNavbarHeight(
      `${navbarRef.current.offsetHeight / (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)}rem`,
    );

    setIsMeasured(true);
  }, [navbarPreset]);

  return (
    <div className="bg-content-background min-h-screen">
      <div className="flex min-h-screen flex-col">
        <div ref={navbarRef} className="fixed z-50 w-full shadow-sm">
          <Navbar navbarPreset={navbarPreset} />
        </div>
        <main
          className="flex-1"
          style={{
            padding: contentPadding,
            paddingTop: `calc(${contentPadding} + ${calculatedNavbarHeight})`,
            visibility: isMeasured ? "visible" : "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
