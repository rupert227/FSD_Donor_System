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
  Kanban,
  List,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";

import { SAMPLE_LEADS, type LeadDetail } from "@supabase/seeds/prospects-seed";
import type { PipelineStatusEnum } from "@/types";
import { ProspectSelectMenu, ProspectsTableSkeleton } from "./_components";

import { useDocumentTitle } from "@/components/Navbar";

const pageName = "Prospects";
const PAGE_SIZE = 10;
const CURRENT_OFFICER = "Officer J. Reyes";

export const ALL_PIPELINE_STAGES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

const STATUS_FILTER_OPTIONS = [
  { label: "All pipeline statuses", value: "all" },
  { label: "New Lead", value: "New Lead" },
  { label: "Under Research", value: "Under Research" },
  { label: "Outreach Started", value: "Outreach Started" },
  { label: "Proposal Sent", value: "Proposal Sent" },
  { label: "Secured Donor", value: "Secured Donor" },
];

const CAMPAIGN_FILTER_OPTIONS = [
  { label: "All campaigns", value: "all" },
  { label: "Youth Servant Leadership", value: "Youth Servant Leadership" },
  { label: "Health and Disaster Relief", value: "Health and Disaster Relief" },
  { label: "In-Kind Social Enterprise", value: "In-Kind Social Enterprise" },
  { label: "At-Risk Restorative Justice", value: "At-Risk Restorative Justice" },
  { label: "Institute for Stewardship", value: "Institute for Stewardship" },
];

// Aligned with the project's feasibility amount tiers (src/app/donor-conv/prospects/utils/prospect-score.ts)
const AMOUNT_FILTER_OPTIONS = [
  { label: "All target amounts", value: "all" },
  { label: "₱0 – ₱50,000", value: "0-50k" },
  { label: "₱50,000 – ₱250,000", value: "50000-250000" },
  { label: "₱250,000 – ₱1,000,000", value: "250000-1000000" },
  { label: "Above ₱1,000,000", value: "over1m" },
];

const DONOR_TYPE_FILTER_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Corporate", value: "corporate" },
  { label: "Individual", value: "individual" },
  { label: "Community", value: "community" },
  { label: "International", value: "international" },
];

const LEAD_SOURCE_FILTER_OPTIONS = [
  { label: "All lead sources", value: "all" },
  { label: "Direct Call", value: "Direct Call" },
  { label: "Referral", value: "Referral" },
  { label: "Research", value: "Research" },
  { label: "Booths", value: "Booths" },
  { label: "Walk-in", value: "Walk-in" },
];

const OFFICER_FILTER_OPTIONS = [
  { label: "All assigned officers", value: "all" },
  { label: "Officer J. Reyes", value: "Officer J. Reyes" },
  { label: "Officer A. Tan", value: "Officer A. Tan" },
  { label: "Officer M. Cruz", value: "Officer M. Cruz" },
];

export interface ProspectFilters {
  status: string;
  campaign: string;
  amountRange: string;
  donorType: string;
  leadSource: string;
  assignedOfficer: string;
}

const DEFAULT_FILTERS: ProspectFilters = {
  status: "all",
  campaign: "all",
  amountRange: "all",
  donorType: "all",
  leadSource: "all",
  assignedOfficer: "all",
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function stageLabel(s: PipelineStatusEnum) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// Low-saturation, soft muted badges without dots
const STAGE_STYLES: Record<PipelineStatusEnum, { badge: string }> = {
  "New Lead": {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  "Under Research": {
    badge: "bg-stone-100 text-stone-600 border border-stone-200",
  },
  "Outreach Started": {
    badge: "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  },
  "Proposal Sent": {
    badge: "bg-amber-50/60 text-[#7a5e2c] border border-[#e8ddcb]",
  },
  "Secured Donor": {
    badge: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  },
};

function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const noopSubscribe = () => () => {};
function useToday() {
  return useSyncExternalStore(
    noopSubscribe,
    () => toISO(new Date()),
    () => "",
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function byFollowUpDate(a: LeadDetail, b: LeadDetail) {
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

function matchesFilters(
  l: LeadDetail,
  f: ProspectFilters,
  today: string,
  search: string,
  quickOfficer: string | null,
  quickDate: "today" | "overdue" | null,
  quickStage: PipelineStatusEnum | null = null,
) {
  const q = search.trim().toLowerCase();
  if (
    q &&
    !l.prospect_name.toLowerCase().includes(q) &&
    !l.primary_contact_person.toLowerCase().includes(q)
  ) {
    return false;
  }

  // Quick officer shortcut
  if (quickOfficer && l.assigned_officer !== quickOfficer) {
    return false;
  }

  // Quick date shortcut
  if (quickDate === "today") {
    if (!today || l.target_followup_date !== today) return false;
  } else if (quickDate === "overdue") {
    if (!today || !l.target_followup_date || l.target_followup_date >= today) {
      return false;
    }
  }

  // Quick stage shortcut
  if (quickStage && l.pipeline_status !== quickStage) {
    return false;
  }

  // Pipeline status filter
  if (f.status !== "all" && l.pipeline_status !== f.status) {
    return false;
  }

  // Assigned officer filter
  if (f.assignedOfficer !== "all" && l.assigned_officer !== f.assignedOfficer) {
    return false;
  }

  // Campaign
  if (f.campaign !== "all" && l.target_campaign !== f.campaign) {
    return false;
  }

  // Donor type
  if (f.donorType !== "all" && l.donor_type !== f.donorType) {
    return false;
  }

  // Lead source
  if (f.leadSource !== "all" && l.lead_source !== f.leadSource) {
    return false;
  }

  // Target Amount based on project feasibility tiers (0-50k, 50k-250k, 250k-1m, >1m)
  if (f.amountRange !== "all") {
    const amt = l.target_amount;
    if (f.amountRange === "0-50k" && amt > 50000) return false;
    if (
      f.amountRange === "50000-250000" &&
      (amt <= 50000 || amt > 250000)
    ) {
      return false;
    }
    if (
      f.amountRange === "250000-1000000" &&
      (amt <= 250000 || amt > 1000000)
    ) {
      return false;
    }
    if (f.amountRange === "over1m" && amt <= 1000000) return false;
  }

  return true;
}

export default function ProspectsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  const router = useRouter();
  const today = useToday();

  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Committed applied filters (controls table data)
  const [applied, setApplied] = useState<ProspectFilters>(DEFAULT_FILTERS);
  // Draft filters (holds selections in popup until "Apply" is clicked)
  const [draft, setDraft] = useState<ProspectFilters>(DEFAULT_FILTERS);

  const [quickOfficer, setQuickOfficer] = useState<string | null>(null);
  const [quickDate, setQuickDate] = useState<"today" | "overdue" | null>(null);
  const [quickStage, setQuickStage] = useState<PipelineStatusEnum | null>(null);
  const [page, setPage] = useState(1);

  // Popup filter open state
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
        setFilterOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filterOpen, applied]);

  const allRows = useMemo(
    () => SAMPLE_LEADS.slice().sort(byFollowUpDate),
    [],
  );

  const filtered = useMemo(
    () =>
      allRows.filter((l) =>
        matchesFilters(
          l,
          applied,
          today,
          search,
          quickOfficer,
          quickDate,
          quickStage,
        ),
      ),
    [allRows, applied, today, search, quickOfficer, quickDate, quickStage],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  function openPopup() {
    setDraft(applied); // sync draft with current applied state
    setIsFilterExiting(false);
    setFilterOpen(true);
  }

  function closePopup() {
    setIsFilterExiting(true);
    setTimeout(() => {
      setDraft(applied); // discard unapplied changes
      setFilterOpen(false);
      setIsFilterExiting(false);
    }, 160);
  }

  function applyDraft() {
    setApplied(draft);
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
    if (applied.amountRange !== "all") count++;
    if (applied.assignedOfficer !== "all") count++;
    if (applied.donorType !== "all") count++;
    if (applied.leadSource !== "all") count++;
    return count;
  }, [applied]);

  const hasActiveFilters =
    appliedFilterCount > 0 ||
    Boolean(quickOfficer) ||
    Boolean(quickDate) ||
    Boolean(quickStage) ||
    Boolean(search.trim());

  function resetAllFilters() {
    setIsRefreshing(true);
    setTimeout(() => {
      setApplied(DEFAULT_FILTERS);
      setDraft(DEFAULT_FILTERS);
      setQuickOfficer(null);
      setQuickDate(null);
      setQuickStage(null);
      setSearch("");
      setPage(1);
      setIsRefreshing(false);
    }, 450);
  }

  const chipCounts = useMemo(
    () => ({
      all: allRows.length,
      "due-today": allRows.filter((l) =>
        matchesFilters(l, DEFAULT_FILTERS, today, "", null, "today", null),
      ).length,
      overdue: allRows.filter((l) =>
        matchesFilters(l, DEFAULT_FILTERS, today, "", null, "overdue", null),
      ).length,
      mine: allRows.filter((l) =>
        matchesFilters(l, DEFAULT_FILTERS, today, "", CURRENT_OFFICER, null, null),
      ).length,
      "proposal-sent": allRows.filter((l) =>
        matchesFilters(
          l,
          DEFAULT_FILTERS,
          today,
          "",
          null,
          null,
          "Proposal Sent",
        ),
      ).length,
    }),
    [allRows, today],
  );

  const isAllView = !quickDate && !quickOfficer && !quickStage;
  const isDueTodayView = quickDate === "today";
  const isOverdueView = quickDate === "overdue";
  const isMineView = quickOfficer === CURRENT_OFFICER;
  const isProposalSentView = quickStage === "Proposal Sent";

  function exportCsv() {
    const header = [
      "Prospect",
      "Primary contact",
      "Email",
      "Phone",
      "Follow-up date",
      "Target amount",
      "Pipeline status",
    ];
    const lines = filtered.map((r) =>
      [
        r.prospect_name,
        r.primary_contact_person,
        r.email_address,
        r.phone_number,
        r.target_followup_date,
        r.target_amount,
        r.pipeline_status,
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
    a.download = `prospects-${today || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasDraftChanges =
    JSON.stringify(draft) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <AppShell navbarPreset={navbarPreset}>
      {isRefreshing ? (
        <ProspectsTableSkeleton />
      ) : (
        <div className="w-[90%] max-w-full min-w-0 mx-auto space-y-4 animate-in fade-in duration-300">
        {/* Title row without icon beside All Prospects */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-text-secondary">Prospects</p>
              <h1 className="text-2xl leading-tight font-semibold text-text-primary">
                All prospects
              </h1>
            </div>
            <p className="ml-2 self-end pb-1 text-xs text-text-secondary">
              {filtered.length} items · Sorted by follow-up date
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* List / Board toggle */}
            <div className="flex rounded-button border border-border-strong bg-white p-0.5 text-[13px]">
              <span className="flex items-center gap-1.5 rounded-[4px] bg-surface-soft px-3 py-1.5 font-medium text-text-primary">
                <List className="h-3.5 w-3.5" /> List
              </span>
              <Link
                href="/donor-conv/prospects/pipeline-board"
                className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-text-secondary hover:bg-surface-soft-hover"
              >
                <Kanban className="h-3.5 w-3.5" /> Board
              </Link>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              className="flex h-9 items-center gap-2 rounded-button border border-button-stroke bg-white px-3 text-[13px] font-medium text-text-primary hover:bg-surface-soft-hover"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>

            <Link
              href="/donor-conv/prospects/add-prospect"
              className="flex h-9 items-center gap-2 rounded-button bg-brand-primary px-4 text-[13px] font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New prospect
            </Link>
          </div>
        </div>

        {/* Quick views */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setQuickDate(null);
              setQuickOfficer(null);
              setQuickStage(null);
              setPage(1);
            }}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors cursor-pointer",
              isAllView
                ? "bg-text-primary text-white border-text-primary"
                : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
            )}
          >
            All
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold",
                isAllView
                  ? "bg-white/20 text-white"
                  : "bg-surface-soft text-text-secondary",
              )}
            >
              {chipCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQuickDate((prev) => (prev === "today" ? null : "today"));
              setQuickOfficer(null);
              setQuickStage(null);
              setPage(1);
            }}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors cursor-pointer",
              isDueTodayView
                ? "bg-text-primary text-white border-text-primary"
                : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
            )}
          >
            Due today
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold",
                isDueTodayView
                  ? "bg-white/20 text-white"
                  : "bg-surface-soft text-text-secondary",
              )}
            >
              {chipCounts["due-today"]}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQuickDate((prev) => (prev === "overdue" ? null : "overdue"));
              setQuickOfficer(null);
              setQuickStage(null);
              setPage(1);
            }}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors cursor-pointer",
              isOverdueView
                ? "bg-text-primary text-white border-text-primary"
                : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
            )}
          >
            Overdue
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold",
                isOverdueView
                  ? "bg-white/20 text-white"
                  : "bg-surface-soft text-text-secondary",
              )}
            >
              {chipCounts.overdue}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQuickOfficer((prev) =>
                prev === CURRENT_OFFICER ? null : CURRENT_OFFICER,
              );
              setQuickDate(null);
              setQuickStage(null);
              setPage(1);
            }}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors cursor-pointer",
              isMineView
                ? "bg-text-primary text-white border-text-primary"
                : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
            )}
          >
            My prospects
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold",
                isMineView
                  ? "bg-white/20 text-white"
                  : "bg-surface-soft text-text-secondary",
              )}
            >
              {chipCounts.mine}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQuickStage((prev) =>
                prev === "Proposal Sent" ? null : "Proposal Sent",
              );
              setQuickDate(null);
              setQuickOfficer(null);
              setPage(1);
            }}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors cursor-pointer",
              isProposalSentView
                ? "bg-text-primary text-white border-text-primary"
                : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
            )}
          >
            Proposal sent
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold",
                isProposalSentView
                  ? "bg-white/20 text-white"
                  : "bg-surface-soft text-text-secondary",
              )}
            >
              {chipCounts["proposal-sent"]}
            </span>
          </button>
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
                placeholder="Search prospect or contact..."
                aria-label="Search prospect or contact person"
                className="h-9 w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            {/* Filter Trigger without corny icon, subdued active color */}
            <div ref={filterContainerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (filterOpen) {
                    closePopup();
                  } else {
                    openPopup();
                  }
                }}
                aria-expanded={filterOpen}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-button border px-3 text-[13px] font-medium transition-colors cursor-pointer",
                  appliedFilterCount > 0
                    ? "border-[#5c5757] bg-surface-soft text-text-primary"
                    : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                )}
              >
                Filters{appliedFilterCount > 0 ? ` (${appliedFilterCount})` : ""}
              </button>

              {/* Popup Filter Panel */}
              {filterOpen && (
                <>
                  {/* Backdrop: blocks outside scroll and outside clicks */}
                  <div
                    className={cn(
                      "fixed inset-0 z-30 bg-black/10",
                      isFilterExiting ? "modal-backdrop-out" : "modal-backdrop-in",
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
                      <h3 className="text-[13px] font-semibold text-[#1c1a1a]">
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

                    {/* Filter Fields in clean 2-column rectangular grid with ample spacing */}
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      {/* 1. Pipeline Status */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#5c5757] mb-1.5">
                          Pipeline Status
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
                        <label className="block text-[11px] font-medium text-[#5c5757] mb-1.5">
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

                      {/* 3. Target Amount */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#5c5757] mb-1.5">
                          Target Amount
                        </label>
                        <ProspectSelectMenu
                          value={draft.amountRange}
                          onChange={(val) =>
                            setDraft((prev) => ({ ...prev, amountRange: val }))
                          }
                          options={AMOUNT_FILTER_OPTIONS}
                        />
                      </div>

                      {/* 4. Assigned Officer */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#5c5757] mb-1.5">
                          Assigned Officer
                        </label>
                        <ProspectSelectMenu
                          value={draft.assignedOfficer}
                          onChange={(val) =>
                            setDraft((prev) => ({ ...prev, assignedOfficer: val }))
                          }
                          options={OFFICER_FILTER_OPTIONS}
                        />
                      </div>

                      {/* 5. Donor Type */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#5c5757] mb-1.5">
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

                      {/* 6. Lead Source */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#5c5757] mb-1.5">
                          Lead Source
                        </label>
                        <ProspectSelectMenu
                          value={draft.leadSource}
                          onChange={(val) =>
                            setDraft((prev) => ({ ...prev, leadSource: val }))
                          }
                          options={LEAD_SOURCE_FILTER_OPTIONS}
                        />
                      </div>
                    </div>

                    {/* Popup Footer with subdued dark neutral Apply button */}
                    <div className="mt-5 flex items-center justify-between border-t border-[#e3dfdf] pt-3">
                      <button
                        type="button"
                        onClick={() => setDraft(DEFAULT_FILTERS)}
                        disabled={!hasDraftChanges}
                        className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 hover:underline cursor-pointer"
                      >
                        Reset all
                      </button>
                      <button
                        type="button"
                        onClick={applyDraft}
                        className="rounded-md bg-[#221f1f] hover:bg-[#110f0f] px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Far-right Refresh / Reset filters icon button with tooltip */}
            <div className="ml-auto relative group">
              <button
                type="button"
                onClick={resetAllFilters}
                aria-label="Reset filters"
                className="flex h-9 w-9 items-center justify-center rounded-button border border-border-strong bg-white text-text-secondary hover:bg-surface-soft hover:text-text-primary transition-colors cursor-pointer"
              >
                <RotateCcw className={cn("h-4 w-4", isRefreshing && "animate-spin text-brand-primary")} />
              </button>
              <div
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full mt-1.5 hidden group-hover:block whitespace-nowrap rounded bg-[#1c1a1a] px-2 py-1 text-[11px] font-medium text-white shadow-md z-30"
              >
                Reset filters
              </div>
            </div>
          </div>

          {/* Table container with min-height of 10 rows automatically so filter popup is never cut */}
          <div className="overflow-x-auto min-h-[440px]">
            {/* Centered table columns with 12px font size */}
            <table className="w-full text-center text-[12px]">
              <thead className="bg-surface-soft text-text-secondary">
                <tr className="border-y border-border-soft">
                  <th className="px-3 py-2.5 font-medium text-center text-[12px]">
                    Prospect
                  </th>
                  <th className="px-3 py-2.5 font-medium text-center text-[12px]">
                    Primary contact
                  </th>
                  <th className="px-3 py-2.5 font-medium text-center text-[12px]">
                    Phone Number
                  </th>
                  <th className="px-3 py-2.5 font-medium text-center text-[12px]">
                    Follow-up date
                  </th>
                  <th className="px-3 py-2.5 font-medium text-center text-[12px]">
                    Target amount
                  </th>
                  <th className="px-3 py-2.5 font-medium text-center text-[12px]">
                    Pipeline status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-24 text-center text-text-secondary text-[12px]"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="font-medium text-text-primary">
                          No prospects match your current search or filters.
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
                  <>
                    {pageRows.map((r) => {
                      const style = STAGE_STYLES[r.pipeline_status];
                      const href = `/donor-conv/prospects/edit-prospect?id=${r.id}`;
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
                          <td className="px-3 py-2.5 font-semibold text-center text-[12px]">
                            {r.prospect_name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-[12px]">
                            {r.primary_contact_person}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center text-[12px]">
                            {r.phone_number}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2.5 whitespace-nowrap text-center text-[12px]",
                              !r.target_followup_date && "text-text-muted",
                              r.target_followup_date &&
                                today &&
                                r.target_followup_date < today &&
                                "font-medium text-[#a33838]",
                              r.target_followup_date &&
                                today &&
                                r.target_followup_date === today &&
                                "font-medium text-amber-700",
                            )}
                          >
                            {r.target_followup_date === today
                              ? "Due today"
                              : formatDate(r.target_followup_date)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center text-[12px]">
                            {peso.format(r.target_amount)}
                          </td>
                          {/* Low-saturation badge without dot, centered */}
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
                                style.badge,
                              )}
                            >
                              {stageLabel(r.pipeline_status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Filler empty rows so table automatically maintains 10 rows height even with 1 or 2 records */}
                    {Array.from({
                      length: Math.max(0, PAGE_SIZE - pageRows.length),
                    }).map((_, i) => (
                      <tr
                        key={`filler-${i}`}
                        className="border-b border-border-soft/40 h-[39px] pointer-events-none select-none"
                      >
                        <td colSpan={6} className="px-3 py-2.5">
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-xs text-text-secondary">
            <span>
              {filtered.length === 0
                ? "Showing 0 prospects"
                : `Showing ${start + 1}–${start + pageRows.length} of ${filtered.length} prospects`}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-button border border-border-strong hover:bg-surface-soft-hover disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageItems(currentPage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`gap-${i}`} className="px-2">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={p === currentPage ? "page" : undefined}
                    className={cn(
                      "h-8 min-w-8 rounded-button border px-2 text-[13px]",
                      p === currentPage
                        ? "border-brand-primary bg-brand-primary font-semibold text-white"
                        : "border-border-strong hover:bg-surface-soft-hover",
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-button border border-border-strong hover:bg-surface-soft-hover disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </AppShell>
  );
}
