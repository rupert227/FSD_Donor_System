"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { getNavbarPreset, moduleName } from "@/app/donor-care/struct";
import { useDocumentTitle } from "@/components/Navbar";
import {
  PeriodFilter,
  ProspectSelectMenu,
} from "@/app/donor-conv/prospects/_components";
import type { TreasuryClearanceStatusEnum } from "@/types";
import {
  getTransactionList,
  type TransactionListRow,
} from "@/lib/transactions/actions";
import { isPendingReceiptNo, STAGE_LABELS } from "@/lib/transactions/constants";
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

const pageName = "Transactions";
const PAGE_SIZE = 10;

// Rows come from Supabase (see getTransactionList).
type TransactionRow = TransactionListRow;

/* ------------------------------------------------------------------ */
/* Labels, styles and dates                                            */
/* ------------------------------------------------------------------ */

const CLEARANCE_STATUSES: TreasuryClearanceStatusEnum[] = [
  "Receipt Verification",
  "Certificate Creation",
  "Dispatch Preparation",
  "Transaction Finalized",
];

const STATUS_STYLES: Record<TreasuryClearanceStatusEnum, string> = {
  "Receipt Verification": "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  "Certificate Creation": "bg-slate-100 text-slate-600 border border-slate-200",
  "Dispatch Preparation": "bg-amber-50/60 text-[#7a5e2c] border border-[#e8ddcb]",
  "Transaction Finalized":
    "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
};

const TAX_STYLES = {
  requested: "bg-white text-[#3f3f46] border border-[#b8b8b8]",
  notNeeded: "bg-white text-gray-500 border border-dashed border-gray-300",
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

/* ------------------------------------------------------------------ */
/* Quick views, helpers                                                */
/* ------------------------------------------------------------------ */

type QuickView = "all" | "tax" | "finalized";

const QUICK_VIEWS: { id: QuickView; label: string }[] = [
  // The clearance stages are left to the Clearance Status filter in the popup
  { id: "all", label: "All open" },
  { id: "tax", label: "Tax certificate requested" },
  { id: "finalized", label: "Finalized this month" },
];

/* ------------------------------------------------------------------ */
/* Filter popup options (same layout as the Prospects / Donors tables) */
/* ------------------------------------------------------------------ */

const STATUS_FILTER_OPTIONS = [
  { label: "All clearance statuses", value: "all" },
  ...CLEARANCE_STATUSES.map((s) => ({ label: STAGE_LABELS[s], value: s })),
];

const CAMPAIGN_FILTER_OPTIONS = [
  { label: "All campaigns", value: "all" },
  { label: "Youth Servant Leadership", value: "Youth Servant Leadership" },
  { label: "Health and Disaster Relief", value: "Health and Disaster Relief" },
  { label: "In-Kind Social Enterprise", value: "In-Kind Social Enterprise" },
  { label: "At-Risk Restorative Justice", value: "At-Risk Restorative Justice" },
  { label: "Institute for Stewardship", value: "Institute for Stewardship" },
];

// The label is what staff see; the value is what the table stores
const PAYMENT_METHOD_FILTER_OPTIONS = [
  { label: "All payment methods", value: "all" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Check Payment", value: "Check Payment" },
  { label: "Cash Payment", value: "Cash" },
];

// Same options as the Donors table filter
const DONOR_TYPE_FILTER_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Corporate", value: "corporate" },
  { label: "Individual", value: "individual" },
  { label: "Community", value: "community" },
  { label: "International", value: "international" },
];

interface TransactionFilters {
  status: string;
  campaign: string;
  paymentMethod: string;
  donorType: string;
}

const DEFAULT_FILTERS: TransactionFilters = {
  status: "all",
  campaign: "all",
  paymentMethod: "all",
  donorType: "all",
};

type Row = TransactionRow;

function matchesFilters(r: Row, f: TransactionFilters) {
  if (f.status !== "all" && r.treasury_clearance_status !== f.status) return false;
  if (f.campaign !== "all" && r.campaign_name !== f.campaign) return false;
  if (f.paymentMethod !== "all" && r.payment_method !== f.paymentMethod) return false;
  if (f.donorType !== "all" && r.donor_type !== f.donorType) return false;
  return true;
}

function inQuickView(r: Row, view: QuickView, today: string) {
  switch (view) {
    case "tax":
      return r.cod_requested;
    case "finalized":
      return (
        r.treasury_clearance_status === "Transaction Finalized" &&
        !!today &&
        r.transaction_date.slice(0, 7) === today.slice(0, 7)
      );
    default:
      return true;
  }
}

// Newest handoff first
function byHandoffDesc(a: TransactionRow, b: TransactionRow) {
  return b.transaction_date.localeCompare(a.transaction_date);
}

// 1 2 3 ... 22 style page list
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
/* Skeleton loader matching the Prospects / Donors tables              */
/* ------------------------------------------------------------------ */

const SKELETON_CELL_WIDTHS = ["w-32", "w-28", "w-20", "w-20", "w-24"];

function TransactionsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="h-3 w-20 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-7 w-52 bg-gray-200/80 rounded mt-1.5 animate-pulse" />
          </div>
          <div className="ml-2 self-end pb-1 h-3.5 w-52 bg-gray-200/80 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-36 bg-gray-300/80 rounded-button animate-pulse" />
        </div>
      </div>

      {/* Quick views */}
      <div className="flex flex-wrap gap-2">
        {QUICK_VIEWS.map((v) => (
          <div key={v.id} className="h-9 w-24 bg-gray-200/80 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="h-9 w-72 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
          <div className="h-9 w-20 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
          <div className="ml-auto h-9 w-9 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
        </div>

        <div className="min-h-[440px] overflow-x-auto">
          <table className="w-full text-center text-[12px]">
            <thead className="bg-surface-soft text-text-secondary">
              <tr className="border-y border-border-soft">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <th key={idx} className="px-3 py-2.5 text-center font-medium">
                    <div className="h-3 w-16 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border-soft h-[39px]">
                  {SKELETON_CELL_WIDTHS.map((w, idx) => (
                    <td key={idx} className="px-3 py-2.5">
                      <div className={cn("h-3.5 bg-gray-200/70 rounded mx-auto animate-pulse", w)} />
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <div className="h-5 w-28 bg-gray-200/70 rounded-[4px] mx-auto animate-pulse" />
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
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TransactionsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  const router = useRouter();
  const today = useToday();

  const [quickView, setQuickView] = useState<QuickView>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Committed popup filters, and the draft edited in the popup until Apply
  const [applied, setApplied] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<TransactionFilters>(DEFAULT_FILTERS);

  // Year / quarter of the handoff date. A null applied period follows the
  // current quarter, like the Prospects and Donors tables.
  const [appliedPeriod, setAppliedPeriod] = useState<Period | null>(null);
  const [draftPeriod, setDraftPeriod] = useState<Period>(ALL_PERIODS);
  const defaultPeriod = useMemo(() => currentPeriod(today), [today]);
  const period = appliedPeriod ?? defaultPeriod;

  const [filterOpen, setFilterOpen] = useState(false);
  const [isFilterExiting, setIsFilterExiting] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    getTransactionList().then((list) => {
      if (cancelled) return;
      if (list) {
        setTransactions(list);
        setLoadState("ready");
      } else {
        setLoadState("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Prevent background scrolling while the filter popup is open
  useEffect(() => {
    if (!filterOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [filterOpen]);

  // Escape closes the popup and discards unapplied changes
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

  const rows: Row[] = useMemo(
    () => [...transactions].sort(byHandoffDesc),
    [transactions],
  );

  const years = useMemo(
    () => periodYears(transactions.map((t) => t.transaction_date), today),
    [transactions, today],
  );

  const periodRows = useMemo(
    () => rows.filter((r) => matchesPeriod(r.transaction_date, period)),
    [rows, period],
  );

  // Pill counts follow the selected period, like the Donors table
  const chipCounts = useMemo(
    () =>
      Object.fromEntries(
        QUICK_VIEWS.map((v) => [
          v.id,
          periodRows.filter((r) => inQuickView(r, v.id, today)).length,
        ]),
      ),
    [periodRows, today],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodRows.filter((r) => {
      if (!inQuickView(r, quickView, today)) return false;
      if (
        q &&
        !r.donor_name.toLowerCase().includes(q) &&
        // Only issued numbers are searchable, not the PENDING placeholder
        !(isPendingReceiptNo(r.official_receipt_no) ? "" : r.official_receipt_no)
          .toLowerCase()
          .includes(q) &&
        !(r.tax_certificate_no ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return matchesFilters(r, applied);
    });
  }, [periodRows, quickView, search, applied, today]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  // Count of committed popup filters
  const filterCount =
    (applied.status !== "all" ? 1 : 0) +
    (applied.campaign !== "all" ? 1 : 0) +
    (applied.paymentMethod !== "all" ? 1 : 0) +
    (applied.donorType !== "all" ? 1 : 0) +
    (samePeriod(period, defaultPeriod) ? 0 : 1);
  const hasActiveFilters =
    filterCount > 0 ||
    !isAllPeriods(period) ||
    search.trim() !== "" ||
    quickView !== "all";
  const hasDraftChanges =
    JSON.stringify(draft) !== JSON.stringify(DEFAULT_FILTERS) ||
    !samePeriod(draftPeriod, defaultPeriod);

  function resetPage() {
    setPage(1);
  }

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
    resetPage();
    setIsFilterExiting(true);
    setTimeout(() => {
      setFilterOpen(false);
      setIsFilterExiting(false);
    }, 160);
  }

  function resetAll() {
    setApplied(DEFAULT_FILTERS);
    setDraft(DEFAULT_FILTERS);
    setAppliedPeriod(null);
    setDraftPeriod(defaultPeriod);
    setSearch("");
    setQuickView("all");
    resetPage();
  }

  function exportCsv() {
    const header = [
      "Donor",
      "Campaign",
      "Amount",
      "Handoff date",
      "Tax certificate",
      "Clearance status",
      "Payment method",
      "Amount collected",
      "Receipt no.",
      "COD no.",
    ];
    const lines = filtered.map((r) =>
      [
        r.donor_name,
        r.campaign_name,
        r.amount_pledge,
        r.transaction_date,
        r.cod_requested ? "Requested" : "Not needed",
        STAGE_LABELS[r.treasury_clearance_status],
        r.payment_method,
        r.amount_collected,
        isPendingReceiptNo(r.official_receipt_no) ? "" : r.official_receipt_no,
        r.tax_certificate_no,
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
    a.download = `transactions-${today || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell navbarPreset={navbarPreset}>
      {loadState === "loading" ? (
        <TransactionsTableSkeleton />
      ) : (
      <div className="space-y-4">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-text-secondary">Transactions</p>
              <h1 className="text-2xl leading-tight font-semibold text-text-primary">
                All open transactions
              </h1>
            </div>
            <p className="ml-2 self-end pb-1 text-xs text-text-secondary">
              {filtered.length} items · {periodLabel(period)} · Sorted by handoff date
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-button border border-button-stroke bg-white px-3 text-[13px] font-medium text-text-primary hover:bg-surface-soft-hover"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <Link
              href="/donor-care/transactions/add-transaction"
              className="flex h-9 items-center gap-2 rounded-button bg-brand-primary px-4 text-[13px] font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New transaction
            </Link>
          </div>
        </div>

        {/* Quick views */}
        <div className="flex flex-wrap gap-2">
          {QUICK_VIEWS.map((v) => {
            const active = quickView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  // Clicking the active pill again goes back to All, like the Donors table
                  setQuickView((prev) => (prev === v.id ? "all" : v.id));
                  resetPage();
                }}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors",
                  active
                    ? "border-text-primary bg-text-primary text-white"
                    : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                )}
              >
                {v.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-surface-soft text-text-secondary",
                  )}
                >
                  {chipCounts[v.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table card */}
        <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
          <div className="flex flex-wrap items-center gap-3 p-3">
            <div className="flex w-72 items-center rounded-button border border-border-strong bg-white">
              <Search className="mx-2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                placeholder="Search donor, receipt or COD no."
                aria-label="Search donor, receipt or COD number"
                className="h-9 w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            {/* Filter trigger and popup, same as the Prospects / Donors tables */}
            <div ref={filterRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (filterOpen) closePopup();
                  else openPopup();
                }}
                aria-expanded={filterOpen}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-button border px-3 text-[0.8125rem] font-medium transition-colors cursor-pointer",
                  filterCount > 0
                    ? "border-[#5c5757] bg-surface-soft text-text-primary"
                    : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                )}
              >
                Filters{filterCount > 0 ? ` (${filterCount})` : ""}
              </button>

              {filterOpen && (
                <>
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

                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      {/* Year and quarter of the handoff date */}
                      <PeriodFilter
                        value={draftPeriod}
                        years={years}
                        onChange={setDraftPeriod}
                        dateLabel="handoff date"
                      />

                      <div>
                        <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                          Clearance Status
                        </label>
                        <ProspectSelectMenu
                          value={draft.status}
                          onChange={(val) => setDraft((prev) => ({ ...prev, status: val }))}
                          options={STATUS_FILTER_OPTIONS}
                        />
                      </div>

                      <div>
                        <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                          Campaign
                        </label>
                        <ProspectSelectMenu
                          value={draft.campaign}
                          onChange={(val) => setDraft((prev) => ({ ...prev, campaign: val }))}
                          options={CAMPAIGN_FILTER_OPTIONS}
                        />
                      </div>

                      <div>
                        <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                          Payment Method
                        </label>
                        <ProspectSelectMenu
                          value={draft.paymentMethod}
                          onChange={(val) => setDraft((prev) => ({ ...prev, paymentMethod: val }))}
                          options={PAYMENT_METHOD_FILTER_OPTIONS}
                        />
                      </div>

                      <div>
                        <label className="block text-[0.6875rem] font-medium text-[#5c5757] mb-1.5">
                          Donor Type
                        </label>
                        <ProspectSelectMenu
                          value={draft.donorType}
                          onChange={(val) => setDraft((prev) => ({ ...prev, donorType: val }))}
                          options={DONOR_TYPE_FILTER_OPTIONS}
                        />
                      </div>
                    </div>

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

            {/* Far-right reset filters icon button */}
            <div className="ml-auto relative group">
              <button
                type="button"
                onClick={resetAll}
                aria-label="Reset filters"
                className="flex h-9 w-9 items-center justify-center rounded-button border border-border-strong bg-white text-text-secondary hover:bg-surface-soft hover:text-text-primary transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <div
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full mt-1.5 hidden group-hover:block whitespace-nowrap rounded bg-[#1c1a1a] px-2 py-1 text-[0.6875rem] font-medium text-white shadow-md z-30"
              >
                Reset filters
              </div>
            </div>
          </div>

          {/* Same table format as the Donor Conversion lists: centered columns,
              12px text, fixed 10-row height so popups never get cut */}
          <div className="min-h-[440px] overflow-x-auto">
            <table className="w-full text-center text-[12px]">
              <thead className="bg-surface-soft text-text-secondary">
                <tr className="border-y border-border-soft">
                  <th className="px-3 py-2.5 text-center text-[12px] font-medium">
                    Donor
                  </th>
                  <th className="px-3 py-2.5 text-center text-[12px] font-medium">
                    Campaign
                  </th>
                  <th className="px-3 py-2.5 text-center text-[12px] font-medium">
                    Amount
                  </th>
                  <th className="px-3 py-2.5 text-center text-[12px] font-medium">
                    Handoff date
                  </th>
                  <th className="px-3 py-2.5 text-center text-[12px] font-medium">
                    Tax certificate
                  </th>
                  <th className="px-3 py-2.5 text-center text-[12px] font-medium">
                    Clearance status
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-24 text-center text-[12px] text-text-secondary"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="font-medium text-text-primary">
                          {loadState === "error"
                              ? "Couldn't load transactions. Refresh the page to try again."
                              : `No transactions match your current search or filters${
                                  isAllPeriods(period) ? "." : ` for ${periodLabel(period)}.`
                                }`}
                        </p>
                        {loadState === "ready" && hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetAll}
                            className="mt-1 cursor-pointer rounded-button border border-border-strong bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-soft"
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
                      const href = `/donor-care/transactions/edit-transaction?id=${r.id}`;
                      return (
                        <tr
                          key={r.id}
                          tabIndex={0}
                          role="link"
                          onClick={() => router.push(href)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") router.push(href);
                          }}
                          className="h-[39px] cursor-pointer border-b border-border-soft text-text-primary hover:bg-surface-soft focus:bg-surface-soft focus:outline-none"
                        >
                          <td className="px-3 py-2.5 text-center text-[12px] font-semibold">
                            {r.donor_name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-[12px]">
                            {r.campaign_name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-[12px] whitespace-nowrap">
                            {peso.format(r.amount_pledge)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-[12px] whitespace-nowrap">
                            {formatDate(r.transaction_date)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              style={
                                r.cod_requested
                                  ? {
                                      backgroundColor: "#ffffff",
                                      borderColor: "#b8b8b8",
                                      color: "#3f3f46",
                                    }
                                  : undefined
                              }
                              className={cn(
                                "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
                                r.cod_requested
                                  ? TAX_STYLES.requested
                                  : TAX_STYLES.notNeeded,
                              )}
                            >
                              {r.cod_requested ? "Requested" : "Not needed"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
                                STATUS_STYLES[r.treasury_clearance_status],
                              )}
                            >
                              {STAGE_LABELS[r.treasury_clearance_status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Filler rows keep the table at 10 rows tall */}
                    {Array.from({
                      length: Math.max(0, PAGE_SIZE - pageRows.length),
                    }).map((_, i) => (
                      <tr
                        key={`filler-${i}`}
                        className="pointer-events-none h-[39px] border-b border-border-soft/40 select-none"
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
                ? "Showing 0 transactions"
                : `Showing ${start + 1}–${start + pageRows.length} of ${filtered.length} transactions`}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-button border border-border-strong hover:bg-surface-soft-hover disabled:cursor-default disabled:opacity-40"
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
                      "h-8 min-w-8 cursor-pointer rounded-button border px-2 text-[13px]",
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
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-button border border-border-strong hover:bg-surface-soft-hover disabled:cursor-default disabled:opacity-40"
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
