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
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Kanban,
  List,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";

import { SAMPLE_LEADS, type LeadDetail } from "@/lib/mock-data/leads";
import type { PipelineStatusEnum } from "@/types";

import { useDocumentTitle } from "@/components/Navbar";

const pageName = "Prospects"

const PAGE_SIZE = 10;

// Swap for the signed-in officer once auth exists.
const CURRENT_OFFICER = "Officer J. Reyes";

// "All open prospects" leaves out Secured Donor, same as the board design.
const OPEN_STAGES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
];

type QuickView = "all" | "due-today" | "overdue" | "mine" | "proposal-sent";

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

// Today's date as YYYY-MM-DD. The server snapshot is "" so the server HTML and
// the first client render match (no hydration warning), then the real date fills in.
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

// Soonest first. Prospects with no follow-up date go to the bottom.
function byFollowUpDate(a: LeadDetail, b: LeadDetail) {
  if (!a.target_followup_date && !b.target_followup_date) return 0;
  if (!a.target_followup_date) return 1;
  if (!b.target_followup_date) return -1;
  return a.target_followup_date.localeCompare(b.target_followup_date);
}

// 1 2 3 ... 15 style page list
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

export default function ProspectsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  const router = useRouter();
  const today = useToday();

  const [quickView, setQuickView] = useState<QuickView>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stages, setStages] = useState<PipelineStatusEnum[]>([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);

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

  // Open prospects, sorted once. Replace SAMPLE_LEADS with the Supabase fetch later.
  const openRows = useMemo(
    () =>
      SAMPLE_LEADS.filter((l) => OPEN_STAGES.includes(l.pipeline_status)).sort(
        byFollowUpDate,
      ),
    [],
  );

  const isDueToday = (l: LeadDetail) =>
    !!today && l.target_followup_date === today;
  const isOverdue = (l: LeadDetail) =>
    !!today && !!l.target_followup_date && l.target_followup_date < today;

  const chipCounts = useMemo(
    () => ({
      all: openRows.length,
      "due-today": openRows.filter(isDueToday).length,
      overdue: openRows.filter(isOverdue).length,
      mine: openRows.filter((l) => l.assigned_officer === CURRENT_OFFICER)
        .length,
      "proposal-sent": openRows.filter(
        (l) => l.pipeline_status === "Proposal Sent",
      ).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openRows, today],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return openRows.filter((l) => {
      if (quickView === "due-today" && !isDueToday(l)) return false;
      if (quickView === "overdue" && !isOverdue(l)) return false;
      if (quickView === "mine" && l.assigned_officer !== CURRENT_OFFICER)
        return false;
      if (
        quickView === "proposal-sent" &&
        l.pipeline_status !== "Proposal Sent"
      )
        return false;

      if (
        q &&
        !l.prospect_name.toLowerCase().includes(q) &&
        !l.primary_contact_person.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (stages.length > 0 && !stages.includes(l.pipeline_status))
        return false;

      if (dateFrom || dateTo) {
        if (!l.target_followup_date) return false; // no date can't be in a range
        if (dateFrom && l.target_followup_date < dateFrom) return false;
        if (dateTo && l.target_followup_date > dateTo) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRows, quickView, search, stages, dateFrom, dateTo, today]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const filterCount =
    (dateFrom || dateTo ? 1 : 0) + (stages.length > 0 ? 1 : 0);
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  function resetPage() {
    setPage(1);
  }

  function toggleStage(s: PipelineStatusEnum) {
    setStages((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    resetPage();
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setStages([]);
    resetPage();
  }

  function toggleRow(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function togglePage() {
    const ids = pageRows.map((r) => r.id);
    setSelected((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])],
    );
  }

  // Exports the selected rows if any are ticked, otherwise everything that matches the filters.
  function exportCsv() {
    const rows =
      selected.length > 0
        ? filtered.filter((r) => selected.includes(r.id))
        : filtered;
    const header = [
      "Prospect",
      "Primary contact",
      "Email",
      "Phone",
      "Follow-up date",
      "Target amount",
      "Pipeline stage",
      "Owner",
    ];
    const lines = rows.map((r) =>
      [
        r.prospect_name,
        r.primary_contact_person,
        r.email_address,
        r.phone_number,
        r.target_followup_date,
        r.target_amount,
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
    a.download = `prospects-${today || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const chips: { id: QuickView; label: string }[] = [
    { id: "all", label: "All open" },
    { id: "due-today", label: "Due today" },
    { id: "overdue", label: "Overdue" },
    { id: "mine", label: "My prospects" },
    { id: "proposal-sent", label: "Proposal sent" },
  ];

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
          {chips.map((c) => {
            const active = quickView === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setQuickView(c.id);
                  resetPage();
                }}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium",
                  active
                    ? "bg-text-primary text-white"
                    : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                )}
              >
                {c.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-surface-soft text-text-secondary",
                  )}
                >
                  {chipCounts[c.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table card */}
        <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
          <div className="flex items-center gap-3 p-3">
            <div className="flex w-64 items-center rounded-button border border-border-strong bg-white">
              <Search className="mx-2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                placeholder="Search this list"
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
                          onChange={(e) => {
                            setDateFrom(e.target.value);
                            resetPage();
                          }}
                          className="mt-1 h-9 w-full rounded-button border border-border-strong px-2 text-xs text-text-primary focus:outline-none"
                        />
                      </label>
                      <label className="text-xs text-text-secondary">
                        To
                        <input
                          type="date"
                          value={dateTo}
                          min={dateFrom || undefined}
                          onChange={(e) => {
                            setDateTo(e.target.value);
                            resetPage();
                          }}
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
                      Pipeline stage
                    </legend>
                    <div className="space-y-2">
                      {OPEN_STAGES.map((s) => (
                        <label
                          key={s}
                          className="flex items-center gap-2 text-[13px] text-text-primary"
                        >
                          <input
                            type="checkbox"
                            checked={stages.includes(s)}
                            onChange={() => toggleStage(s)}
                            className="h-3.5 w-3.5 accent-[#6b0f0f]"
                          />
                          {stageLabel(s)}
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
                      Show {filtered.length} result
                      {filtered.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface-soft text-text-secondary">
                <tr className="border-y border-border-soft">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={togglePage}
                      aria-label="Select all on this page"
                      className="h-3.5 w-3.5 accent-[#6b0f0f]"
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Prospect</th>
                  <th className="px-3 py-3 font-medium">Primary contact</th>
                  <th className="px-3 py-3 font-medium">Phone Number</th>
                  <th className="px-3 py-3 font-medium">Follow-up date</th>
                  <th className="px-3 py-3 font-medium">Target amount</th>
                  <th className="px-3 py-3 font-medium">Engagement status</th>
                  <th className="px-3 py-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-text-secondary"
                    >
                      No prospects match your search or filters.
                    </td>
                  </tr>
                )}
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
                      className="cursor-pointer border-b border-border-soft text-text-primary hover:bg-surface-soft focus:bg-surface-soft focus:outline-none"
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(r.id)}
                          onChange={() => toggleRow(r.id)}
                          aria-label={`Select ${r.prospect_name}`}
                          className="h-3.5 w-3.5 accent-[#6b0f0f]"
                        />
                      </td>
                      <td className="px-3 py-3 font-semibold">
                        {r.prospect_name}
                      </td>
                      <td className="px-3 py-3">{r.primary_contact_person}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {r.phone_number}
                      </td>
                      {/* Always rendered so the column never disappears */}
                      <td
                        className={cn(
                          "px-3 py-3 whitespace-nowrap",
                          !r.target_followup_date && "text-text-muted",
                          isOverdue(r) && "font-medium text-brand-danger",
                          isDueToday(r) && "font-medium text-amber-700",
                        )}
                      >
                        {isDueToday(r)
                          ? "Due today"
                          : formatDate(r.target_followup_date)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {peso.format(r.target_amount)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                            style.badge,
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              style.dot,
                            )}
                          />
                          {stageLabel(r.pipeline_status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {r.assigned_officer}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-xs text-text-secondary">
            <span>
              {filtered.length === 0
                ? "Showing 0 prospects"
                : `Showing ${start + 1}–${start + pageRows.length} of ${filtered.length} prospects`}
              {selected.length > 0 && ` · ${selected.length} selected`}
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
    </AppShell>
  );
}
