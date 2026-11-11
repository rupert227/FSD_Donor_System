"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  allowedModules,
  isUserRole,
  type ModuleKey,
  type UserRole,
} from "@/lib/access";

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
  module?: ModuleKey;
}

interface NavbarProps {
  navbarPreset?: NavbarPreset;
}

interface UserProfile {
  displayName: string;
  username: string;
  email?: string;
  description?: string;
  iconLabel?: string;
}

const moduleOptions: ListOption[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
    module: "dashboard",
  },
  {
    label: "Donor Conversion",
    href: "/donor-conv/prospects",
    icon: UserPlus,
    module: "donor-conv",
  },
  {
    label: "Donor Retention",
    href: "/donor-retn/donors",
    icon: RefreshCw,
    module: "donor-retn",
  },
  {
    label: "Donor Care",
    href: "/donor-care/transactions",
    icon: Database,
    module: "donor-care",
  },
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
    action: async () => {
      await createClient().auth.signOut();
      window.location.href = "/login";
    },
  },
] as const;

const searchBarAction = (input: string) => {
  console.log(`Searched: ${input}`);
};

// "leon_pavino" gives "LP". A single word ("admin") gives its first two letters.
function initialsFrom(name: string): string {
  const words = name.split(/[._\-\s]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function Navbar({
  navbarPreset: {
    selectedModuleIndex = undefined,
    selectedTabIndex = 0,
    tabs = [],
  } = {},
}: NavbarProps) {
  const moduleRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [notificationCount, setNotificationCount] = useState(10);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    displayName: "Loading",
    username: "loading",
    description: "Signed-in user",
    iconLabel: "..",
  });
  const [role, setRole] = useState<UserRole | null>(null);

  // Only the modules this role may open. Cosmetic: the proxy is what enforces it.
  const visibleModules = role
    ? moduleOptions.filter(
        (option) => option.module && allowedModules(role).includes(option.module),
      )
    : [];

  const selectedModule =
    selectedModuleIndex != undefined
      ? moduleOptions[selectedModuleIndex]
      : moduleOptionsPlaceholder;

  const SelectedModuleIcon = selectedModule.icon ?? Dot;

  const displayName = userProfile?.displayName
    ? userProfile.displayName
    : "Unknown Profile";

  const description = userProfile?.description
    ? userProfile.description
    : "No description";

  const iconLabel = userProfile?.iconLabel ? userProfile.iconLabel : "?";

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || cancelled) return;

      const { data: account } = await supabase
        .from("user_accounts")
        .select("email_address, user_role")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle();

      if (!account || cancelled || !isUserRole(account.user_role)) return;

      const email: string = account.email_address;
      // The part before the @ stands in for a name until officer_profiles has real names.
      const name = email.split("@")[0];
      setRole(account.user_role);
      setUserProfile({
        displayName: name,
        username: name,
        email,
        description: account.user_role,
        iconLabel: initialsFrom(name),
      });
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isModuleOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (moduleRef.current && !moduleRef.current.contains(target))
        setIsModuleOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isModuleOpen]);

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
          className="flex cursor-pointer items-center gap-2.5"
        >
          {/* Maroon square with rounded corners and white Caritas Manila logo on top */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#6B0F0F] p-1 shadow-sm">
            <Image
              src="/caritas_nav.png"
              alt="Caritas Manila Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
              priority
              unoptimized
            />
          </div>
          <div className="flex flex-col justify-center leading-tight">
            <p className="text-[85%] xl:text-[87.5%] font-semibold text-text-primary whitespace-nowrap leading-[1.25]">
              Caritas Manila
            </p>
            <p className="text-[72%] xl:text-[75%] font-normal text-text-secondary whitespace-nowrap leading-[1.25]">
              FSD Donor System
            </p>
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
            className="text-text-primary placeholder:text-text-muted mx-2 w-full truncate border-none bg-transparent text-[82%] xl:text-[85%] focus:outline-none"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/notifications"
            type="button"
            className="hover:bg-surface-soft-hover text-text-primary relative flex h-9 w-9 cursor-pointer items-center justify-center self-center rounded-[6px]"
          >
            <Bell className="text-text-secondary h-4 w-4" />
            {notificationCount > 0 && (
              <p className="bg-brand-danger text-surface-white absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-semibold">
                {notificationCount <= 99 ? notificationCount : "99+"}
              </p>
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
              <p className="bg-brand-50 text-brand-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold">
                {iconLabel}
              </p>
              <div className="ml-1.5 flex flex-col items-start leading-[1.3]">
                <p className="text-text-primary max-w-40 truncate text-[0.75rem] font-medium whitespace-nowrap">
                  {displayName}
                </p>
                <p className="text-text-secondary max-w-40 truncate text-[0.7rem] whitespace-nowrap">
                  {description}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "text-text-secondary ml-5 h-4 w-4 shrink-0",
                  isProfileOpen && "rotate-180",
                )}
              />
            </button>
            {isProfileOpen && (
              <div className="scrollbar-primary bg-surface-white overflow-0 border-border-soft absolute top-[calc(100%+1px)] right-0 z-20 max-h-100 w-64 overflow-hidden rounded-[6px] border shadow-lg">
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
                      <p className="truncate text-[0.85rem]">{option.label}</p>
                    </div>
                  );
                })}
                <div className="border-border-strong flex flex-col items-start border-t px-3 py-2">
                  <p className="text-text-primary text-[0.8rem] leading-[1.3] font-medium break-words">
                    {userProfile.email ?? displayName}
                  </p>
                  <p className="text-text-secondary text-[0.75rem] text-wrap">
                    {description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-border-strong flex items-center border-b px-4 py-1.5">
        <div
          ref={moduleRef}
          className="border-border-strong relative flex items-center border-r pr-4"
        >
          <button
            type="button"
            onClick={() => setIsModuleOpen((open) => !open)}
            className="hover:bg-surface-soft-hover text-text-primary flex max-w-60 cursor-pointer items-center gap-2 rounded-[6px] bg-transparent px-2 py-1 font-semibold text-[80%] xl:text-[84%] 2xl:text-[87.5%]"
          >
            <SelectedModuleIcon className="text-brand-primary h-4 w-4 shrink-0" />
            <p className="truncate">{selectedModule.label}</p>
            <ChevronDown
              className={cn(
                "text-text-secondary h-3.5 w-3.5 shrink-0",
                isModuleOpen && "rotate-180",
              )}
            />
          </button>
          {isModuleOpen && (
            <div className="scrollbar-primary bg-surface-white border-border-soft absolute top-[calc(100%+1px)] left-0 z-20 max-h-100 max-w-75 overflow-auto rounded-[6px] border shadow-lg text-[80%] xl:text-[84%] 2xl:text-[87.5%]">
              <div className="w-max">
                {visibleModules.map((option) => {
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
                          "text-text-primary flex items-center gap-2.5 px-3 py-2.5",
                          isSelected
                            ? "bg-brand-100 text-brand-primary"
                            : "hover:bg-surface-soft-hover",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <p className="whitespace-nowrap font-medium">{option.label}</p>
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
                    "relative flex max-w-[18.75rem] cursor-pointer rounded-[6px] px-3 py-1 font-medium text-[80%] xl:text-[84%] 2xl:text-[87.5%]",
                    isActiveTab
                      ? "text-brand-primary font-semibold"
                      : "text-text-primary hover:bg-surface-soft-hover",
                  )}
                >
                  <p className="truncate">{tab.label}</p>
                  {isActiveTab && (
                    <p className="bg-brand-primary absolute right-0 -bottom-[0.38rem] left-0 h-[2px]" />
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
