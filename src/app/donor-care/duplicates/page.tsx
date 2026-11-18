"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  GitMerge,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-care/struct";
import { useDocumentTitle } from "@/components/Navbar";

const pageName = "Duplicates";

/* ------------------------------------------------------------------ */
/* Sample data (swap for the scan results later)                       */
/* `differs` is what the scan reports. The matching rule itself is     */
/* still undecided (D-7), so it is stored here instead of computed.    */
/* ------------------------------------------------------------------ */

type FieldKey =
  | "org"
  | "contact"
  | "email"
  | "mobile"
  | "address"
  | "tin"
  | "transactions"
  | "updated";

interface Profile {
  org: string;
  contact: string;
  email: string;
  mobile: string;
  address: string;
  tin: string;
  txCount: number;
  txTotal: number;
  updated: string; // YYYY-MM-DD
}

interface Pair {
  id: number;
  score: number;
  summary: string;
  differs: FieldKey[];
  a: Profile;
  b: Profile;
}

const INITIAL_PAIRS: Pair[] = [
  {
    id: 1,
    score: 94,
    summary: "Same name, email and mobile. Address and TIN differ.",
    differs: ["address", "tin"],
    a: {
      org: "Phinma Foundation, Inc.",
      contact: "Peter Perfecto",
      email: "p.perfecto@phinma.com.ph",
      mobile: "+63 917 887 0100",
      address: "39 Plaza Drive, Rockwell Center, Makati",
      tin: "102-345-678-000",
      txCount: 3,
      txTotal: 3700000,
      updated: "2026-07-28",
    },
    b: {
      org: "Phinma Foundation Inc.",
      contact: "Peter A. Perfecto",
      email: "p.perfecto@phinma.com.ph",
      mobile: "+63 917 887 0100",
      address: "Rockwell Center, Makati City",
      tin: "000-410-992-000",
      txCount: 1,
      txTotal: 1000000,
      updated: "2025-05-14",
    },
  },
  {
    id: 2,
    score: 91,
    summary: "Same name, email and TIN. Mobile and address differ.",
    differs: ["mobile", "address"],
    a: {
      org: "Ayala Foundation",
      contact: "Maria Santos",
      email: "msantos@ayalafoundation.org",
      mobile: "+63 917 555 0101",
      address: "Makati Avenue, Makati City",
      tin: "004-228-317-000",
      txCount: 6,
      txTotal: 8450000,
      updated: "2026-11-07",
    },
    b: {
      org: "Ayala Foundation Inc.",
      contact: "Maria T. Santos",
      email: "msantos@ayalafoundation.org",
      mobile: "+63 2 8848 5000",
      address: "Ayala Triangle, Makati City",
      tin: "004-228-317-000",
      txCount: 2,
      txTotal: 1300000,
      updated: "2024-03-02",
    },
  },
  {
    id: 3,
    score: 88,
    summary: "Same name and contact person. Email and TIN differ.",
    differs: ["email", "tin"],
    a: {
      org: "Rotary Club of Manila Foundation",
      contact: "Ramon Soriano",
      email: "rsoriano@rotarymanila.org",
      mobile: "+63 2 8523 8888",
      address: "Ermita, Manila",
      tin: "005-117-440-000",
      txCount: 4,
      txTotal: 2200000,
      updated: "2026-10-31",
    },
    b: {
      org: "Rotary Club of Manila",
      contact: "Ramon Soriano",
      email: "secretary@rotarymanila.org",
      mobile: "+63 2 8523 8888",
      address: "Ermita, Manila",
      tin: "005-117-440-001",
      txCount: 1,
      txTotal: 250000,
      updated: "2023-09-19",
    },
  },
  {
    id: 4,
    score: 86,
    summary: "Similar name and same email. Contact, mobile and address differ.",
    differs: ["contact", "mobile", "address"],
    a: {
      org: "St. Jude Catholic School Alumni",
      contact: "Fr. Paolo Mercado",
      email: "alumni@stjude.edu.ph",
      mobile: "+63 2 8735 6281",
      address: "Mendiola, San Miguel, Manila",
      tin: "007-662-190-000",
      txCount: 2,
      txTotal: 640000,
      updated: "2026-11-09",
    },
    b: {
      org: "St Jude Catholic Alumni Assoc.",
      contact: "Paolo Mercado",
      email: "alumni@stjude.edu.ph",
      mobile: "+63 917 702 4411",
      address: "J.P. Laurel St., Manila",
      tin: "007-662-190-000",
      txCount: 1,
      txTotal: 120000,
      updated: "2022-12-05",
    },
  },
  {
    id: 5,
    score: 83,
    summary: "Same mobile and TIN. Email and address differ.",
    differs: ["email", "address"],
    a: {
      org: "Jose M. Lim",
      contact: "Jose M. Lim",
      email: "jose.lim@gmail.com",
      mobile: "+63 918 555 0140",
      address: "12 Acacia Lane, Quezon City",
      tin: "311-208-554-000",
      txCount: 3,
      txTotal: 450000,
      updated: "2026-09-12",
    },
    b: {
      org: "Jose Lim",
      contact: "Jose Lim",
      email: "jlim.work@yahoo.com",
      mobile: "+63 918 555 0140",
      address: "Unit 4B, Katipunan Ave., Quezon City",
      tin: "311-208-554-000",
      txCount: 1,
      txTotal: 75000,
      updated: "2024-06-30",
    },
  },
  {
    id: 6,
    score: 81,
    summary: "Same name and email. TIN and mobile differ.",
    differs: ["tin", "mobile"],
    a: {
      org: "Pilmico Foods Community Fund",
      contact: "Marites Uy",
      email: "muy@pilmico.com",
      mobile: "+63 2 8886 2800",
      address: "Pasong Tamo, Makati City",
      tin: "009-875-212-000",
      txCount: 2,
      txTotal: 900000,
      updated: "2026-11-10",
    },
    b: {
      org: "Pilmico Foods Fund",
      contact: "Marites Uy",
      email: "muy@pilmico.com",
      mobile: "+63 917 886 2800",
      address: "Pasong Tamo, Makati City",
      tin: "009-875-212-002",
      txCount: 1,
      txTotal: 150000,
      updated: "2024-01-22",
    },
  },
];

// Mock figure behind the data quality score: profiles with no open flag.
// With 6 pairs flagged (12 profiles) this gives the 98.2% in the design.
const TOTAL_PROFILES = 667;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const FIELDS: {
  key: FieldKey;
  label: string;
  value: (p: Profile) => string;
  mono?: boolean;
}[] = [
  { key: "org", label: "Organization name", value: (p) => p.org },
  { key: "contact", label: "Contact person", value: (p) => p.contact },
  { key: "email", label: "Email", value: (p) => p.email },
  { key: "mobile", label: "Mobile", value: (p) => p.mobile },
  { key: "address", label: "Delivery address", value: (p) => p.address },
  { key: "tin", label: "Tax ID (TIN)", value: (p) => p.tin, mono: true },
  {
    key: "transactions",
    label: "Transactions",
    value: (p) => `${p.txCount} · ${peso.format(p.txTotal)}`,
  },
  {
    key: "updated",
    label: "Last updated",
    value: (p) => formatDate(p.updated),
  },
];

interface AuditEntry {
  id: number;
  date: string;
  master: "A" | "B";
  masterOrg: string;
  mergedOrg: string;
  moved: number;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DuplicatesPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(2);

  const [pairs, setPairs] = useState<Pair[]>(INITIAL_PAIRS);
  const [index, setIndex] = useState(0);
  const [master, setMaster] = useState<"A" | "B">("A");
  const [mergedThisYear, setMergedThisYear] = useState(14);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [lastScan, setLastScan] = useState("2026-08-08");
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const pair = pairs[index];
  const score = ((1 - (2 * pairs.length) / TOTAL_PROFILES) * 100).toFixed(1);

  function go(to: number) {
    setIndex(to);
    setMaster("A");
  }

  // Take the current pair out of the review queue
  function removeCurrent() {
    const next = pairs.filter((p) => p.id !== pair.id);
    setPairs(next);
    setIndex(Math.min(index, Math.max(0, next.length - 1)));
    setMaster("A");
  }

  function mergePair() {
    const masterProfile = master === "A" ? pair.a : pair.b;
    const mergedProfile = master === "A" ? pair.b : pair.a;
    setAudit((prev) => [
      {
        id: Date.now(),
        date: toISO(new Date()),
        master,
        masterOrg: masterProfile.org,
        mergedOrg: mergedProfile.org,
        moved: mergedProfile.txCount,
      },
      ...prev,
    ]);
    setMergedThisYear((n) => n + 1);
    removeCurrent();
  }

  // "Keep separate" dismisses the pair so it is not flagged again
  function keepSeparate() {
    removeCurrent();
  }

  function runScan() {
    setScanning(true);
    setScanNote("");
    timer.current = setTimeout(() => {
      setLastScan(toISO(new Date()));
      setScanNote("Scan finished. No new pairs found.");
      setScanning(false);
    }, 1000);
  }

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="space-y-4">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-gray-100 text-gray-500">
              <GitMerge className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.5625rem] leading-3 text-text-secondary">Data quality</p>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h1 className="text-base leading-5 font-semibold text-text-primary">
                  Possible duplicates
                </h1>
                <p className="text-[0.5625rem] leading-3 text-text-secondary">
                  Last scan {formatDate(lastScan)} · Weekly
                  {scanNote && (
                    <span className="ml-1.5 text-text-muted">{scanNote}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={runScan}
            disabled={scanning}
            className="flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-button border border-button-stroke bg-white px-2 text-[0.625rem] font-medium text-text-primary hover:bg-surface-soft-hover disabled:cursor-default disabled:opacity-60"
          >
            <RefreshCw
              className={cn("h-3 w-3", scanning && "animate-spin")}
            />
            {scanning ? "Scanning..." : "Run scan now"}
          </button>
        </div>

        {/* Summary cards */}
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {[
            {
              label: "Pairs to review",
              value: String(pairs.length),
              note: "Flagged by the last scan",
            },
            {
              label: "Merged this year",
              value: String(mergedThisYear),
              note: "Profiles combined into one",
            },
            {
              label: "Data quality score",
              value: `${score}%`,
              note: "Donor profiles with no open flags",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="min-w-0 rounded-[10px] border border-border-soft bg-white px-5 py-4 shadow-soft"
            >
              <p className="text-xs text-text-secondary">{c.label}</p>
              <p className="mt-1 text-3xl font-semibold text-text-primary">
                {c.value}
              </p>
              <p className="mt-1 text-xs text-text-muted">{c.note}</p>
            </div>
          ))}
        </div>

        {/* Pair review */}
        <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
          {!pair ? (
            <div className="px-6 py-20 text-center">
              <p className="text-sm font-medium text-text-primary">
                No pairs to review
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                The next scan will flag new candidate pairs here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-sm font-semibold text-text-primary">
                    Pair {index + 1} of {pairs.length}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#e8ddcb] bg-amber-50/60 px-2 py-0.5 text-[11px] font-medium text-[#7a5e2c]">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {pair.score}% match
                  </span>
                  <span className="text-xs text-text-secondary">
                    {pair.summary}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => go(index - 1)}
                    disabled={index <= 0}
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-button border border-border-strong bg-white px-3 text-[13px] font-medium text-text-primary hover:bg-surface-soft-hover disabled:cursor-default disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => go(index + 1)}
                    disabled={index >= pairs.length - 1}
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-button border border-border-strong bg-white px-3 text-[13px] font-medium text-text-primary hover:bg-surface-soft-hover disabled:cursor-default disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-[13px]">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[39%]" />
                    <col className="w-[39%]" />
                  </colgroup>
                  <thead className="bg-surface-soft text-text-secondary">
                    <tr className="border-y border-border-soft">
                      <th className="px-5 py-2.5 text-xs font-medium">Field</th>
                      {(["A", "B"] as const).map((side) => {
                        const isMaster = master === side;
                        return (
                          <th
                            key={side}
                            className="px-3 py-2 text-xs font-medium"
                          >
                            <button
                              type="button"
                              onClick={() => setMaster(side)}
                              aria-pressed={isMaster}
                              className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-button px-2.5 py-1 text-left",
                                isMaster
                                  ? "bg-brand-100 font-semibold text-brand-primary"
                                  : "text-text-secondary hover:bg-surface-soft-hover",
                              )}
                            >
                              {isMaster
                                ? `Profile ${side} · keep as master`
                                : `Profile ${side}`}
                              {isMaster && <Check className="h-3.5 w-3.5" />}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {FIELDS.map((f) => {
                      const differs = pair.differs.includes(f.key);
                      const cell = (p: Profile, showTag: boolean) => (
                        <td
                          className={cn(
                            "px-5 py-3 text-text-primary",
                            differs && "bg-amber-50/70",
                            f.mono && "font-mono text-[12px]",
                          )}
                        >
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {f.value(p)}
                            {differs && showTag && (
                              <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#e8ddcb] bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-[#7a5e2c]">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Differs
                              </span>
                            )}
                          </span>
                        </td>
                      );
                      return (
                        <tr key={f.key} className="border-b border-border-soft">
                          <td className="px-5 py-3 text-xs text-text-secondary">
                            {f.label}
                          </td>
                          {cell(pair.a, true)}
                          {cell(pair.b, false)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-4 bg-surface-soft px-5 py-3">
                <p className="text-xs text-text-secondary">
                  Merging moves all {pair.a.txCount + pair.b.txCount}{" "}
                  transactions to Profile {master} and keeps a record of the
                  merge for audit.
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={keepSeparate}
                    className="h-9 cursor-pointer rounded-button border border-button-stroke bg-white px-3 text-[13px] font-medium text-text-primary hover:bg-surface-soft-hover"
                  >
                    Keep separate
                  </button>
                  <button
                    type="button"
                    onClick={mergePair}
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-button bg-brand-primary px-4 text-[13px] font-semibold text-white hover:opacity-90"
                  >
                    <GitMerge className="h-3.5 w-3.5" />
                    Merge into Profile {master}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Merge history, so merges can be audited */}
        {audit.length > 0 && (
          <div className="rounded-[10px] border border-border-soft bg-white px-5 py-4 shadow-soft">
            <h2 className="text-sm font-semibold text-text-primary">
              Merge history
            </h2>
            <ul className="mt-2 divide-y divide-border-soft text-xs text-text-secondary">
              {audit.map((a) => (
                <li key={a.id} className="py-2">
                  {formatDate(a.date)} · Merged{" "}
                  <span className="font-medium text-text-primary">
                    {a.mergedOrg}
                  </span>{" "}
                  into{" "}
                  <span className="font-medium text-text-primary">
                    {a.masterOrg}
                  </span>{" "}
                  (Profile {a.master}), moved {a.moved} transaction
                  {a.moved === 1 ? "" : "s"}.
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Open decision from the design */}
        <div className="flex items-center gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" />
          Matching rule (which fields count and the match threshold) is still to
          be decided by the team (decision D-7).
        </div>
      </div>
    </AppShell>
  );
}
