"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  UserPlus,
  RefreshCw,
  Database,
  Bell,
  Sliders,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutGrid,
      },
    ],
  },
  {
    title: "Modules",
    items: [
      {
        name: "Donor conversion",
        href: "/donor-conversion",
        icon: UserPlus,
      },
      {
        name: "Donor retention",
        href: "/donor-retention",
        icon: RefreshCw,
      },
      {
        name: "Donor care",
        href: "/donor-care",
        icon: Database,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        name: "Preferences",
        href: "/preferences",
        icon: Sliders,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-gray-200 bg-white">
      <div className="p-4">
        <div className="mb-6 flex items-center gap-3 px-2 py-1">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#801313]">
            <Image
              src="/caritas_logo.png"
              alt="Caritas Manila Logo"
              fill
              sizes="32px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-gray-900">
              Caritas Manila
            </h1>
            <p className="text-xs text-gray-500">FSD Donor System</p>
          </div>
        </div>

        <nav className="space-y-6">
          {navigationSections.map((section, idx) => (
            <div key={section.title ?? idx}>
              {section.title && (
                <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section.title}
                </h2>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-[#33383F] transition-colors duration-150 hover:bg-[#F0F2F5]",
                        isActive &&
                          "bg-[#FDF2F0] text-[#801313] shadow-sm ring-1 ring-[#F3D1CE]"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-[4px] bg-[#801313]" />
                      )}
                      <Icon
                        className={cn(
                          "relative z-10 h-4 w-4 shrink-0 text-gray-500",
                          isActive && "text-[#801313]"
                        )}
                        style={isActive ? { marginLeft: "10px" } : undefined}
                      />
                      <span className="relative z-10">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-2 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FCE8E6] text-xs font-semibold text-[#801313]">
              CO
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold leading-tight text-gray-900">
                Caritas Officer
              </div>
              <div className="text-[11px] text-gray-500">
                FSD Division Head
              </div>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </div>
    </aside>
  );
}