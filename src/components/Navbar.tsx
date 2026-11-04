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
  RefreshCw,
  Search,
  Sliders,
  UserPlus,
} from "lucide-react";

export interface NavbarPreset {
  selectedModuleIndex?: number;
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
    href: "/donor-conv/prospects",
    icon: UserPlus,
  },
  {
    label: "Donor Retention",
    href: "/donor-retn/donors",
    icon: RefreshCw,
  },
  {
    label: "Donor Care",
    href: "/donor-care/transactions",
    icon: Database,
  },
] as const;

const profileLabel: ProfileLabel = {
  name: "User Profile",
  description: "Placeholder Profile",
  iconLabel: "UP",
};

export function Navbar({ navbarPreset }: NavbarProps) {
  const { selectedModuleIndex, selectedTabIndex, tabs = [] } = navbarPreset;
  const moduleMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(10);

  const selectedModule =
    typeof selectedModuleIndex === "number" &&
    selectedModuleIndex >= 0 &&
    selectedModuleIndex < moduleOptions.length
      ? moduleOptions[selectedModuleIndex]
      : null;
  const SelectedModuleIcon = selectedModule?.icon ?? LayoutGrid;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        moduleMenuRef.current &&
        !moduleMenuRef.current.contains(target)
      ) {
        setIsModuleOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="bg-white">
      <div className="flex border-b border-gray-300 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="border-brand-primary bg-brand-primary relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[8px] border-2">
            <Image
              src="/brand/caritas-logo.svg"
              alt="Caritas Manila"
              width={26}
              height={26}
              priority
              className="object-contain"
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

        <div className="mx-6 flex w-md items-center rounded-[6px] bg-gray-100">
          <Search className="mx-2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search prospects, donors, transactions or receipt no."
            className="w-full border-none bg-transparent text-[0.9rem] text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/notifications"
            className="hover:bg-surface-soft-hover relative flex h-9 w-9 cursor-pointer items-center justify-center self-center rounded-[6px] text-gray-600"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-[#4b4b4b]" />
            {notificationCount > 0 && (
              <span className="bg-brand-danger absolute -top-0 -right-0 flex min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-semibold text-white">
                {notificationCount <= 99 ? notificationCount : "99+"}
              </span>
            )}
          </Link>

          <div
            className="my-2 w-[1px] self-stretch bg-gray-300"
            aria-hidden="true"
          />

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              className="hover:bg-surface-soft-hover flex cursor-pointer items-center self-center rounded-[6px] px-2 py-1.5"
              aria-label="User profile menu"
              aria-expanded={isProfileOpen}
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
              <ChevronDown
                className={cn(
                  "ml-5 h-4 w-4 text-gray-400 transition-transform duration-150",
                  isProfileOpen && "rotate-180",
                )}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-56 overflow-hidden rounded-[8px] border border-gray-300 bg-white py-1.5 shadow-lg">
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="text-xs font-semibold text-gray-900">{profileLabel.name}</p>
                  <p className="text-[11px] text-gray-500">{profileLabel.description}</p>
                </div>

                <div className="pt-1">
                  <Link
                    href="/preferences"
                    onClick={() => setIsProfileOpen(false)}
                    className="hover:bg-surface-soft-hover flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 transition-colors"
                  >
                    <Sliders className="h-3.5 w-3.5 text-gray-500" />
                    <span>Preferences</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
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
            <span className="truncate">
              {selectedModule ? selectedModule.label : "Select Division"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
          </button>
          {isModuleOpen && (
            <div className="absolute top-[calc(100%+1px)] left-0 z-20 overflow-hidden rounded-[6px] border border-gray-300 bg-white shadow-lg">
              {moduleOptions.map((module) => {
                const Icon = module.icon;
                const isSelected = module.label === selectedModule?.label;

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
