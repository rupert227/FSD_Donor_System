"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "cn";
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

export interface NavbarPreset {
  selectedModuleIndex: number;
  selectedTabIndex?: number;
  tabs?: TabItem[];
}

export interface TabItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface NavbarProps {
  navbarPreset: NavbarPreset;
}

interface ProfileLabel {
  name: string;
  description: string;
  iconLabel: string;
}

const moduleOptions = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    label: "Donor Conversion",
    href: "/donor-conversion/prospects",
    icon: UserPlus,
  },
  {
    label: "Donor Retention",
    href: "/donor-retention/donors",
    icon: RefreshCw,
  },
  { label: "Donor Care", href: "/donor-care/transactions", icon: Database },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Preferences", href: "/preferences", icon: Sliders },
] as const;

const profileLabel: ProfileLabel = {
  name: "User Profile",
  description: "Placeholder Profile",
  iconLabel: "UP",
};

export function Navbar({ navbarPreset }: NavbarProps) {
  const { selectedModuleIndex, selectedTabIndex, tabs = [] } = navbarPreset;
  const moduleMenuRef = useRef<HTMLDivElement>(null);
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(10);

  const selectedModule = moduleOptions[selectedModuleIndex];
  const SelectedModuleIcon = selectedModule.icon;

  useEffect(() => {
    if (!isModuleOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        moduleMenuRef.current &&
        !moduleMenuRef.current.contains(event.target as Node)
      ) {
        setIsModuleOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isModuleOpen]);

  return (
    <header className="bg-white">
      <div className="flex items-center gap-10 border-b border-gray-300 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="relative min-h-9 min-w-9 overflow-hidden">
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
            <div className="text-[1rem] font-bold whitespace-nowrap text-gray-900">
              Caritas Manila
            </div>
            <div className="text-[0.75rem] whitespace-nowrap text-gray-400">
              FSD Donor System
            </div>
          </div>
        </div>

        <div className="bg-surface-soft hover:bg-surface-soft-hover flex h-9 w-200 items-center rounded-[6px] border border-gray-300">
          <Search className="mx-2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search prospects, donors, transactions or receipt no."
            className="w-full border-none bg-transparent text-[0.9rem] text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="hover:bg-surface-soft-hover cursor-pointer rounded-[6px] border border-gray-300 p-2 text-[0.75rem] font-semibold text-[#5a2d2d]"
          >
            <span className="flex items-center gap-2">
              <Plus className="text-brand-primary h-3.5 w-3.5" />
              <span>New</span>
            </span>
          </button>

          <button
            type="button"
            className="hover:bg-surface-soft-hover relative flex h-9 w-9 cursor-pointer items-center justify-center self-center rounded-[6px] text-gray-600"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-[#4b4b4b]" />
            {notificationCount > 0 && (
              <span className="h- bg-brand-danger absolute -top-0 -right-0 flex min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-semibold text-white">
                {notificationCount <= 99 ? notificationCount : "99+"}
              </span>
            )}
          </button>

          <div
            className="my-2 w-[1px] self-stretch bg-gray-300"
            aria-hidden="true"
          />

          <button
            className="hover:bg-surface-soft-hover flex cursor-pointer items-center self-center rounded-[6px] px-2 py-1.5"
            type="button"
          >
            <div className="bg-brand-50 text-brand-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold">
              {profileLabel.iconLabel}
            </div>
            <div className="ml-1.5 flex flex-col items-start leading-none">
              <span className="max-w-50 truncate text-left text-[0.75rem] font-medium whitespace-nowrap text-gray-800">
                {profileLabel.name}
              </span>
              <span className="mt-1 max-w-50 truncate text-left text-[0.7rem] whitespace-nowrap text-gray-500">
                {profileLabel.description}
              </span>
            </div>
            <ChevronDown className="ml-5 h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-300 px-4 py-1">
        <div
          ref={moduleMenuRef}
          className="relative flex items-center border-r border-gray-300 pr-4"
        >
          <button
            type="button"
            onClick={() => setIsModuleOpen((open) => !open)}
            className="hover:bg-surface-soft-hover flex max-w-60 cursor-pointer items-center gap-2 rounded-[6px] bg-transparent px-2 py-1 text-left text-[1rem] font-semibold text-gray-900"
          >
            <SelectedModuleIcon className="text-brand-primary h-4 w-4 shrink-0" />
            <span className="truncate">{selectedModule.label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
          </button>
          {isModuleOpen && (
            <div className="absolute top-[calc(100%+1px)] left-0 z-20 overflow-hidden rounded-[6px] border border-gray-300 bg-white shadow-lg">
              {moduleOptions.map((module) => {
                const Icon = module.icon;
                const isSelected = module.label === selectedModule.label;

                return (
                  <Link
                    key={module.label}
                    href={module.href}
                    onClick={() => setIsModuleOpen(false)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm",
                      isSelected
                        ? "bg-brand-100 text-brand-primary"
                        : "hover:bg-surface-soft-hover text-gray-700",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="max-w-60 min-w-40 truncate">
                        {module.label}
                      </span>
                    </span>

                    {isSelected && (
                      <Check className="text-brand-primary ml-auto h-4 w-4 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {tabs.length > 0 && (
          <nav className="ml-4 flex flex-1 items-center gap-1 whitespace-nowrap">
            {tabs.map((tab, index) => {
              const isActiveTab = index === selectedTabIndex;

              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "relative flex max-w-[18.75rem] cursor-pointer rounded-[6px] px-3 py-1 text-[1rem] font-medium transition-colors",
                    isActiveTab
                      ? "text-brand-primary"
                      : "hover:bg-surface-soft-hover text-gray-500",
                  )}
                >
                  <span className="truncate">{tab.label}</span>

                  {isActiveTab && (
                    <span className="bg-brand-primary absolute right-0 -bottom-[0.25rem] left-0 h-[2px]" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
