"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

import {
  Bell,
  Check,
  ChevronDown,
  Database,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export interface TabItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface ModuleHeaderProps {
  title: string;
  tabs?: TabItem[];
}

interface ProfileLabel {
  name: string;
  description: string;
  iconLabel: string;
}

const categoryOptions = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Donor conversion", href: "/conv-unit/lead-prospects-list", icon: UserPlus },
  { label: "Donor retention", href: "/retn-unit/donor-profiles-list", icon: RefreshCw },
  { label: "Donor care", href: "/care-unit/transactions-list", icon: Database },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Preferences", href: "/preferences", icon: Sliders },
] as const;

const profileLabel: ProfileLabel = {
  name: "User Profile",
  description: "Placeholder Profile",
  iconLabel: "UP",
};

let notificationCount = 10;

export function Navbar({
  title,
  tabs = []
}: ModuleHeaderProps) {
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryOptions)[number]>(categoryOptions[0]);

  useEffect(() => {
    if (!isCategoryOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isCategoryOpen]);

  const SelectedCategoryIcon = selectedCategory.icon;
  const activeIndex = tabs.findIndex((tab) => tab.isActive) >= 0 ? tabs.findIndex((tab) => tab.isActive) : 0;

  return (
    <header className="bg-white">
      <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 px-2">
          <div className="relative h-9 w-9 overflow-hidden rounded-full shadow-sm">
            <Image
              src="/caritas_logo.png"
              alt="Caritas Manila Logo"
              sizes="36px"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="leading-tight">
            <div className="text-[16px] font-bold text-gray-900">Caritas Manila</div>
            <div className="text-[12px] text-gray-400">FSD Donor System</div>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-300 bg-[var(--surface-soft)] px-3 py-2.5 transition hover:bg-[var(--surface-soft-hover)]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search prospects, donors, transactions or receipt no."
            className="w-full border-none bg-transparent text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="cursor-pointer rounded-xl px-2 py-2 text-[12px] font-semibold text-[#5a2d2d] transition hover:bg-[var(--surface-soft-hover)]"
          >
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </span>
          </button>

          <button
            type="button"
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition hover:bg-[var(--surface-soft-hover)]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-[#4b4b4b]" />
            <span className="absolute -right-0 -top-0 flex h- min-w-[16px] items-center justify-center rounded-full bg-[var(--brand-900)] px-1 text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          </button>

          <button
            className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-[var(--surface-soft-hover)]"
            type="button">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-50)] text-[11px] font-bold text-[var(--brand-900)]">
              {profileLabel.iconLabel}
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[12px] font-medium text-gray-800">
                {profileLabel.name}
              </span>
              <span className="mt-1 text-[10px] text-gray-500">
                {profileLabel.description}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 px-4 py-1">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center">
            <div ref={categoryMenuRef} className="relative flex shrink-0 items-center border-r border-gray-200 pr-4">
              <button
                type="button"
                onClick={() => setIsCategoryOpen((open) => !open)}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-transparent px-2 py-1 text-left text-[15px] font-semibold text-gray-900 transition hover:bg-[var(--surface-soft-hover)]"
              >
                <SelectedCategoryIcon className="h-4 w-4 text-[var(--brand-900)]" />
                <span>{selectedCategory.label}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {isCategoryOpen && (
                <div className="absolute left-0 top-[calc(100%+1px)] z-20 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {categoryOptions.map((category) => {
                    const Icon = category.icon;
                    const isSelected = category.label === selectedCategory.label;

                    return (
                      <button
                        key={category.label}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryOpen(false);
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition",
                          isSelected
                            ? "bg-[var(--brand-100)] text-[var(--brand-900)]"
                            : "text-gray-700 hover:bg-[var(--surface-soft-hover)]"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{category.label}</span>
                        </span>

                        {isSelected && (
                          <Check className="ml-auto h-4 w-4 shrink-0 text-[var(--brand-900)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {tabs.length > 0 && (
              <nav className="ml-4 flex flex-1 items-center gap-4 whitespace-nowrap">
                {tabs.map((tab, index) => {
                  const isActiveTab = index === activeIndex;

                  return (
                    <Link
                      key={tab.label}
                      href={tab.href}
                      className={cn(
                        "relative cursor-pointer rounded-xl px-2 py-1 text-[13px] font-medium transition-colors",
                        isActiveTab ? "text-[var(--brand-900)]" : "text-gray-500 hover:bg-[var(--surface-soft-hover)]"
                      )}
                    >
                      {tab.label}
                      {isActiveTab && (
                        <span className="absolute -bottom-[20%] left-0 right-0 h-[2px] bg-[var(--brand-900)]" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}