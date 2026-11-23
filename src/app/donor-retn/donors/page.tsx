"use client";

import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-retn/struct";
import { useDocumentTitle } from "@/components/Navbar";
import {
  PeriodFilter,
  ProspectSelectMenu,
} from "@/app/donor-conv/prospects/_components";
import { getDonors } from "@/lib/donors/actions";
import {
  ALL_PERIODS,
  currentPeriod,
  isAllPeriods,
  matchesPeriod,
  periodLabel,
  periodYears,
  samePeriod,
  type Period,
} from "@/lib/period";
import type {
  DonorTenureEnum,
  DonorTypeEnum,
  EngagementStatusEnum,
  TargetCampaignEnum,
} from "@/types";

const pageName = "Donors";
const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Preset quick filter pills from Figma 08.1_Retn_Filter and Sort    */
/* ------------------------------------------------------------------ */

const PRESET_PILLS = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "uncontacted", label: "Uncontacted" },
  { id: "recommitted", label: "Recommitted" },
  { id: "lapsed", label: "Lapsed" },
] as const;

type PresetPillId = (typeof PRESET_PILLS)[number]["id"];

/* ------------------------------------------------------------------ */
/* Filter modal options from Figma 08.1_Retn_Filter and Sort          */
/* ------------------------------------------------------------------ */

const STATUS_FILTER_OPTIONS = [
  { label: "All retention statuses", value: "all" },
  { label: "Uncontacted", value: "Uncontacted" },
  { label: "Followed-up", value: "Followed-up" },
  { label: "Renewal Started", value: "Renewal Started" },
  { label: "Recommitted", value: "Recommitted" },
  { label: "Lapsed Donor", value: "Lapsed Donor" },
];

const CAMPAIGN_FILTER_OPTIONS = [
  { label: "All campaigns", value: "all" },
  { label: "Youth Servant Leadership", value: "Youth Servant Leadership" },
  { label: "Health and Disaster Relief", value: "Health and Disaster Relief" },
  { label: "In-Kind Social Enterprise", value: "In-Kind Social Enterprise" },
  { label: "At-Risk Restorative Justice", value: "At-Risk Restorative Justice" },
  { label: "Institute for Stewardship", value: "Institute for Stewardship" },
];

const DONOR_TYPE_FILTER_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Corporate", value: "corporate" },
  { label: "Individual", value: "individual" },
  { label: "Community", value: "community" },
  { label: "International", value: "international" },
];

const FOLLOWUP_DUE_OPTIONS = [
  { label: "All follow-up statuses", value: "all" },
  { label: "Overdue", value: "overdue" },
  { label: "Due today", value: "today" },
  { label: "Due this week", value: "week" },
  { label: "Due this month", value: "month" },
];

const LAST_CONTACTED_OPTIONS = [
  { label: "All timeframes", value: "all" },
  { label: "Past 7 days", value: "7d" },
  { label: "Past 30 days", value: "30d" },
  { label: "Past 90 days", value: "90d" },
  { label: "Never contacted", value: "never" },
];

const DONOR_TENURE_OPTIONS = [
  { label: "All contribution tiers / tenures", value: "all" },
  { label: "3+ Years Loyal", value: "3+ Years Loyal" },
  { label: "2 Years Retained", value: "2 Years Retained" },
  { label: "1 Year Retained", value: "1 Year Retained" },
  { label: "New Renewal", value: "New Renewal" },
];

export interface DonorFilters {
  status: string;
  campaign: string;
  donorType: string;
  followUp: string;
  lastContacted: string;
  tenure: string;
}

const DEFAULT_FILTERS: DonorFilters = {
  status: "all",
  campaign: "all",
  donorType: "all",
  followUp: "all",
  lastContacted: "all",
  tenure: "all",
};

// Soft muted badges matching the Conversion prospects table
const RETENTION_STATUS_STYLES: Record<EngagementStatusEnum, { badge: string }> = {
  Uncontacted: {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  "Followed-up": {
    badge: "bg-stone-100 text-stone-600 border border-stone-200",
  },
  "Renewal Started": {
    badge: "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  },
  Recommitted: {
    badge: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  },
  "Lapsed Donor": {
    badge: "bg-rose-50/70 text-[#842323] border border-[#f0c4c4]",
  },
};

/* ------------------------------------------------------------------ */
/* Sample data                                                         */
/* ------------------------------------------------------------------ */

interface DonorRow {
  id: number;
  donor_name: string;
  donor_type: DonorTypeEnum;
  primary_contact_person: string;
  mobile_number: string;
  target_campaign: TargetCampaignEnum;
  engagement_status: EngagementStatusEnum;
  donor_tenure: DonorTenureEnum;
  last_contact_date: string | null; // YYYY-MM-DD
  target_followup_date: string | null; // YYYY-MM-DD
  created_at: string | null; // date added, drives the year / quarter filter
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

function parseISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(iso: string, n: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function endOfWeek(iso: string) {
  const d = parseISO(iso);
  const day = d.getDay();
  const diff = (7 - day) % 7;
  return addDays(iso, diff);
}

function endOfMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m, 0);
  return toISO(d);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return parseISO(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const noopSubscribe = () => () => {};
function useToday() {
  return useSyncExternalStore(
    noopSubscribe,
    () => toISO(new Date()),
    () => "",
  );
}

function byFollowUpDate(a: DonorRow, b: DonorRow) {
  if (!a.target_followup_date && !b.target_followup_date) return 0;
  if (!a.target_followup_date) return 1;
  if (!b.target_followup_date) return -1;
  return a.target_followup_date.localeCompare(b.target_followup_date);
}

function pageItems(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "...")[] = [1];
  if (current > 3) items.push("...");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    items.push(p);
  }
  if (current < total - 2) items.push("...");
  items.push(total);
  return items;
}

function csvCell(v: string | number | null) {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* ------------------------------------------------------------------ */
/* Filter matcher                                                     */
/* ------------------------------------------------------------------ */

function matchesFilters(
  d: DonorRow,
  f: DonorFilters,
  today: string,
  search: string,
  quickPill: PresetPillId,
) {
  const q = search.trim().toLowerCase();
  if (
    q &&
    !d.donor_name.toLowerCase().includes(q) &&
    !d.primary_contact_person.toLowerCase().includes(q) &&
    !d.mobile_number.toLowerCase().includes(q)
  ) {
    return false;
  }

  // Quick preset pills (from Figma 08.1_Retn_Filter and Sort)
  if (quickPill === "overdue") {
    if (!today || !d.target_followup_date || d.target_followup_date >= today) {
      return false;
    }
  } else if (quickPill === "uncontacted") {
    if (d.engagement_status !== "Uncontacted") return false;
  } else if (quickPill === "recommitted") {
    if (d.engagement_status !== "Recommitted") return false;
  } else if (quickPill === "lapsed") {
    if (d.engagement_status !== "Lapsed Donor") return false;
  }

  // Popup facet filters
  if (f.status !== "all" && d.engagement_status !== f.status) return false;
  if (f.campaign !== "all" && d.target_campaign !== f.campaign) return false;
  if (f.donorType !== "all" && d.donor_type !== f.donorType) return false;
  if (f.tenure !== "all" && d.donor_tenure !== f.tenure) return false;

  const due = d.target_followup_date;
  if (f.followUp === "overdue") {
    if (!today || !due || due >= today) return false;
  } else if (f.followUp === "today") {
    if (!today || due !== today) return false;
  } else if (f.followUp === "week") {
    if (!today || !due || due < today || due > endOfWeek(today)) return false;
  } else if (f.followUp === "month") {
    if (!today || !due || due < today || due > endOfMonth(today)) return false;
  }

  const last = d.last_contact_date;
  if (f.lastContacted === "never") {
    if (last) return false;
  } else if (f.lastContacted === "7d") {
    if (!today || !last || last < addDays(today, -7)) return false;
  } else if (f.lastContacted === "30d") {
    if (!today || !last || last < addDays(today, -30)) return false;
  } else if (f.lastContacted === "90d") {
    if (!today || !last || last < addDays(today, -90)) return false;
  }

  return true;
}

/* ------------------------------------------------------------------ */
/* Skeleton loader matching ProspectsTableSkeleton                    */
/* ------------------------------------------------------------------ */

function DonorsTableSkeleton() {
  return (
    <div className="w-full max-w-full min-w-0 mx-auto space-y-4">
      {/* Title row skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="h-3 w-16 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-7 w-48 bg-gray-200/80 rounded mt-1.5 animate-pulse" />
          </div>
          <div className="ml-2 self-end pb-1 h-3.5 w-44 bg-gray-200/80 rounded animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-28 bg-gray-300/80 rounded-button animate-pulse" />
        </div>
      </div>

      {/* Quick views pills skeleton */}
      <div className="flex flex-wrap gap-2">
        {PRESET_PILLS.map((p) => (
          <div
            key={p.id}
            className="h-9 w-24 bg-gray-200/80 rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="h-9 w-64 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
          <div className="h-9 w-20 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
          <div className="ml-auto h-9 w-9 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
        </div>

        <div className="overflow-x-auto min-h-[440px]">
          <table className="w-full text-center text-[0.75rem]">
            <thead className="bg-surface-soft text-text-secondary">
              <tr className="border-y border-border-soft">
                {["Donor", "Primary contact", "Phone Number", "Follow-up date", "Campaign", "Retention status"].map((col, idx) => (
                  <th key={idx} className="px-3 py-2.5 text-center font-medium">
                    <div className="h-3 w-16 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border-soft h-[39px]">
                  <td className="px-3 py-2.5">
                    <div className="h-3.5 w-32 bg-gray-200/70 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="h-3.5 w-24 bg-gray-200/70 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="h-3.5 w-24 bg-gray-200/70 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="h-3.5 w-20 bg-gray-200/70 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="h-3.5 w-28 bg-gray-200/70 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="h-5 w-20 bg-gray-200/70 rounded-[4px] mx-auto animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function DonorsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);
  const router = useRouter();
  const today = useToday();

  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(true);

  // Quick preset pills (from Figma 08.1_Retn_Filter and Sort)
  const [quickPill, setQuickPill] = useState<PresetPillId>("all");

  // Committed popup filters
  const [applied, setApplied] = useState<DonorFilters>(DEFAULT_FILTERS);
  // Draft filters (in popup until Apply is clicked)
  const [draft, setDraft] = useState<DonorFilters>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  // Year / quarter period. A null applied period follows the
  // current quarter, so the list opens on this quarter's donors.
  const [appliedPeriod, setAppliedPeriod] = useState<Period | null>(null);
  const [draftPeriod, setDraftPeriod] = useState<Period>(ALL_PERIODS);
  const defaultPeriod = useMemo(() => currentPeriod(today), [today]);
  const period = appliedPeriod ?? defaultPeriod;

  // Popup filter modal open state
  const [filterOpen, setFilterOpen] = useState(false);
  const [isFilterExiting, setIsFilterExiting] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Prevent background scrolling when filter popup is open
  useEffect(() => {
    if (filterOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [filterOpen]);

  // Close popup on Escape key and discard unapplied draft changes
  useEffect(() => {
    if (!filterOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraft(applied);
        setDraftPeriod(period);
        setFilterOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filterOpen, applied, period]);

  const [donorsData, setDonorsData] = useState<DonorRow[]>([]);

  useEffect(() => {
    let isCancelled = false;
    async function loadDonors() {
      try {
        const data = await getDonors();
        if (!isCancelled) {
          const rows: DonorRow[] = (data || []).map((d) => ({
            id: d.id,
            donor_name: d.donor_name,
            donor_type: (d.donor_type as string).toLowerCase() as DonorTypeEnum,
            primary_contact_person: d.primary_contact_person,
            mobile_number: d.mobile_number,
            target_campaign: d.target_campaign,
            engagement_status: d.engagement_status,
            donor_tenure: d.donor_tenure,
            last_contact_date: d.last_contact_date,
            target_followup_date: d.target_followup_date,
            created_at: d.created_at ?? null,
          }));
          setDonorsData(rows);
        }
      } catch (err) {
        console.warn("Could not fetch donors from backend:", err);
      } finally {
        if (!isCancelled) {
          setIsRefreshing(false);
        }
      }
    }
    loadDonors();
    return () => {
      isCancelled = true;
    };
  }, []);

  const allRows = useMemo(
    () => [...donorsData].sort(byFollowUpDate),
    [donorsData],
  );

  const years = useMemo(
    () =>
      periodYears(
        donorsData.map((d) => d.created_at),
        today,
      ),
    [donorsData, today],
  );

  const periodRows = useMemo(
    () => allRows.filter((d) => matchesPeriod(d.created_at, period)),
    [allRows, period],
  );

  const filtered = useMemo(
    () =>
      periodRows.filter((d) =>
        matchesFilters(d, applied, today, search, quickPill),
      ),
    [periodRows, applied, today, search, quickPill],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  function openPopup() {
    setDraft(applied);
    setDraftPeriod(period);
    setIsFilterExiting(false);
    setFilterOpen(true);
  }

  function closePopup() {
    setIsFilterExiting(true);
    setTimeout(() => {
      setDraft(applied);
      setDraftPeriod(period);
      setFilterOpen(false);
      setIsFilterExiting(false);
    }, 160);
  }

  function applyDraft() {
    setApplied(draft);
    setAppliedPeriod(samePeriod(draftPeriod, defaultPeriod) ? null : draftPeriod);
    setPage(1);
    setIsFilterExiting(true);
    setTimeout(() => {
      setFilterOpen(false);
      setIsFilterExiting(false);
    }, 160);
  }

  // Count of committed popup facet filters
  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (applied.status !== "all") count++;
    if (applied.campaign !== "all") count++;
    if (applied.donorType !== "all") count++;
    if (applied.followUp !== "all") count++;
    if (applied.lastContacted !== "all") count++;
    if (applied.tenure !== "all") count++;
    if (!samePeriod(period, defaultPeriod)) count++;
    return count;
  }, [applied, period, defaultPeriod]);

  const hasActiveFilters =
    appliedFilterCount > 0 ||
    !isAllPeriods(period) ||
    quickPill !== "all" ||
    Boolean(search.trim());

  function resetAllFilters() {
    setIsRefreshing(true);
    setTimeout(() => {
      setApplied(DEFAULT_FILTERS);
      setDraft(DEFAULT_FILTERS);
      setAppliedPeriod(null);
      setDraftPeriod(defaultPeriod);
      setQuickPill("all");
      setSearch("");
      setPage(1);
      setIsRefreshing(false);
    }, 450);
  }

  // Quick preset counts (for the pills above the table)
  const chipCounts = useMemo(
    () => ({
      all: periodRows.length,
      overdue: periodRows.filter((d) =>
        matchesFilters(d, DEFAULT_FILTERS, today, "", "overdue"),
      ).length,
      uncontacted: periodRows.filter((d) =>
        matchesFilters(d, DEFAULT_FILTERS, today, "", "uncontacted"),
      ).length,
      recommitted: periodRows.filter((d) =>
        matchesFilters(d, DEFAULT_FILTERS, today, "", "recommitted"),
      ).length,
      lapsed: periodRows.filter((d) =>
        matchesFilters(d, DEFAULT_FILTERS, today, "", "lapsed"),
      ).length,
    }),
    [periodRows, today],
  );

  function exportCsv() {
    const header = [
      "Donor",
      "Primary contact",
      "Phone",
      "Follow-up date",
      "Campaign",
      "Retention status",
    ];
    const lines = filtered.map((r) =>
      [
        r.donor_name,
        r.primary_contact_person,
        r.mobile_number,
        r.target_followup_date,
        r.target_campaign,
        r.engagement_status,
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donors-${today || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasDraftChanges =
    JSON.stringify(draft) !== JSON.stringify(DEFAULT_FILTERS) ||
    !samePeriod(draftPeriod, defaultPeriod);


  return (
    <AppShell navbarPreset={navbarPreset}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        html, body {
          background-color: var(--content-background) !important;
        }
      `,
        }}
      />

      {isRefreshing ? (
        <DonorsTableSkeleton />
      ) : (
        <div className="w-full max-w-full min-w-0 mx-auto space-y-4">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-text-secondary">Donors</p>
                <h1 className="text-2xl leading-tight font-semibold text-text-primary">
                  All donors
                </h1>
              </div>
              <p className="ml-2 self-end pb-1 text-xs text-text-secondary">
                {filtered.length} items ·{" "}
                {periodLabel(period)} · Sorted by follow-up date
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={exportCsv}
                className="flex h-9 items-center gap-2 rounded-button border border-button-stroke bg-white px-3 text-[0.8125rem] font-medium text-text-primary hover:bg-surface-soft-hover cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>

              <Link
                href="/donor-retn/donors/add-donor?from=table"
                className="flex h-9 items-center gap-2 rounded-button bg-brand-primary px-4 text-[0.8125rem] font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                New donor
              </Link>
            </div>
          </div>

          {/* Quick preset filter pills from Figma 08.1_Retn_Filter and Sort */}
          <div className="flex flex-wrap gap-2">
            {PRESET_PILLS.map((pill) => {
              const active = quickPill === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setQuickPill((prev) => (prev === pill.id ? "all" : pill.id));
                    setPage(1);
                  }}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full border px-4 text-[0.8125rem] font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-text-primary text-white border-text-primary"
                      : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                  )}
                >
                  {pill.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[0.6875rem] font-semibold",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-surface-soft text-text-secondary",
                    )}
                  >
                    {chipCounts[pill.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table card */}
          <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
            <div className="flex flex-wrap items-center gap-3 p-3">
              {/* Search Box */}
              <div className="flex w-64 items-center rounded-button border border-border-strong bg-white">
                <Search className="mx-2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search donor or contact..."
                  aria-label="Search donor or contact person"
                  className="h-9 w-full bg-transparent text-[0.8125rem] text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>

              {/* Filter Trigger button */}
              <div ref={filterContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (filterOpen) closePopup();
                    else openPopup();
                  }}
                  aria-expanded={filterOpen}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-button border px-3 text-[0.8125rem] font-medium transition-colors cursor-pointer",
                    appliedFilterCount > 0
                      ? "border-[#5c5757] bg-surface-soft text-text-primary"
                      : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                  )}
                >
                  Filters{appliedFilterCount > 0 ? ` (${appliedFilterCount})` : ""}
                </button>

                {/* Popup Filter Panel matching Prospects table filter modal */}
                {filterOpen && (
                  <>
                    <div
                      className={cn(
                        "fixed inset-0 z-30 bg-black/10",
                        isFilterExiting
                          ? "modal-backdrop-out"
                          : "modal-backdrop-in",
                      )}
                      onClick={closePopup}
                      aria-hidden="true"
                    />
                    <div
                      className={cn(
                        "absolute left-0 top-full z-40 mt-1.5 w-[580px] max-w-[calc(100vw-32px)] rounded-xl border border-[#e3dfdf] bg-white p-5 shadow-2xl",
                        isFilterExiting ? "popup-out" : "popup-in",
                      )}
                    >
                      {/* Popup Header */}
                      <div className="mb-4 flex items-center justify-between border-b border-[#e3dfdf] pb-3">
                        <h3 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">
                          Filters
                        </h3>
                        <button
                          type="button"
                          onClick={closePopup}
                          aria-label="Close filters"
                          className="rounded-full p-1 text-[#757070] hover:bg-[#f7f6f6] hover:text-[#1c1a1a] transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Filter Fields in 2-column rectangular grid from Figma 08.1_Retn_Filter and Sort */}
                      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                        {/* 0. Year and quarter (date added) */}
                        <PeriodFilter
                          value={draftPeriod}
                          years={years}
                          onChange={setDraftPeriod}
                        />

                        {/* 1. Retention Status */}
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                            Retention Status
                          </label>
                          <ProspectSelectMenu
                            value={draft.status}
                            onChange={(val) =>
                              setDraft((prev) => ({ ...prev, status: val }))
                            }
                            options={STATUS_FILTER_OPTIONS}
                          />
                        </div>

                        {/* 2. Target Campaign */}
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                            Target Campaign
                          </label>
                          <ProspectSelectMenu
                            value={draft.campaign}
                            onChange={(val) =>
                              setDraft((prev) => ({ ...prev, campaign: val }))
                            }
                            options={CAMPAIGN_FILTER_OPTIONS}
                          />
                        </div>

                        {/* 3. Donor Type */}
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                            Donor Type
                          </label>
                          <ProspectSelectMenu
                            value={draft.donorType}
                            onChange={(val) =>
                              setDraft((prev) => ({ ...prev, donorType: val }))
                            }
                            options={DONOR_TYPE_FILTER_OPTIONS}
                          />
                        </div>

                        {/* 4. Follow-up Due Status */}
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                            Follow-up Due Status
                          </label>
                          <ProspectSelectMenu
                            value={draft.followUp}
                            onChange={(val) =>
                              setDraft((prev) => ({ ...prev, followUp: val }))
                            }
                            options={FOLLOWUP_DUE_OPTIONS}
                          />
                        </div>

                        {/* 5. Last Contacted Timeframe */}
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                            Last Contacted Timeframe
                          </label>
                          <ProspectSelectMenu
                            value={draft.lastContacted}
                            onChange={(val) =>
                              setDraft((prev) => ({ ...prev, lastContacted: val }))
                            }
                            options={LAST_CONTACTED_OPTIONS}
                          />
                        </div>

                        {/* 6. Donor Contribution Tier / Tenure */}
                        <div>
                          <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                            Donor Contribution Tier
                          </label>
                          <ProspectSelectMenu
                            value={draft.tenure}
                            onChange={(val) =>
                              setDraft((prev) => ({ ...prev, tenure: val }))
                            }
                            options={DONOR_TENURE_OPTIONS}
                          />
                        </div>
                      </div>

                      {/* Popup Footer */}
                      <div className="mt-5 flex items-center justify-between border-t border-[#e3dfdf] pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setDraft(DEFAULT_FILTERS);
                            setDraftPeriod(defaultPeriod);
                          }}
                          disabled={!hasDraftChanges}
                          className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 hover:underline cursor-pointer"
                        >
                          Reset all
                        </button>
                        <button
                          type="button"
                          onClick={applyDraft}
                          className="rounded-md bg-[#6b0f0f] hover:bg-[#520b0b] px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Far-right Refresh / Reset filters icon button */}
              <div className="ml-auto relative group">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  aria-label="Reset filters"
                  className="flex h-9 w-9 items-center justify-center rounded-button border border-border-strong bg-white text-text-secondary hover:bg-surface-soft hover:text-text-primary transition-colors cursor-pointer"
                >
                  <RotateCcw
                    className={cn(
                      "h-4 w-4",
                      isRefreshing && "animate-spin text-brand-primary",
                    )}
                  />
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute right-0 top-full mt-1.5 hidden group-hover:block whitespace-nowrap rounded bg-[#1c1a1a] px-2 py-1 text-[0.6875rem] font-medium text-white shadow-md z-30"
                >
                  Reset filters
                </div>
              </div>
            </div>

            {/* Table container */}
            <div className="overflow-x-auto min-h-[440px]">
              <table className="w-full text-center text-[0.75rem]">
                <thead className="bg-surface-soft text-text-secondary">
                  <tr className="border-y border-border-soft">
                    <th className="px-3 py-2.5 font-medium text-center text-[0.75rem] whitespace-nowrap">
                      Donor
                    </th>
                    <th className="px-3 py-2.5 font-medium text-center text-[0.75rem] whitespace-nowrap">
                      Primary contact
                    </th>
                    <th className="px-3 py-2.5 font-medium text-center text-[0.75rem] whitespace-nowrap">
                      Phone Number
                    </th>
                    <th className="px-3 py-2.5 font-medium text-center text-[0.75rem] whitespace-nowrap">
                      Follow-up date
                    </th>
                    <th className="px-3 py-2.5 font-medium text-center text-[0.75rem] whitespace-nowrap">
                      Campaign
                    </th>
                    <th className="px-3 py-2.5 font-medium text-center text-[0.75rem] whitespace-nowrap">
                      Retention status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isRefreshing ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <tr
                        key={`skeleton-${idx}`}
                        className="border-b border-border-soft h-[39px] animate-pulse"
                      >
                        <td className="px-3 py-2.5">
                          <div className="h-3.5 bg-gray-200 rounded w-32 mx-auto" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="h-3.5 bg-gray-200 rounded w-28 mx-auto" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="h-3.5 bg-gray-200 rounded w-24 mx-auto" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="h-3.5 bg-gray-200 rounded w-20 mx-auto" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="h-3.5 bg-gray-200 rounded w-28 mx-auto" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="h-5 bg-gray-200 rounded-full w-24 mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-24 text-center text-text-secondary text-[0.75rem]"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="font-medium text-text-primary">
                            {hasActiveFilters
                              ? `No donors match your current search or filters${
                                  isAllPeriods(period)
                                    ? "."
                                    : ` for ${periodLabel(period)}.`
                                }`
                              : "No donor profiles found in Supabase database."}
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={resetAllFilters}
                              className="mt-1 rounded-button border border-border-strong bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-soft cursor-pointer"
                            >
                              Reset all filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r) => {
                      const style =
                        RETENTION_STATUS_STYLES[r.engagement_status] ??
                        RETENTION_STATUS_STYLES["Uncontacted"];
                      const href = `/donor-retn/donors/edit-donor?id=${r.id}&from=table`;
                      const isOverdue =
                        !!today &&
                        !!r.target_followup_date &&
                        r.target_followup_date < today;
                      const isDueToday =
                        !!today && r.target_followup_date === today;

                      return (
                        <tr
                          key={r.id}
                          tabIndex={0}
                          role="link"
                          onClick={() => router.push(href)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") router.push(href);
                          }}
                          className="cursor-pointer border-b border-border-soft text-text-primary hover:bg-surface-soft focus:bg-surface-soft focus:outline-none h-[39px]"
                        >
                          <td className="px-3 py-2.5 font-semibold text-center text-[0.75rem] whitespace-nowrap">
                            {r.donor_name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-[0.75rem] whitespace-nowrap">
                            {r.primary_contact_person}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center text-[0.75rem]">
                            {r.mobile_number}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2.5 whitespace-nowrap text-center text-[0.75rem]",
                              !r.target_followup_date && "text-text-muted",
                              r.target_followup_date && "text-text-secondary",
                              isOverdue && "font-medium text-[#a33838]",
                              isDueToday && "font-medium text-amber-700",
                            )}
                          >
                            {formatDate(r.target_followup_date)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center text-[0.75rem]">
                            {r.target_campaign}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center text-[0.75rem]">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap",
                                style.badge,
                              )}
                            >
                              {r.engagement_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer matching Prospects table */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-4 py-3 text-xs text-text-secondary">
              <p>
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)}{" "}
                of {filtered.length} donors
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border-strong bg-white text-text-primary hover:bg-surface-soft disabled:opacity-40 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {pageItems(currentPage, totalPages).map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-text-muted select-none"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={cn(
                        "flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs font-medium cursor-pointer",
                        item === currentPage
                          ? "bg-brand-primary text-white"
                          : "border border-border-strong bg-white text-text-primary hover:bg-surface-soft",
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border-strong bg-white text-text-primary hover:bg-surface-soft disabled:opacity-40 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
