"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  X,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { PipelineStatusEnum } from "@/types";
import { SAMPLE_LEADS, type LeadDetail } from "@/lib/mock-data/leads";

const PAGE_SIZE = 10;

const PIPELINE_STATUSES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

const STATUS_STYLES: Record<PipelineStatusEnum, string> = {
  "New Lead": "bg-gray-100 text-gray-700",
  "Under Research": "bg-blue-50 text-blue-700",
  "Outreach Started": "bg-amber-50 text-amber-700",
  "Proposal Sent": "bg-purple-50 text-purple-700",
  "Secured Donor": "bg-green-50 text-green-700",
};

type LeadRow = LeadDetail;

function formatDate(value: string | null) {
  if (!value) return "Not set";
  // Parse as a plain date so timezones never shift the day
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Soonest first. Rows with no follow-up date go to the bottom.
function byFollowUpDate(a: LeadRow, b: LeadRow) {
  if (!a.target_followup_date && !b.target_followup_date) return 0;
  if (!a.target_followup_date) return 1;
  if (!b.target_followup_date) return -1;
  return a.target_followup_date.localeCompare(b.target_followup_date);
}

export default function LeadProspectsListPage() {
  const router = useRouter();

  const [rows] = useState<LeadRow[]>(() =>
    [...SAMPLE_LEADS].sort(byFollowUpDate)
  );
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statuses, setStatuses] = useState<PipelineStatusEnum[]>([]);
  const [page, setPage] = useState(1);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /*useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("lead_prospects")
        .select(
          "id, prospect_name, primary_contact_person, email_address, phone_number, target_followup_date, pipeline_status"
        );
      if (error) setError(error.message);
      else setRows(((data ?? []) as LeadRow[]).sort(byFollowUpDate));
      setLoading(false);
    }
    load();
  }, []);
  */
  // Close the filter panel when clicking outside it
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        q &&
        !r.prospect_name.toLowerCase().includes(q) &&
        !r.primary_contact_person.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statuses.length > 0 && !statuses.includes(r.pipeline_status)) {
        return false;
      }
      if (dateFrom || dateTo) {
        // A date range can only match rows that have a follow-up date
        if (!r.target_followup_date) return false;
        if (dateFrom && r.target_followup_date < dateFrom) return false;
        if (dateTo && r.target_followup_date > dateTo) return false;
      }
      return true;
    });
  }, [rows, search, statuses, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const activeFilterCount =
    (dateFrom || dateTo ? 1 : 0) + (statuses.length > 0 ? 1 : 0);
  const isFiltered = activeFilterCount > 0 || search.trim() !== "";

  function toggleStatus(s: PipelineStatusEnum) {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setPage(1);
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setStatuses([]);
    setPage(1);
  }

  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  return (
    <AppShell
      title="Donor Conversion"
      subtitle="Donor Conversion Workspace"
      tabs={[
        {
          label: "Leads",
          href: "/conv-unit/lead-prospects-list",
          isActive: true,
        },
        { label: "Proposals", href: "/conv-unit/generate-proposals" },
        { label: "Reports", href: "/conv-unit/analytics-report" },
      ]}
      actions={[
        {
          label: "Add lead",
          icon: Plus,
          variant: "primary",
          href: "/conv-unit/create-lead-profile",
        },
      ]}
    >
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header: count, search, filter */}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {pageRows.length} of {filtered.length} Prospects
            {isFiltered && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                (filtered from {rows.length})
              </span>
            )}
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search prospect or contact person"
                aria-label="Search prospect or contact person"
                className="w-72 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#801313] focus:outline-none focus:ring-1 focus:ring-[#801313]"
              />
            </div>

            {/* Filter panel */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold shadow-sm transition-colors",
                  activeFilterCount > 0
                    ? "border-[#801313] bg-red-50 text-[#801313]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                {activeFilterCount > 0
                  ? `Filter (${activeFilterCount})`
                  : "Filter (All)"}
              </button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Filter prospects
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      aria-label="Close filters"
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <fieldset className="mb-4">
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Follow-up date range
                    </legend>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-gray-600">
                        From
                        <input
                          type="date"
                          value={dateFrom}
                          max={dateTo || undefined}
                          onChange={(e) => {
                            setDateFrom(e.target.value);
                            setPage(1);
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-[#801313] focus:outline-none"
                        />
                      </label>
                      <label className="text-xs text-gray-600">
                        To
                        <input
                          type="date"
                          value={dateTo}
                          min={dateFrom || undefined}
                          onChange={(e) => {
                            setDateTo(e.target.value);
                            setPage(1);
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-900 focus:border-[#801313] focus:outline-none"
                        />
                      </label>
                    </div>
                    {dateRangeInvalid && (
                      <p className="mt-2 text-xs text-red-600">
                        The start date must be on or before the end date.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Leads without a follow-up date are hidden while a date
                      range is set.
                    </p>
                  </fieldset>

                  <fieldset className="mb-4">
                    <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Pipeline status
                    </legend>
                    <div className="space-y-2">
                      {PIPELINE_STATUSES.map((s) => (
                        <label
                          key={s}
                          className="flex items-center gap-2 text-xs text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={statuses.includes(s)}
                            onChange={() => toggleStatus(s)}
                            className="h-3.5 w-3.5 accent-[#801313]"
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={clearFilters}
                      disabled={activeFilterCount === 0}
                      className="text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-40"
                    >
                      Clear all
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(false)}
                      className="rounded-lg bg-[#801313] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#6b0f0f]"
                    >
                      Show {filtered.length} result
                      {filtered.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Prospect</th>
                <th className="px-4 py-3 font-semibold">Contact person</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Number</th>
                <th className="px-4 py-3 font-semibold">Follow-up date</th>
                <th className="px-4 py-3 font-semibold">Pipeline status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Loading prospects...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-red-600">
                    Could not load prospects: {error}
                  </td>
                </tr>
              )}
              {!loading && !error && pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No prospects match your search or filters.
                  </td>
                </tr>
              )}
              {pageRows.map((r) => (
                <tr
                  key={r.id}
                  tabIndex={0}
                  role="link"
                  onClick={() =>
                    router.push(`/conv-unit/update-lead-profile?id=${r.id}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      router.push(`/conv-unit/update-lead-profile?id=${r.id}`);
                  }}
                  className="cursor-pointer text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.prospect_name}
                  </td>
                  <td className="px-4 py-3">{r.primary_contact_person}</td>
                  <td className="px-4 py-3">{r.email_address ?? "—"}</td>
                  <td className="px-4 py-3">{r.phone_number}</td>
                  <td
                    className={cn(
                      "px-4 py-3 whitespace-nowrap",
                      !r.target_followup_date && "text-gray-400"
                    )}
                  >
                    {formatDate(r.target_followup_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
                        STATUS_STYLES[r.pipeline_status]
                      )}
                    >
                      {r.pipeline_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
