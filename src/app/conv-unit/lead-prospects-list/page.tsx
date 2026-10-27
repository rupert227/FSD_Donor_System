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

interface LeadRow {
  id: number;
  prospect_name: string;
  primary_contact_person: string;
  email_address: string | null;
  phone_number: string;
  target_followup_date: string | null; // YYYY-MM-DD
  pipeline_status: PipelineStatusEnum;
}

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

const SAMPLE_LEADS: LeadRow[] = [
  { id: 1, prospect_name: "Ayala Foundation", primary_contact_person: "Maria Santos", email_address: "msantos@ayalafoundation.org", phone_number: "0917 555 0101", target_followup_date: "2026-10-28", pipeline_status: "Outreach Started" },
  { id: 2, prospect_name: "Metro Pacific Health", primary_contact_person: "Daniel Reyes", email_address: "dreyes@mphealth.ph", phone_number: "0918 555 0102", target_followup_date: "2026-10-29", pipeline_status: "Proposal Sent" },
  { id: 3, prospect_name: "Metrobank Foundation", primary_contact_person: "Patricia Alcantara", email_address: "palcantara@mbfoundation.org", phone_number: "0919 555 0103", target_followup_date: "2026-10-30", pipeline_status: "Outreach Started" },
  { id: 4, prospect_name: "Jollibee Group Foundation", primary_contact_person: "Gisela Tiongson", email_address: "gtiongson@jollibeefoundation.org", phone_number: "0920 555 0104", target_followup_date: "2026-10-31", pipeline_status: "New Lead" },
  { id: 5, prospect_name: "Aboitiz Foundation", primary_contact_person: "Maribeth Marasigan", email_address: "mmarasigan@aboitiz.com", phone_number: "0921 555 0105", target_followup_date: "2026-11-02", pipeline_status: "Under Research" },
  { id: 6, prospect_name: "San Miguel Foundation", primary_contact_person: "Camilla Silva", email_address: "csilva@sanmiguel.com.ph", phone_number: "0922 555 0106", target_followup_date: "2026-11-03", pipeline_status: "Proposal Sent" },
  { id: 7, prospect_name: "BDO Foundation", primary_contact_person: "Mario Deriquito", email_address: "mderiquito@bdo.com.ph", phone_number: "0923 555 0107", target_followup_date: "2026-11-04", pipeline_status: "Outreach Started" },
  { id: 8, prospect_name: "Megaworld Foundation", primary_contact_person: "Rolando Toledo", email_address: "rtoledo@megaworld-lifestyle.com", phone_number: "0924 555 0108", target_followup_date: "2026-11-05", pipeline_status: "New Lead" },
  { id: 9, prospect_name: "GT Capital Holdings", primary_contact_person: "Anabelle Garcia", email_address: "agarcia@gtcapital.com.ph", phone_number: "0925 555 0109", target_followup_date: "2026-11-06", pipeline_status: "Under Research" },
  { id: 10, prospect_name: "JG Summit Holdings", primary_contact_person: "Lance Gokongwei", email_address: "lgokongwei@jgsummit.com.ph", phone_number: "0926 555 0110", target_followup_date: "2026-11-07", pipeline_status: "Proposal Sent" },
  { id: 11, prospect_name: "PHINMA Foundation", primary_contact_person: "Chito Salazar", email_address: "csalazar@phinma.com.ph", phone_number: "0927 555 0111", target_followup_date: "2026-11-08", pipeline_status: "Outreach Started" },
  { id: 12, prospect_name: "Tan Yan Kee Foundation", primary_contact_person: "Juanita Tan", email_address: "jtan@tanyankee.org", phone_number: "0928 555 0112", target_followup_date: "2026-11-09", pipeline_status: "New Lead" },
  { id: 13, prospect_name: "Mercury Drug Foundation", primary_contact_person: "Vivian Azcona", email_address: "vazcona@mercurydrug.com", phone_number: "0929 555 0113", target_followup_date: "2026-11-10", pipeline_status: "Under Research" },
  { id: 14, prospect_name: "First Philippine Holdings", primary_contact_person: "Federico Lopez", email_address: "flopez@fphc.com", phone_number: "0930 555 0114", target_followup_date: "2026-11-11", pipeline_status: "Proposal Sent" },
  { id: 15, prospect_name: "Unilab Foundation", primary_contact_person: "Rhodesian Ang", email_address: "rang@unilabfoundation.org", phone_number: "0931 555 0115", target_followup_date: "2026-11-12", pipeline_status: "Outreach Started" },
  { id: 16, prospect_name: "Insular Life Foundation", primary_contact_person: "Nina Aguas", email_address: "naguas@insularlife.com.ph", phone_number: "0932 555 0116", target_followup_date: "2026-11-13", pipeline_status: "New Lead" },
  { id: 17, prospect_name: "Nestlé Philippines", primary_contact_person: "Kais Marzouki", email_address: "kmarzouki@ph.nestle.com", phone_number: "0933 555 0117", target_followup_date: "2026-11-14", pipeline_status: "Under Research" },
  { id: 18, prospect_name: "RCBC / The Yuchengco Group", primary_contact_person: "Eugene Acevedo", email_address: "eacevedo@rcbc.com", phone_number: "0934 555 0118", target_followup_date: "2026-11-15", pipeline_status: "Proposal Sent" },
  { id: 19, prospect_name: "Security Bank Foundation", primary_contact_person: "Melissa Aquino", email_address: "maquino@securitybank.com.ph", phone_number: "0935 555 0119", target_followup_date: "2026-11-16", pipeline_status: "Outreach Started" },
  { id: 20, prospect_name: "Chinabank Foundation", primary_contact_person: "Romeo Uyan", email_address: "ruyan@chinabank.ph", phone_number: "0936 555 0120", target_followup_date: "2026-11-17", pipeline_status: "New Lead" },
  { id: 21, prospect_name: "SM Investments Corporation", primary_contact_person: "Frederic DyBuncio", email_address: "fdybuncio@sminvestments.com", phone_number: "0937 555 0121", target_followup_date: "2026-11-18", pipeline_status: "Under Research" },
  { id: 22, prospect_name: "San Lorenzo Ruiz Parish", primary_contact_person: "Fr. Juan Carlos Dizon", email_address: "parish@sanlorenzoruiz.ph", phone_number: "0938 555 0122", target_followup_date: "2026-11-19", pipeline_status: "Proposal Sent" },
  { id: 23, prospect_name: "Dela Cruz Family", primary_contact_person: "Rosario Dela Cruz", email_address: null, phone_number: "0939 555 0123", target_followup_date: null, pipeline_status: "New Lead" },
  { id: 24, prospect_name: "SM Foundation Inc.", primary_contact_person: "Fr. Anton Lopez", email_address: null, phone_number: "0940 555 0124", target_followup_date: null, pipeline_status: "Under Research" },
  { id: 25, prospect_name: "Yuchengco Group", primary_contact_person: "Victor Yu", email_address: "vyu@yuchengco.com", phone_number: "0941 555 0125", target_followup_date: "2026-10-26", pipeline_status: "Outreach Started" },
  ];

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
  [...SAMPLE_LEADS].sort(byFollowUpDate));
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

            {/* Filter panel (replaces the old "Filter (All)" button) */}
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
                  {/* Always rendered so the column never disappears after adding a lead */}
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
