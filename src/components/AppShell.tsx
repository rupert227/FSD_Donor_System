import type { ReactNode } from "react";

import { Navbar, type ActionButton, type TabItem } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
  title: string;
  subtitle: string;
  tabs?: TabItem[];
  actions?: ActionButton[];
  children: ReactNode;
}

export function AppShell({
  title,
  subtitle,
  tabs = [],
  actions = [],
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            title={title}
            subtitle={subtitle}
            tabs={tabs}
            actions={actions}
          />

          <main className="flex-1 overflow-auto bg-gray-50 p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
