import type { ReactNode } from "react";
import { Navbar, type TabItem } from "@/components/Navbar";

interface AppShellProps {
  title: string;
  subtitle?: string;
  tabs?: TabItem[];
  children: ReactNode;
}

export function AppShell({
  title,
  subtitle,
  tabs = [],
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen min-w-[var(--min-width)] flex-col">
        <Navbar title={title} tabs={tabs} />

        <main className="flex-1 bg-gray-50 p-8">{children}</main>
      </div>
    </div>
  );
}
