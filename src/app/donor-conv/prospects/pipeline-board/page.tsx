"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Download,
  Filter,
  Info,
  Kanban,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { navbarPreset } from "@/app/donor-conv/struct";

import { SAMPLE_LEADS, type LeadDetail } from "@/lib/mock-data/leads";
import type { PipelineStatusEnum } from "@/types";

// Cards shown per column before "Show N more"
const CARDS_PER_COLUMN = 3;

const STAGES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

const OWNERS = Array.from(
  new Set(SAMPLE_LEADS.map((l) => l.assigned_officer)),
).sort();

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// "Outreach Started" -> "Outreach started" (sentence case, as in the design)
function stageLabel(s: PipelineStatusEnum) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

const STAGE_STYLES: Record<PipelineStatusEnum, { badge: string; dot: string }> =
  {
    "New Lead": {
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      dot: "bg-gray-500",
    },
    "Under Research": {
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      dot: "bg-gray-500",
    },
    "Outreach Started": {
      badge: "bg-blue-50 text-blue-800 border-blue-200",
      dot: "bg-blue-600",
    },
    "Proposal Sent": {
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
    },
    "Secured Donor": {
      badge: "bg-green-50 text-green-800 border-green-200",
      dot: "bg-green-600",
    },
  };

function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Today as YYYY-MM-DD. Server snapshot is "" so server and first client render match.
const noopSubscribe = () => () => {};
function useToday() {
  return useSyncExternalStore(
    noopSubscribe,
    () => toISO(new Date()),
    () => "",
  );
}

// "Aug 20"
function shortDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// "Officer V. De Guzman" -> "VG"
function initials(officer: string) {
  const words = officer.replace(/^Officer\s+/, "").split(" ");
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

// Soonest first. Prospects with no follow-up date go to the bottom.
function byFollowUpDate(a: LeadDetail, b: LeadDetail) {
  if (!a.target_followup_date && !b.target_followup_date) return 0;
  if (!a.target_followup_date) return 1;
  if (!b.target_followup_date) return -1;
  return a.target_followup_date.localeCompare(b.target_followup_date);
}

function csvCell(v: string | number | null) {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function PipelineBoardPage() {
  navbarPreset.selectedTabIndex = 0;

  const today = useToday();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [owners, setOwners] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<PipelineStatusEnum[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Replace SAMPLE_LEADS with the Supabase fetch later.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...SAMPLE_LEADS].sort(byFollowUpDate).filter((l) => {
      if (
        q &&
        !l.prospect_name.toLowerCase().includes(q) &&
        !l.primary_contact_person.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (owners.length > 0 && !owners.includes(l.assigned_officer))
        return false;
      if (dateFrom || dateTo) {
        if (!l.target_followup_date) return false; // no date can't be in a range
        if (dateFrom && l.target_followup_date < dateFrom) return false;
        if (dateTo && l.target_followup_date > dateTo) return false;
      }
      return true;
    });
  }, [search, owners, dateFrom, dateTo]);

  const columns = STAGES.map((stage) => {
    const cards = visible.filter((l) => l.pipeline_status === stage);
    return {
      stage,
      cards,
      total: cards.reduce((sum, l) => sum + l.target_amount, 0),
    };
  });

  const openCards = visible.filter(
    (l) => l.pipeline_status !== "Secured Donor",
  );
  const openTotal = openCards.reduce((sum, l) => sum + l.target_amount, 0);

  const filterCount =
    (dateFrom || dateTo ? 1 : 0) + (owners.length > 0 ? 1 : 0);
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  function toggleOwner(o: string) {
    setOwners((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    );
  }

  function toggleExpanded(s: PipelineStatusEnum) {
    setExpanded((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setOwners([]);
  }

  // Exports every card that matches the current search and filters.
  function exportCsv() {
    const header = [
      "Prospect",
      "Primary contact",
      "Email",
      "Phone",
      "Follow-up date",
      "Target amount",
      "Probability",
      "Pipeline stage",
      "Owner",
    ];
    const lines = visible.map((r) =>
      [
        r.prospect_name,
        r.primary_contact_person,
        r.email_address,
        r.phone_number,
        r.target_followup_date,
        r.target_amount,
        `${r.probability}%`,
        r.pipeline_status,
        r.assigned_officer,
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
    a.download = `pipeline-board-${today || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="space-y-4">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Prospects</p>
              <h1 className="text-2xl leading-tight font-semibold text-text-primary">
                All open prospects
              </h1>
            </div>
            <p className="ml-2 self-end pb-1 text-xs text-text-secondary">
              {openCards.length} open · {peso.format(openTotal)} in pipeline ·
              Grouped by pipeline stage
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* List / Board toggle */}
            <div className="flex rounded-button border border-border-strong bg-white p-0.5 text-[13px]">
              <Link
                href="/donor-conv/prospects"
                className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-text-secondary hover:bg-surface-soft-hover"
              >
                <List className="h-3.5 w-3.5" /> List
              </Link>
              <span className="flex items-center gap-1.5 rounded-[4px] bg-surface-soft px-3 py-1.5 font-medium text-text-primary">
                <Kanban className="h-3.5 w-3.5" /> Board
              </span>
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

        {/* Search + filters */}
        <div className="flex items-center gap-3">
          <div className="flex w-64 items-center rounded-button border border-border-strong bg-white">
            <Search className="mx-2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this board"
              aria-label="Search prospect or contact person"
              className="h-9 w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
              className={cn(
                "flex h-9 items-center gap-2 rounded-button border px-3 text-[13px] font-medium",
                filterCount > 0
                  ? "border-brand-primary bg-brand-100 text-brand-primary"
                  : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters{filterCount > 0 ? ` (${filterCount})` : ""}
            </button>

            {filterOpen && (
              <div className="absolute left-0 z-20 mt-2 w-80 rounded-[10px] border border-border-soft bg-white p-4 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Filters
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    aria-label="Close filters"
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <fieldset className="mb-4">
                  <legend className="mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                    Follow-up date range
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-text-secondary">
                      From
                      <input
                        type="date"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="mt-1 h-9 w-full rounded-button border border-border-strong px-2 text-xs text-text-primary focus:outline-none"
                      />
                    </label>
                    <label className="text-xs text-text-secondary">
                      To
                      <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="mt-1 h-9 w-full rounded-button border border-border-strong px-2 text-xs text-text-primary focus:outline-none"
                      />
                    </label>
                  </div>
                  {dateRangeInvalid && (
                    <p className="mt-2 text-xs text-brand-danger">
                      The start date must be on or before the end date.
                    </p>
                  )}
                  <p className="mt-2 text-xs text-text-muted">
                    Prospects without a follow-up date are hidden while a date
                    range is set.
                  </p>
                </fieldset>

                <fieldset className="mb-4">
                  <legend className="mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                    Owner
                  </legend>
                  <div className="space-y-2">
                    {OWNERS.map((o) => (
                      <label
                        key={o}
                        className="flex items-center gap-2 text-[13px] text-text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={owners.includes(o)}
                          onChange={() => toggleOwner(o)}
                          className="h-3.5 w-3.5 accent-[#6b0f0f]"
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="flex items-center justify-between border-t border-border-soft pt-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={filterCount === 0}
                    className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="rounded-button bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Show {visible.length} result
                    {visible.length === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-5 items-start gap-4 overflow-x-auto">
          {columns.map(({ stage, cards, total }) => {
            const style = STAGE_STYLES[stage];
            const isExpanded = expanded.includes(stage);
            const shown = isExpanded ? cards : cards.slice(0, CARDS_PER_COLUMN);
            const hidden = cards.length - shown.length;

            return (
              <section
                key={stage}
                aria-label={stageLabel(stage)}
                className="min-w-0 rounded-[10px] bg-surface-soft p-3"
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                        style.badge,
                      )}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full", style.dot)}
                      />
                      {stageLabel(stage)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {cards.length}
                    </span>
                  </div>
                  <span className="truncate text-xs font-semibold text-text-primary">
                    {peso.format(total)}
                  </span>
                </header>

                <div className="space-y-3">
                  {cards.length === 0 && (
                    <p className="rounded-[8px] border border-dashed border-border-strong px-3 py-6 text-center text-xs text-text-muted">
                      No prospects
                    </p>
                  )}

                  {shown.map((l) => {
                    const dueToday =
                      !!today && l.target_followup_date === today;
                    const overdue =
                      !!today &&
                      !!l.target_followup_date &&
                      l.target_followup_date < today;

                    return (
                      <Link
                        key={l.id}
                        href={`/donor-conv/prospects/edit-prospect?id=${l.id}`}
                        className="block rounded-[8px] border border-border-soft bg-white p-3 shadow-soft hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      >
                        <p className="text-[13px] leading-snug font-semibold text-text-primary">
                          {l.prospect_name}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {l.primary_contact_person}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-text-primary">
                            {peso.format(l.target_amount)}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {l.probability}%
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          {/* Always shown so the follow-up date never disappears */}
                          <span
                            className={cn(
                              "flex items-center gap-1.5 text-xs",
                              !l.target_followup_date && "text-text-muted",
                              l.target_followup_date && "text-text-secondary",
                              overdue && "font-medium text-brand-danger",
                              dueToday && "font-medium text-amber-700",
                            )}
                          >
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {!l.target_followup_date
                              ? "No follow-up date"
                              : dueToday
                                ? "Due today"
                                : overdue
                                  ? `Overdue ${shortDate(l.target_followup_date)}`
                                  : `Follow up ${shortDate(l.target_followup_date)}`}
                          </span>
                          <span
                            title={l.assigned_officer}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-primary"
                          >
                            {initials(l.assigned_officer)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  {(hidden > 0 ||
                    (isExpanded && cards.length > CARDS_PER_COLUMN)) && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(stage)}
                      className="px-1 text-xs font-medium text-brand-primary hover:underline"
                    >
                      {isExpanded ? "Show less" : `Show ${hidden} more`}
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Note from the design */}
        <div className="flex items-center gap-2 rounded-[8px] border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-gray-700">
          <Info className="h-4 w-4 shrink-0 text-blue-600" />
          Cards move between columns automatically when the stage changes (panel
          revision 6). Dragging a card does not change its stage. Open a card to
          log an activity instead.
        </div>
      </div>
    </AppShell>
  );
}
