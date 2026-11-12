"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "cn";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  getLiveNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/prospects/actions";
import {
  allowedModules,
  isUserRole,
  type ModuleKey,
  type UserRole,
} from "@/lib/access";

import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Dot,
  FileText,
  LayoutGrid,
  LucideIcon,
  LogOut,
  Menu,
  Receipt,
  RefreshCw,
  Send,
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

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  module: "Donor Conversion" | "Donor Retention" | "Donor Care" | "System";
  time: string;
  dateGroup: "TODAY" | "YESTERDAY";
  read: boolean;
  type:
    | "recommitted"
    | "prospect"
    | "care_notice"
    | "receipt"
    | "proposal"
    | "followup_due"
    | "overdue"
    | "system";
  isAlert?: boolean;
  assignedOfficer?: string;
  linkUrl?: string;
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

const UNITS = [
  "Donor Conversion",
  "Donor Retention",
  "Donor Care",
] as const;

type UnitName = (typeof UNITS)[number];

const profileOptions: ListOption[] = [
  {
    label: "Logout",
    icon: LogOut,
    action: async () => {
      await createClient().auth.signOut();
      window.location.href = "/login";
    },
  },
] as const;

// "leon_pavino" gives "LP". A single word ("admin") gives its first two letters.
function initialsFrom(name: string): string {
  const words = name.split(/[._\-\s]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
function NotificationCard({
  notif,
  onRead,
}: {
  notif: SystemNotification;
  onRead: () => void;
}) {
  const getIcon = () => {
    switch (notif.type) {
      case "recommitted":
        return <RefreshCw className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
      case "prospect":
        return <UserPlus className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
      case "care_notice":
        return <Send className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
      case "receipt":
        return <Receipt className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
      case "proposal":
        return <FileText className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
      case "followup_due":
      case "overdue":
        return <Clock className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
      case "system":
        return <Database className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
      default:
        return <Bell className="h-3 w-3 xl:h-3.5 xl:w-3.5" />;
    }
  };

  return (
    <div
      onClick={() => {
        onRead();
        if (notif.linkUrl) {
          window.location.href = notif.linkUrl;
        }
      }}
      className={cn(
        "group relative flex items-start gap-2.5 sm:gap-3 rounded-xl px-3.5 py-3 xl:px-4 xl:py-3.5 transition cursor-pointer border bg-white border-[#f0eeee] hover:border-[#ded5d5] hover:bg-[#faf9f9]",
        !notif.read && "shadow-2xs",
      )}
    >
      {/* Sleek compact icon container: reduced size & calibrated grey-red hue */}
      <div className="flex h-7 w-7 xl:h-7.5 xl:w-7.5 shrink-0 items-center justify-center rounded-md bg-[#ede7e7] border border-[#ded5d5] text-[#6e5856] shadow-2xs transition-colors group-hover:bg-[#e6dfdf] mt-0.5">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-baseline justify-between gap-2">
          <h4
            className={cn(
              "text-[12.5px] xl:text-[13.5px] leading-snug truncate",
              notif.read
                ? "font-medium text-[#1b1c19]"
                : "font-semibold text-[#1b1c19]",
            )}
          >
            {notif.title}
          </h4>
          <span className="text-[10px] xl:text-[11px] text-[#8a8484] shrink-0 font-normal whitespace-nowrap">
            {notif.time}
          </span>
        </div>

        <p
          className="text-[11.5px] xl:text-[12.5px] text-[#57423f] leading-snug line-clamp-2 mt-1 break-words"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {notif.message}
        </p>
      </div>

      {/* Unread indicator red dot */}
      {!notif.read && (
        <span className="absolute top-3.5 right-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6b0f0f]" />
      )}
    </div>
  );
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationsExiting, setIsNotificationsExiting] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | "Unread" | "Alerts">("All");

  const [openUnits, setOpenUnits] = useState<Record<UnitName, boolean>>({
    "Donor Conversion": true,
    "Donor Retention": true,
    "Donor Care": true,
  });

  const toggleUnit = (unit: UnitName) => {
    setOpenUnits((prev) => ({ ...prev, [unit]: !prev[unit] }));
  };



  const [userProfile, setUserProfile] = useState<UserProfile>({
    displayName: "Loading",
    username: "loading",
    description: "Signed-in user",
    iconLabel: "..",
  });
  const [role, setRole] = useState<UserRole | null>(null);

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    let isCancelled = false;
    async function loadLiveNotifs() {
      try {
        const live = await getLiveNotifications();
        if (!isCancelled) {
          setNotifications(live || []);
        }
      } catch (err) {
        console.error("Error loading live notifications:", err);
      }
    }
    loadLiveNotifs();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Role- and ownership-based notification filtering:
  // - System Administrator only sees IT/System infrastructure notifications (backups, audits, system alerts)
  // - Division Head oversees all 3 fundraising units (Donor Conversion, Retention, Care)
  // - Donor Care Officer sees Care notices, official receipts, and Care unit alerts
  // - Conversion Officers & Retention Officers only see notices from their unit,
  //   plus personal follow-up reminders and cross-unit handoffs (e.g. receipts) for their owned records.
  const roleFilteredNotifications = notifications.filter((n) => {
    if (!role) {
      return true;
    }

    if (role === "System Administrator") {
      return (
        n.module === "System" ||
        n.type === "system" ||
        n.title.toLowerCase().includes("security") ||
        n.title.toLowerCase().includes("database") ||
        n.title.toLowerCase().includes("backup") ||
        n.title.toLowerCase().includes("audit") ||
        n.title.toLowerCase().includes("system")
      );
    }

    if (role === "Division Head") {
      return n.module !== "System";
    }

    if (role === "Donor Care Officer") {
      return (
        n.module === "Donor Care" ||
        n.type === "care_notice" ||
        n.type === "receipt"
      );
    }

    const officerName = userProfile.displayName?.toLowerCase() || "";
    const isAssignedToMe = Boolean(
      n.assignedOfficer &&
        (officerName.includes(n.assignedOfficer.toLowerCase()) ||
          n.assignedOfficer.toLowerCase().includes(officerName) ||
          n.assignedOfficer
            .toLowerCase()
            .split(" ")
            .some((part) => part.length > 2 && officerName.includes(part)))
    );

    if (n.type === "followup_due" || n.type === "overdue") {
      return isAssignedToMe;
    }

    const myUnit =
      role === "Conversion Officer"
        ? "Donor Conversion"
        : role === "Retention Officer"
          ? "Donor Retention"
          : null;

    if (myUnit && n.module === myUnit) {
      return true;
    }

    if (n.type === "receipt" && isAssignedToMe) {
      return true;
    }

    return false;
  });

  const isDivisionHead = role === "Division Head";

  const unreadCount = roleFilteredNotifications.filter((n) => !n.read).length;

  const closeNotificationsPanel = useCallback(() => {
    setIsNotificationsExiting(true);
    setTimeout(() => {
      setIsNotificationsOpen(false);
      setIsNotificationsExiting(false);
    }, 240);
  }, []);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("Error marking all notifications read in DB:", err);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error("Error marking notification read in DB:", err);
    }
  };

  const filteredNotifications = roleFilteredNotifications.filter((n) => {
    if (activeTab === "Unread") return !n.read;
    if (activeTab === "Alerts") return n.isAlert;
    return true;
  });

  const todayNotifications = filteredNotifications.filter(
    (n) => n.dateGroup === "TODAY",
  );
  const yesterdayNotifications = filteredNotifications.filter(
    (n) => n.dateGroup === "YESTERDAY",
  );

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNotificationsPanel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNotificationsOpen, closeNotificationsPanel]);



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
        .select("email_address, user_role, officer_profiles(full_name)")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle();

      if (!account || cancelled || !isUserRole(account.user_role)) return;

      const email: string = account.email_address;
      // officer_profiles is one-to-one with user_accounts, but guard against an array just in case.
      const profile = Array.isArray(account.officer_profiles)
        ? account.officer_profiles[0]
        : account.officer_profiles;
      // Accounts with no officer_profiles row fall back to the part before the @.
      const name: string = profile?.full_name?.trim() || email.split("@")[0];
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
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isNotificationsOpen) {
                closeNotificationsPanel();
              } else {
                setIsNotificationsOpen(true);
                setIsProfileOpen(false);
              }
            }}
            className={cn(
              "hover:bg-surface-soft-hover text-text-primary relative flex h-9 w-9 cursor-pointer items-center justify-center self-center rounded-[6px] transition-colors",
              isNotificationsOpen && "bg-surface-soft text-[#6b0f0f]",
            )}
            aria-label="View notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="text-text-secondary h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#6b0f0f]" />
            )}
          </button>
          <div
            className="bg-border-strong my-2 w-[1px] self-stretch"
            aria-hidden="true"
          />
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((open) => !open);
                setIsNotificationsOpen(false);
              }}
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
                  {userProfile.email ?? description}
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
                    {displayName}
                  </p>
                  {userProfile.email && (
                    <p className="text-text-secondary text-[0.75rem] break-all">
                      {userProfile.email}
                    </p>
                  )}
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

      {/* 13.1_NOTIFICATIONS PANEL - SLIDE-OVER FROM RIGHT */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div
            className={cn(
              "fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-240",
              isNotificationsExiting
                ? "opacity-0"
                : "opacity-100 animate-in fade-in duration-200",
            )}
            onClick={closeNotificationsPanel}
          />

          {/* Right Slide-over Panel (25% screen width, protected min-width on narrow screens) */}
          <div
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex flex-col bg-white border-l border-[#e3dfdf] shadow-2xl transition-transform duration-240 ease-out",
              "w-[25vw] min-w-[320px] sm:min-w-[340px] max-w-full",
              isNotificationsExiting
                ? "translate-x-full"
                : "translate-x-0 animate-in slide-in-from-right duration-240",
            )}
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex h-[56px] xl:h-[62px] items-center border-b border-[#e3dfdf] px-4 sm:px-5 xl:px-6 bg-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={closeNotificationsPanel}
                  className="flex h-7 w-7 xl:h-8 xl:w-8 items-center justify-center rounded-md text-[#5c5757] hover:bg-[#f0eeee] hover:text-[#1c1a1a] transition cursor-pointer shrink-0"
                  aria-label="Close notifications panel"
                >
                  <ArrowRight className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
                </button>
                <h2 className="text-[15px] xl:text-[17px] font-bold text-[#1b1c19] truncate">
                  Notifications
                </h2>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex h-[42px] xl:h-[46px] items-center justify-between border-b border-[#e3dfdf] px-4 sm:px-5 xl:px-6 bg-white shrink-0 gap-2">
              <div className="flex items-center gap-3.5 sm:gap-4.5 shrink-0">
                {(["All", "Unread", "Alerts"] as const).map((tab) => {
                  const isActive = activeTab === tab;
                  const count =
                    tab === "All"
                      ? roleFilteredNotifications.length
                      : tab === "Unread"
                      ? unreadCount
                      : roleFilteredNotifications.filter((n) => n.isAlert).length;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "relative flex items-center gap-1.5 py-2 text-[12px] xl:text-[13px] transition-colors cursor-pointer whitespace-nowrap",
                        isActive
                          ? "text-[#6b0f0f] font-semibold border-b-2 border-[#6b0f0f]"
                          : "text-[#5f5e5e] hover:text-[#1b1c19] border-b-2 border-transparent",
                      )}
                    >
                      <span>{tab}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[9.5px] xl:text-[10px]",
                          isActive
                            ? "bg-[#ede7e7] text-[#6e5856] font-semibold"
                            : "bg-[#f0eeee] text-[#5c5757]",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] xl:text-[12px] font-medium text-[#6b0f0f] hover:text-[#520b0b] transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Scrollable Notifications List */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 xl:px-6 py-4 space-y-3.5">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center text-[#5c5757]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede7e7] text-[#6e5856] mb-2.5">
                    <Bell className="h-4 w-4" />
                  </div>
                  <p className="text-[13px] xl:text-[14px] font-medium text-[#1b1c19]">
                    No notifications
                  </p>
                  <p className="text-[11px] xl:text-[12px] text-[#5c5757] mt-0.5">
                    {activeTab === "Unread"
                      ? "You've read all your notifications."
                      : "There are no notifications in this category."}
                  </p>
                </div>
              ) : isDivisionHead ? (
                /* PLAIN TEXT UNIT HEADERS WITH DROPDOWN ICONS (FSD Division Head only) */
                <div className="space-y-4">
                  {UNITS.map((unit, index) => {
                    const unitNotifs = filteredNotifications.filter(
                      (n) => n.module === unit,
                    );
                    const unitToday = unitNotifs.filter(
                      (n) => n.dateGroup === "TODAY",
                    );
                    const unitYesterday = unitNotifs.filter(
                      (n) => n.dateGroup === "YESTERDAY",
                    );
                    const unitUnreadCount = roleFilteredNotifications.filter(
                      (n) => n.module === unit && !n.read,
                    ).length;
                    const isOpen = openUnits[unit];

                    return (
                      <div
                        key={unit}
                        className={cn(
                          "transition-all",
                          index < UNITS.length - 1 && "border-b border-[#f0eeee] pb-4",
                        )}
                      >
                        {/* Plain text header with dropdown icon */}
                        <button
                          type="button"
                          onClick={() => toggleUnit(unit)}
                          className="group flex w-full items-center justify-between py-1 text-left cursor-pointer transition select-none"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[13.5px] xl:text-[14.5px] font-bold text-[#1b1c19] tracking-tight group-hover:text-[#6b0f0f] transition-colors truncate">
                              {unit}
                            </span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-[#5c5757] transition-transform duration-200 shrink-0 group-hover:text-[#6b0f0f]",
                                !isOpen && "-rotate-90",
                              )}
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {unitUnreadCount > 0 && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#6b0f0f]" />
                            )}
                            <span className="text-[11px] xl:text-[12px] text-[#8a8484] font-normal">
                              ({unitNotifs.length})
                            </span>
                          </div>
                        </button>

                        {/* Unenclosed direct card list */}
                        {isOpen && (
                          <div className="pt-2.5 space-y-3">
                            {unitNotifs.length === 0 ? (
                              <p className="py-1 text-[11.5px] text-[#8a8484] italic">
                                No notifications in this unit.
                              </p>
                            ) : (
                              <>
                                {unitToday.length > 0 && (
                                  <div>
                                    <h4 className="text-[9.5px] xl:text-[10px] font-bold tracking-wider text-[#8a8484] uppercase mb-1.5">
                                      TODAY
                                    </h4>
                                    <div className="space-y-2">
                                      {unitToday.map((notif) => (
                                        <NotificationCard
                                          key={notif.id}
                                          notif={notif}
                                          onRead={() => markAsRead(notif.id)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {unitYesterday.length > 0 && (
                                  <div>
                                    <h4 className="text-[9.5px] xl:text-[10px] font-bold tracking-wider text-[#8a8484] uppercase mb-1.5">
                                      YESTERDAY
                                    </h4>
                                    <div className="space-y-2">
                                      {unitYesterday.map((notif) => (
                                        <NotificationCard
                                          key={notif.id}
                                          notif={notif}
                                          onRead={() => markAsRead(notif.id)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* REGULAR UNIT OFFICER FEED (Single Unit Timeline) */
                <>
                  {todayNotifications.length > 0 && (
                    <div>
                      <h3 className="text-[10px] xl:text-[11px] font-bold tracking-wider text-[#57423f] uppercase mb-2">
                        TODAY
                      </h3>
                      <div className="space-y-2">
                        {todayNotifications.map((notif) => (
                          <NotificationCard
                            key={notif.id}
                            notif={notif}
                            onRead={() => markAsRead(notif.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {yesterdayNotifications.length > 0 && (
                    <div>
                      <h3 className="text-[10px] xl:text-[11px] font-bold tracking-wider text-[#57423f] uppercase mb-2">
                        YESTERDAY
                      </h3>
                      <div className="space-y-2">
                        {yesterdayNotifications.map((notif) => (
                          <NotificationCard
                            key={notif.id}
                            notif={notif}
                            onRead={() => markAsRead(notif.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
