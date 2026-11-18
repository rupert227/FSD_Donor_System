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
  Filter,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-care/struct";
import { useDocumentTitle } from "@/components/Navbar";
import type { TargetCampaignEnum, TreasuryClearanceStatusEnum } from "@/types";

const pageName = "Transactions";
const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Sample data (swap for the Supabase fetch later)                     */
/* "Handoff date" uses transaction_date. Dates sit around Oct-Nov 2026 */
/* so "Finalized this month" has rows when your clock is in Nov 2026.  */
/* ------------------------------------------------------------------ */

interface TransactionRow {
  id: number;
  donor_id: number;
  donor_name: string;
  campaign_name: TargetCampaignEnum;
  amount_collected: number;
  transaction_date: string; // YYYY-MM-DD, shown as the handoff date
  cod_requested: boolean; // Certificate of Donation requested
  treasury_clearance_status: TreasuryClearanceStatusEnum;
  official_receipt_no: string;
  tax_certificate_no: string | null;
}

const SAMPLE_TRANSACTIONS: TransactionRow[] = [
  {
    id: 1,
    donor_id: 1,
    donor_name: "Phinma Foundation, Inc.",
    campaign_name: "Health and Disaster Relief",
    amount_collected: 1200000,
    transaction_date: "2026-11-06",
    cod_requested: true,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2026-0412",
    tax_certificate_no: null,
  },
  {
    id: 2,
    donor_id: 2,
    donor_name: "Globe Telecom Community Fund",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 2500000,
    transaction_date: "2026-11-05",
    cod_requested: true,
    treasury_clearance_status: "Dispatch Prepared",
    official_receipt_no: "OR-2026-0411",
    tax_certificate_no: "COD-2026-0088",
  },
  {
    id: 3,
    donor_id: 3,
    donor_name: "San Miguel Foundation, Inc.",
    campaign_name: "In-Kind Social Enterprise",
    amount_collected: 1500000,
    transaction_date: "2026-11-03",
    cod_requested: false,
    treasury_clearance_status: "Certificate Creation",
    official_receipt_no: "OR-2026-0409",
    tax_certificate_no: null,
  },
  {
    id: 4,
    donor_id: 4,
    donor_name: "Jollibee Group Foundation",
    campaign_name: "In-Kind Social Enterprise",
    amount_collected: 1800000,
    transaction_date: "2026-11-02",
    cod_requested: false,
    treasury_clearance_status: "Dispatch Prepared",
    official_receipt_no: "OR-2026-0408",
    tax_certificate_no: null,
  },
  {
    id: 5,
    donor_id: 5,
    donor_name: "Mercury Drug Foundation",
    campaign_name: "Health and Disaster Relief",
    amount_collected: 500000,
    transaction_date: "2026-11-02",
    cod_requested: true,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2026-0407",
    tax_certificate_no: null,
  },
  {
    id: 6,
    donor_id: 6,
    donor_name: "First Pacific Leadership Academy",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 750000,
    transaction_date: "2026-10-30",
    cod_requested: false,
    treasury_clearance_status: "Transaction Finalized",
    official_receipt_no: "OR-2026-0399",
    tax_certificate_no: null,
  },
  {
    id: 7,
    donor_id: 7,
    donor_name: "GT Foundation, Inc.",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 800000,
    transaction_date: "2026-10-29",
    cod_requested: true,
    treasury_clearance_status: "Dispatch Prepared",
    official_receipt_no: "OR-2026-0396",
    tax_certificate_no: "COD-2026-0085",
  },
  {
    id: 8,
    donor_id: 8,
    donor_name: "Zuellig Family Foundation",
    campaign_name: "Institute for Stewardship",
    amount_collected: 1000000,
    transaction_date: "2026-11-04",
    cod_requested: false,
    treasury_clearance_status: "Transaction Finalized",
    official_receipt_no: "OR-2026-0410",
    tax_certificate_no: null,
  },
  {
    id: 9,
    donor_id: 9,
    donor_name: "LBC Foundation, Inc.",
    campaign_name: "Institute for Stewardship",
    amount_collected: 600000,
    transaction_date: "2025-08-14",
    cod_requested: false,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2025-0301",
    tax_certificate_no: null,
  },
  {
    id: 10,
    donor_id: 10,
    donor_name: "Ramon Aboitiz Foundation",
    campaign_name: "Health and Disaster Relief",
    amount_collected: 2000000,
    transaction_date: "2026-10-27",
    cod_requested: true,
    treasury_clearance_status: "Certificate Creation",
    official_receipt_no: "OR-2026-0391",
    tax_certificate_no: null,
  },
  {
    id: 11,
    donor_id: 11,
    donor_name: "Ayala Foundation",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 900000,
    transaction_date: "2026-11-07",
    cod_requested: false,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2026-0414",
    tax_certificate_no: null,
  },
  {
    id: 12,
    donor_id: 12,
    donor_name: "BDO Foundation",
    campaign_name: "At-Risk Restorative Justice",
    amount_collected: 450000,
    transaction_date: "2026-11-06",
    cod_requested: false,
    treasury_clearance_status: "Certificate Creation",
    official_receipt_no: "OR-2026-0413",
    tax_certificate_no: null,
  },
  {
    id: 13,
    donor_id: 13,
    donor_name: "Metrobank Foundation",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 1100000,
    transaction_date: "2026-11-05",
    cod_requested: true,
    treasury_clearance_status: "Dispatch Prepared",
    official_receipt_no: "OR-2026-0410B",
    tax_certificate_no: "COD-2026-0089",
  },
  {
    id: 14,
    donor_id: 14,
    donor_name: "Security Bank Foundation, Inc.",
    campaign_name: "In-Kind Social Enterprise",
    amount_collected: 350000,
    transaction_date: "2026-11-04",
    cod_requested: false,
    treasury_clearance_status: "Transaction Finalized",
    official_receipt_no: "OR-2026-0405",
    tax_certificate_no: null,
  },
  {
    id: 15,
    donor_id: 15,
    donor_name: "Lopez Group Foundation",
    campaign_name: "Institute for Stewardship",
    amount_collected: 2200000,
    transaction_date: "2026-11-03",
    cod_requested: true,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2026-0404",
    tax_certificate_no: null,
  },
  {
    id: 16,
    donor_id: 16,
    donor_name: "Manila Water Foundation",
    campaign_name: "Health and Disaster Relief",
    amount_collected: 700000,
    transaction_date: "2026-11-01",
    cod_requested: false,
    treasury_clearance_status: "Transaction Finalized",
    official_receipt_no: "OR-2026-0402",
    tax_certificate_no: null,
  },
  {
    id: 17,
    donor_id: 1,
    donor_name: "Phinma Foundation, Inc.",
    campaign_name: "Health and Disaster Relief",
    amount_collected: 300000,
    transaction_date: "2026-10-22",
    cod_requested: false,
    treasury_clearance_status: "Transaction Finalized",
    official_receipt_no: "OR-2026-0380",
    tax_certificate_no: null,
  },
  {
    id: 18,
    donor_id: 2,
    donor_name: "Globe Telecom Community Fund",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 1000000,
    transaction_date: "2026-10-21",
    cod_requested: true,
    treasury_clearance_status: "Transaction Finalized",
    official_receipt_no: "OR-2026-0378",
    tax_certificate_no: "COD-2026-0079",
  },
  {
    id: 19,
    donor_id: 11,
    donor_name: "Ayala Foundation",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 650000,
    transaction_date: "2026-10-20",
    cod_requested: false,
    treasury_clearance_status: "Dispatch Prepared",
    official_receipt_no: "OR-2026-0376",
    tax_certificate_no: null,
  },
  {
    id: 20,
    donor_id: 12,
    donor_name: "BDO Foundation",
    campaign_name: "At-Risk Restorative Justice",
    amount_collected: 500000,
    transaction_date: "2026-10-18",
    cod_requested: false,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2026-0371",
    tax_certificate_no: null,
  },
  {
    id: 21,
    donor_id: 13,
    donor_name: "Metrobank Foundation",
    campaign_name: "Youth Servant Leadership",
    amount_collected: 800000,
    transaction_date: "2026-10-16",
    cod_requested: true,
    treasury_clearance_status: "Certificate Creation",
    official_receipt_no: "OR-2026-0368",
    tax_certificate_no: null,
  },
  {
    id: 22,
    donor_id: 15,
    donor_name: "Lopez Group Foundation",
    campaign_name: "Institute for Stewardship",
    amount_collected: 1250000,
    transaction_date: "2026-10-15",
    cod_requested: false,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2026-0366",
    tax_certificate_no: null,
  },
  {
    id: 23,
    donor_id: 5,
    donor_name: "Mercury Drug Foundation",
    campaign_name: "Health and Disaster Relief",
    amount_collected: 400000,
    transaction_date: "2026-10-12",
    cod_requested: true,
    treasury_clearance_status: "Transaction Finalized",
    official_receipt_no: "OR-2026-0360",
    tax_certificate_no: "COD-2026-0071",
  },
  {
    id: 24,
    donor_id: 3,
    donor_name: "San Miguel Foundation, Inc.",
    campaign_name: "In-Kind Social Enterprise",
    amount_collected: 950000,
    transaction_date: "2026-10-10",
    cod_requested: false,
    treasury_clearance_status: "Receipt Verification",
    official_receipt_no: "OR-2026-0358",
    tax_certificate_no: null,
  },
];

// Earlier gifts that aren't in the list above. The lifecycle label is computed
// from these plus the donor's rows in SAMPLE_TRANSACTIONS.
const PAST_GIFTS: Record<number, string[]> = {
  1: ["2022-06-10", "2023-07-15", "2024-08-02", "2025-07-20"],
  2: ["2025-02-11"],
  3: ["2021-05-04", "2023-05-12", "2025-04-30"],
  5: ["2025-06-18"],
  6: ["2020-03-01", "2022-03-09", "2024-03-14"],
  7: ["2023-09-09", "2024-10-02", "2025-09-12"],
  8: ["2024-12-03"],
  10: ["2024-10-28"],
  11: ["2022-11-20", "2024-11-18"],
  13: ["2023-10-05", "2025-03-11"],
  14: ["2025-12-01"],
  15: ["2024-05-05", "2025-05-09"],
  16: ["2025-04-02"],
};

/* ------------------------------------------------------------------ */
/* Lifecycle label (computed, never picked by hand)                    */
/* The criteria don't give the rule yet, so these thresholds are an    */
/* assumption. Change them in computeLifecycle once the team decides.  */
/* ------------------------------------------------------------------ */

type Lifecycle = "New" | "Active" | "Regular" | "Dormant";
const LIFECYCLES: Lifecycle[] = ["Regular", "Active", "New", "Dormant"];

const LIFECYCLE_STYLES: Record<Lifecycle, string> = {
  Regular: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  Active: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  New: "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  Dormant: "bg-rose-50/60 text-[#8a3a3a] border border-[#ecd5d5]",
};

function computeLifecycle(
  dates: string[],
  today: string,
): { label: Lifecycle; reason: string } {
  const sorted = [...dates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const [y, m, d] = today.split("-");
  const cutoff = `${Number(y) - 1}-${m}-${d}`; // 12 months ago
  const years = new Set(sorted.map((x) => x.slice(0, 4))).size;

  if (last < cutoff) {
    return {
      label: "Dormant",
      reason: `Dormant: no gift in the last 12 months. Last gift was ${formatDate(last)}.`,
    };
  }
  if (first >= cutoff) {
    return {
      label: "New",
      reason: `New: first gift was within the last 12 months (${formatDate(first)}).`,
    };
  }
  if (years >= 3) {
    return {
      label: "Regular",
      reason: `Regular: gave in ${years} different years, including the last 12 months. Latest gift ${formatDate(last)}.`,
    };
  }
  return {
    label: "Active",
    reason: `Active: gave in the last 12 months (${formatDate(last)}) but not yet in 3 different years.`,
  };
}

/* ------------------------------------------------------------------ */
/* Labels, styles and dates                                            */
/* ------------------------------------------------------------------ */

const CLEARANCE_STATUSES: TreasuryClearanceStatusEnum[] = [
  "Receipt Verification",
  "Certificate Creation",
  "Dispatch Prepared",
  "Transaction Finalized",
];

const STATUS_STYLES: Record<TreasuryClearanceStatusEnum, string> = {
  "Receipt Verification": "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  "Certificate Creation": "bg-slate-100 text-slate-600 border border-slate-200",
  "Dispatch Prepared": "bg-amber-50/60 text-[#7a5e2c] border border-[#e8ddcb]",
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

type QuickView =
  "all" | "receipt" | "certificate" | "dispatch" | "tax" | "finalized";

const QUICK_VIEWS: { id: QuickView; label: string }[] = [
  { id: "all", label: "All open" },
  { id: "receipt", label: "Receipt verification" },
  { id: "certificate", label: "Certificate creation" },
  { id: "dispatch", label: "Dispatch prepared" },
  { id: "tax", label: "Tax certificate requested" },
  { id: "finalized", label: "Finalized this month" },
];

interface Row extends TransactionRow {
  lifecycle: Lifecycle | null;
  lifecycleReason: string;
}

function inQuickView(r: Row, view: QuickView, today: string) {
  switch (view) {
    case "receipt":
      return r.treasury_clearance_status === "Receipt Verification";
    case "certificate":
      return r.treasury_clearance_status === "Certificate Creation";
    case "dispatch":
      return r.treasury_clearance_status === "Dispatch Prepared";
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
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TransactionsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  const router = useRouter();
  const today = useToday();

  const [quickView, setQuickView] = useState<QuickView>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statuses, setStatuses] = useState<TreasuryClearanceStatusEnum[]>([]);
  const [lifecycles, setLifecycles] = useState<Lifecycle[]>([]);
  const [page, setPage] = useState(1);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close the filter panel when clicking outside it
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Each row gets its donor's computed lifecycle label (needs today's date)
  const rows: Row[] = useMemo(() => {
    const sorted = [...SAMPLE_TRANSACTIONS].sort(byHandoffDesc);
    const labels = new Map<number, { label: Lifecycle; reason: string }>();
    if (today) {
      for (const donorId of new Set(sorted.map((t) => t.donor_id))) {
        const dates = [
          ...(PAST_GIFTS[donorId] ?? []),
          ...sorted
            .filter((t) => t.donor_id === donorId)
            .map((t) => t.transaction_date),
        ];
        labels.set(donorId, computeLifecycle(dates, today));
      }
    }
    return sorted.map((t) => ({
      ...t,
      lifecycle: labels.get(t.donor_id)?.label ?? null,
      lifecycleReason: labels.get(t.donor_id)?.reason ?? "",
    }));
  }, [today]);

  const chipCounts = useMemo(
    () =>
      Object.fromEntries(
        QUICK_VIEWS.map((v) => [
          v.id,
          rows.filter((r) => inQuickView(r, v.id, today)).length,
        ]),
      ),
    [rows, today],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!inQuickView(r, quickView, today)) return false;
      if (
        q &&
        !r.donor_name.toLowerCase().includes(q) &&
        !r.official_receipt_no.toLowerCase().includes(q) &&
        !(r.tax_certificate_no ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (
        statuses.length > 0 &&
        !statuses.includes(r.treasury_clearance_status)
      ) {
        return false;
      }
      if (lifecycles.length > 0) {
        if (!r.lifecycle || !lifecycles.includes(r.lifecycle)) return false;
      }
      if (dateFrom && r.transaction_date < dateFrom) return false;
      if (dateTo && r.transaction_date > dateTo) return false;
      return true;
    });
  }, [rows, quickView, search, statuses, lifecycles, dateFrom, dateTo, today]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const filterCount =
    (dateFrom || dateTo ? 1 : 0) +
    (statuses.length > 0 ? 1 : 0) +
    (lifecycles.length > 0 ? 1 : 0);
  const hasActiveFilters =
    filterCount > 0 || search.trim() !== "" || quickView !== "all";
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  function resetPage() {
    setPage(1);
  }

  function toggleStatus(s: TreasuryClearanceStatusEnum) {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    resetPage();
  }

  function toggleLifecycle(l: Lifecycle) {
    setLifecycles((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );
    resetPage();
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setStatuses([]);
    setLifecycles([]);
    resetPage();
  }

  function resetAll() {
    clearFilters();
    setSearch("");
    setQuickView("all");
  }

  function exportCsv() {
    const header = [
      "Donor",
      "Campaign",
      "Amount",
      "Handoff date",
      "Tax certificate",
      "Clearance status",
      "Lifecycle",
      "Receipt no.",
      "COD no.",
    ];
    const lines = filtered.map((r) =>
      [
        r.donor_name,
        r.campaign_name,
        r.amount_collected,
        r.transaction_date,
        r.cod_requested ? "Requested" : "Not needed",
        r.treasury_clearance_status,
        r.lifecycle,
        r.official_receipt_no,
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
              {filtered.length} items · Sorted by handoff date
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
                  setQuickView(v.id);
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
          <div className="flex items-center gap-3 px-4 py-3">
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

            <div ref={filterRef} className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-button border px-3 text-[13px] font-medium",
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
                      className="cursor-pointer text-text-muted hover:text-text-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <fieldset className="mb-4">
                    <legend className="mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                      Handoff date range
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
                  </fieldset>

                  <fieldset className="mb-4">
                    <legend className="mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                      Clearance status
                    </legend>
                    <div className="space-y-2">
                      {CLEARANCE_STATUSES.map((s) => (
                        <label
                          key={s}
                          className="flex items-center gap-2 text-[13px] text-text-primary"
                        >
                          <input
                            type="checkbox"
                            checked={statuses.includes(s)}
                            onChange={() => toggleStatus(s)}
                            className="h-3.5 w-3.5 accent-[#6b0f0f]"
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="mb-4">
                    <legend className="mb-2 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                      Lifecycle
                    </legend>
                    <div className="space-y-2">
                      {LIFECYCLES.map((l) => (
                        <label
                          key={l}
                          className="flex items-center gap-2 text-[13px] text-text-primary"
                        >
                          <input
                            type="checkbox"
                            checked={lifecycles.includes(l)}
                            onChange={() => toggleLifecycle(l)}
                            className="h-3.5 w-3.5 accent-[#6b0f0f]"
                          />
                          {l}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="flex items-center justify-between border-t border-border-soft pt-3">
                    <button
                      type="button"
                      onClick={clearFilters}
                      disabled={filterCount === 0}
                      className="cursor-pointer text-xs font-medium text-text-secondary hover:text-text-primary disabled:cursor-default disabled:opacity-40"
                    >
                      Clear all
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      className="cursor-pointer rounded-button bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Show {filtered.length} result
                      {filtered.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              )}
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
                          No transactions match your current search or filters.
                        </p>
                        {hasActiveFilters && (
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
                            {peso.format(r.amount_collected)}
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
                              {r.treasury_clearance_status}
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
    </AppShell>
  );
}
