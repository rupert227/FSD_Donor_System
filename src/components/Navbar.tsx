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
  Dot,
  LayoutGrid,
  LucideIcon,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
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

interface ListOption {
  label: string;
  href?: string;
  icon?: LucideIcon;
  action?: () => void;
}

interface NavbarProps {
  navbarPreset: NavbarPreset;
}

interface UserProfile {
  displayName: string;
  username: string;
  description?: string;
  iconLabel?: string;
}

const moduleOptions: ListOption[] = [
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
  { label: "Donor Care", href: "/donor-care/transactions", icon: Database },
] as const;

const moduleOptionsPlaceholder: ListOption = {
  label: "Select Module",
  href: "#",
  icon: Menu,
} as const;

const profileOptions: ListOption[] = [
  {
    label: "Preferences",
    icon: Settings,
    action: () => {
      window.location.href = "/preferences";
    },
  },
  {
    label: "Logout",
    icon: LogOut,
    action: () => {
      console.log("Logged out");
    },
  },
] as const;

const searchBarAction = (input: string) => {
  console.log(`Searched: ${input}`);
};

export function Navbar({
  navbarPreset: { selectedModuleIndex, selectedTabIndex, tabs = [] },
}: NavbarProps) {
  const moduleRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [notificationCount, setNotificationCount] = useState(10);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    displayName: "User Profile",
    username: "user_profile",
    description: "Profile description",
    iconLabel: "UP",
  });

  const selectedModule =
    selectedModuleIndex != null
      ? moduleOptions[selectedModuleIndex]
      : moduleOptionsPlaceholder;

  const SelectedModuleIcon = selectedModule.icon ?? Dot;

  const displayName = userProfile?.displayName
    ? userProfile.displayName
    : "Unknown Profile";

  const username = userProfile?.username
    ? `@${userProfile.username}`
    : "unknown_profile";

  const description = userProfile?.description
    ? userProfile.description
    : "No description";

  const iconLabel = userProfile?.iconLabel ? userProfile.iconLabel : "?";

  useEffect(() => {
    if (!isModuleOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (moduleRef.current && !moduleRef.current.contains(target))
        setIsModuleOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileRef.current && !profileRef.current.contains(target))
        setIsProfileOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isProfileOpen]);

  return (
    <header className="bg-surface-white">
      <div className="border-border-strong flex items-center gap-10 border-b px-4 py-2">
        <div
          onClick={() => {
            window.location.href = "/dashboard";
          }}
          className="flex cursor-pointer items-center gap-2"
        >
          <div className="relative min-h-9 min-w-9 overflow-hidden">
            <Image
              src="/caritas_logo.png"
              alt="Caritas Manila Logo"
              sizes="36px"
              fill
              className="shrink-0 object-cover"
              priority
            />
          </div>
          <div className="leading-tight">
            <div className="text-text-primary font-bold whitespace-nowrap">
              Caritas Manila
            </div>
            <div className="text-text-secondary text-[0.75rem] whitespace-nowrap">
              FSD Donor System
            </div>
          </div>
        </div>
        <div className="bg-surface-soft hover:bg-surface-soft-hover border-border-soft flex h-9 w-200 items-center rounded-[6px] border">
          <Search className="text-text-muted ml-2 h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder="Search prospects, donors, transactions, or receipt numbers"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const input = event.currentTarget.value;

                if (!input || !input.trim().length) return;

                event.preventDefault();
                searchBarAction(event.currentTarget.value);
              }
            }}
            className="text-text-primary placeholder:text-text-muted mx-2 w-full truncate border-none bg-transparent text-[0.9rem] focus:outline-none"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/notifications"
            type="button"
            className="hover:bg-surface-soft-hover text-text-primary relative flex h-9 w-9 cursor-pointer items-center justify-center self-center rounded-[6px]"
          >
            <Bell className="h-4 w-4 text-[#4b4b4b]" />
            {notificationCount > 0 && (
              <span className="bg-brand-danger absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-semibold text-white">
                {notificationCount <= 99 ? notificationCount : "99+"}
              </span>
            )}
          </Link>
          <div
            className="bg-border-strong my-2 w-[1px] self-stretch"
            aria-hidden="true"
          />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              className="hover:bg-surface-soft-hover flex cursor-pointer items-center self-center rounded-[6px] px-2 py-1.5"
            >
              <div className="bg-brand-50 text-brand-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold">
                {iconLabel}
              </div>
              <div className="ml-1.5 flex flex-col items-start leading-[1.3]">
                <span className="text-text-primary max-w-30 truncate text-[0.75rem] font-medium whitespace-nowrap">
                  {displayName}
                </span>
                <span className="text-text-secondary max-w-30 truncate text-[0.7rem] whitespace-nowrap">
                  {description}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "text-text-secondary ml-5 h-4 w-4 shrink-0",
                  isProfileOpen && "rotate-180",
                )}
              />
            </button>
            {isProfileOpen && (
              <div className="scrollbar-primary bg-surface-white overflow-0 border-border-soft absolute top-[calc(100%+1px)] right-0 z-20 max-h-100 w-50 overflow-hidden rounded-[6px] border shadow-lg">
                {profileOptions.map((option) => {
                  const Icon = option.icon ?? Dot;

                  return (
                    <div
                      key={option.label}
                      onClick={() => {
                        setIsProfileOpen(false);
                        option.action?.();
                      }}
                      className={cn(
                        "hover:bg-surface-soft-hover text-text-primary flex cursor-pointer items-center gap-2 px-3 py-1.5",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate text-[0.85rem]">
                        {option.label}
                      </span>
                    </div>
                  );
                })}
                <div className="border-border-strong flex flex-col items-start border-t px-3 py-2">
                  <span className="text-text-primary text-[0.8rem] leading-[1.3] font-medium break-all">
                    {displayName}
                  </span>
                  <span className="text-text-muted mb-1 text-[0.75rem] tracking-tight break-all">
                    {username}
                  </span>
                  <span className="text-text-secondary text-[0.75rem] text-wrap break-all">
                    {description}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-border-strong flex border-b px-4 py-1">
        <div
          ref={moduleRef}
          className="border-border-strong relative flex items-center border-r pr-4"
        >
          <button
            type="button"
            onClick={() => setIsModuleOpen((open) => !open)}
            className="hover:bg-surface-soft-hover text-text-primary flex max-w-60 cursor-pointer items-center gap-3 rounded-[6px] bg-transparent px-2 py-1 font-semibold"
          >
            <SelectedModuleIcon className="text-brand-primary h-4 w-4 shrink-0" />
            <span className="truncate">{selectedModule.label}</span>
            <ChevronDown
              className={cn(
                "text-text-secondary h-4 w-4 shrink-0",
                isModuleOpen && "rotate-180",
              )}
            />
          </button>
          {isModuleOpen && (
            <div className="scrollbar-primary bg-surface-white border-border-soft absolute top-[calc(100%+1px)] left-0 z-20 max-h-100 max-w-75 overflow-auto rounded-[6px] border shadow-lg">
              <div className="w-max">
                {moduleOptions.map((option) => {
                  const Icon = option.icon ?? Dot;
                  const isSelected = option.label === selectedModule.label;

                  return (
                    <Link
                      key={option.label}
                      href={option.href ?? "#"}
                      onClick={() => setIsModuleOpen(false)}
                    >
                      <div
                        className={cn(
                          "text-text-primary flex items-center gap-3 px-3 py-3",
                          isSelected
                            ? "bg-brand-100 text-brand-primary"
                            : "hover:bg-surface-soft-hover",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check className="text-brand-primary ml-auto h-4 w-4 shrink-0" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
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
                    "relative flex max-w-[18.75rem] cursor-pointer rounded-[6px] px-3 py-1 font-medium",
                    isActiveTab
                      ? "text-brand-primary"
                      : "hover:bg-surface-soft-hover",
                  )}
                >
                  <span className="text-text-primary truncate">
                    {tab.label}
                  </span>
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
