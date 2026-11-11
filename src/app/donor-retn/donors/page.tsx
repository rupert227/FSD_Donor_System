"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  HeartHandshake,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-retn/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { DropdownList } from "@/components/prefabs";
import type {
  DonorTenureEnum,
  DonorTypeEnum,
  EngagementStatusEnum,
  TargetCampaignEnum,
} from "@/types";

const pageName = "Donors";
const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Sample data (swap for the Supabase fetch later)                     */
/* Dates are fixed around Nov 2026 so Overdue / Due today / Due this   */
/* week all have rows. Move to lib/mock-data/donors.ts if preferred.   */
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
}

const SAMPLE_DONORS: DonorRow[] = [
  {
    id: 1,
    donor_name: "Phinma Foundation, Inc.",
    donor_type: "corporate",
    primary_contact_person: "Aurora Lim",
    mobile_number: "+63 2 8870 0100",
    target_campaign: "Health and Disaster Relief",
    engagement_status: "Renewal Started",
    donor_tenure: "3+ Years Loyal",
    last_contact_date: "2026-10-20",
    target_followup_date: "2026-11-03",
  },
  {
    id: 2,
    donor_name: "First Pacific Leadership Academy",
    donor_type: "corporate",
    primary_contact_person: "Ramon Villaflor",
    mobile_number: "+63 2 8696 5000",
    target_campaign: "Youth Servant Leadership",
    engagement_status: "Renewal Started",
    donor_tenure: "3+ Years Loyal",
    last_contact_date: "2026-10-28",
    target_followup_date: "2026-11-05",
  },
  {
    id: 3,
    donor_name: "Security Bank Foundation, Inc.",
    donor_type: "corporate",
    primary_contact_person: "Isabel Navarro",
    mobile_number: "+63 2 8887 8888",
    target_campaign: "In-Kind Social Enterprise",
    engagement_status: "Followed-up",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-10-28",
    target_followup_date: "2026-11-09",
  },
  {
    id: 4,
    donor_name: "St. Jude Catholic School Alumni",
    donor_type: "community",
    primary_contact_person: "Fr. Paolo Mercado",
    mobile_number: "+63 2 8735 6281",
    target_campaign: "In-Kind Social Enterprise",
    engagement_status: "Uncontacted",
    donor_tenure: "New Renewal",
    last_contact_date: null,
    target_followup_date: "2026-11-09",
  },
  {
    id: 5,
    donor_name: "Caritas Internationalis Solidarity Fund",
    donor_type: "international",
    primary_contact_person: "Giulia Ferrante",
    mobile_number: "+39 06 698 797 99",
    target_campaign: "Health and Disaster Relief",
    engagement_status: "Followed-up",
    donor_tenure: "3+ Years Loyal",
    last_contact_date: "2026-10-29",
    target_followup_date: "2026-11-10",
  },
  {
    id: 6,
    donor_name: "Pilmico Foods Community Fund",
    donor_type: "corporate",
    primary_contact_person: "Marites Uy",
    mobile_number: "+63 2 8886 2800",
    target_campaign: "Health and Disaster Relief",
    engagement_status: "Uncontacted",
    donor_tenure: "1 Year Retained",
    last_contact_date: null,
    target_followup_date: "2026-11-10",
  },
  {
    id: 7,
    donor_name: "Assumption Alumnae Association",
    donor_type: "community",
    primary_contact_person: "Teresa Gonzales",
    mobile_number: "+63 2 8817 0757",
    target_campaign: "At-Risk Restorative Justice",
    engagement_status: "Followed-up",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-10-30",
    target_followup_date: "2026-11-11",
  },
  {
    id: 8,
    donor_name: "Manila Electric Community Foundation",
    donor_type: "corporate",
    primary_contact_person: "Andres Castillo",
    mobile_number: "+63 2 8632 8888",
    target_campaign: "Institute for Stewardship",
    engagement_status: "Recommitted",
    donor_tenure: "3+ Years Loyal",
    last_contact_date: "2026-10-31",
    target_followup_date: "2026-11-12",
  },
  {
    id: 9,
    donor_name: "De La Salle Educational Trust",
    donor_type: "community",
    primary_contact_person: "Br. Miguel Torres",
    mobile_number: "+63 2 8524 4611",
    target_campaign: "Institute for Stewardship",
    engagement_status: "Uncontacted",
    donor_tenure: "1 Year Retained",
    last_contact_date: null,
    target_followup_date: "2026-11-12",
  },
  {
    id: 10,
    donor_name: "Rotary Club of Manila Foundation",
    donor_type: "community",
    primary_contact_person: "Ramon Soriano",
    mobile_number: "+63 2 8523 8888",
    target_campaign: "Youth Servant Leadership",
    engagement_status: "Recommitted",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-10-31",
    target_followup_date: "2026-11-13",
  },
  {
    id: 11,
    donor_name: "Ayala Foundation",
    donor_type: "corporate",
    primary_contact_person: "Maria Santos",
    mobile_number: "+63 2 8848 5000",
    target_campaign: "Youth Servant Leadership",
    engagement_status: "Followed-up",
    donor_tenure: "3+ Years Loyal",
    last_contact_date: "2026-11-02",
    target_followup_date: "2026-11-14",
  },
  {
    id: 12,
    donor_name: "Metrobank Foundation",
    donor_type: "corporate",
    primary_contact_person: "Patricia Alcantara",
    mobile_number: "+63 2 8898 8888",
    target_campaign: "Youth Servant Leadership",
    engagement_status: "Renewal Started",
    donor_tenure: "3+ Years Loyal",
    last_contact_date: "2026-11-03",
    target_followup_date: "2026-11-16",
  },
  {
    id: 13,
    donor_name: "Jollibee Group Foundation",
    donor_type: "corporate",
    primary_contact_person: "Gisela Tiongson",
    mobile_number: "+63 2 8634 1111",
    target_campaign: "In-Kind Social Enterprise",
    engagement_status: "Recommitted",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-11-04",
    target_followup_date: "2026-11-18",
  },
  {
    id: 14,
    donor_name: "SM Foundation, Inc.",
    donor_type: "corporate",
    primary_contact_person: "Hannah Lim",
    mobile_number: "+63 2 8857 0100",
    target_campaign: "Health and Disaster Relief",
    engagement_status: "Uncontacted",
    donor_tenure: "New Renewal",
    last_contact_date: null,
    target_followup_date: "2026-11-13",
  },
  {
    id: 15,
    donor_name: "BDO Foundation",
    donor_type: "corporate",
    primary_contact_person: "Carla Mendoza",
    mobile_number: "+63 2 8840 7000",
    target_campaign: "At-Risk Restorative Justice",
    engagement_status: "Followed-up",
    donor_tenure: "1 Year Retained",
    last_contact_date: "2026-11-05",
    target_followup_date: "2026-11-20",
  },
  {
    id: 16,
    donor_name: "Globe Telecom Community Fund",
    donor_type: "corporate",
    primary_contact_person: "Rico Villanueva",
    mobile_number: "+63 2 7730 1000",
    target_campaign: "Institute for Stewardship",
    engagement_status: "Renewal Started",
    donor_tenure: "1 Year Retained",
    last_contact_date: "2026-11-02",
    target_followup_date: "2026-11-23",
  },
  {
    id: 17,
    donor_name: "Tan Family Trust",
    donor_type: "individual",
    primary_contact_person: "Lorenzo Tan",
    mobile_number: "+63 917 555 0119",
    target_campaign: "Youth Servant Leadership",
    engagement_status: "Uncontacted",
    donor_tenure: "New Renewal",
    last_contact_date: null,
    target_followup_date: "2026-11-15",
  },
  {
    id: 18,
    donor_name: "Aboitiz Foundation",
    donor_type: "corporate",
    primary_contact_person: "Miguel Aboitiz",
    mobile_number: "+63 2 8886 2800",
    target_campaign: "Institute for Stewardship",
    engagement_status: "Lapsed Donor",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-05-14",
    target_followup_date: "2026-11-25",
  },
  {
    id: 19,
    donor_name: "Manila Water Foundation",
    donor_type: "corporate",
    primary_contact_person: "Bianca Ramos",
    mobile_number: "+63 2 8917 5900",
    target_campaign: "Health and Disaster Relief",
    engagement_status: "Lapsed Donor",
    donor_tenure: "1 Year Retained",
    last_contact_date: "2026-04-30",
    target_followup_date: null,
  },
  {
    id: 20,
    donor_name: "Rotary Club of Makati",
    donor_type: "community",
    primary_contact_person: "Eduardo Salvador",
    mobile_number: "+63 2 8812 3344",
    target_campaign: "At-Risk Restorative Justice",
    engagement_status: "Followed-up",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-11-06",
    target_followup_date: "2026-11-27",
  },
  {
    id: 21,
    donor_name: "Lopez Group Foundation",
    donor_type: "corporate",
    primary_contact_person: "Sofia Pascual",
    mobile_number: "+63 2 8631 8001",
    target_campaign: "In-Kind Social Enterprise",
    engagement_status: "Recommitted",
    donor_tenure: "3+ Years Loyal",
    last_contact_date: "2026-11-06",
    target_followup_date: "2026-12-01",
  },
  {
    id: 22,
    donor_name: "Dela Cruz Family",
    donor_type: "individual",
    primary_contact_person: "Rosario Dela Cruz",
    mobile_number: "+63 918 555 0123",
    target_campaign: "Health and Disaster Relief",
    engagement_status: "Uncontacted",
    donor_tenure: "New Renewal",
    last_contact_date: null,
    target_followup_date: "2026-11-06",
  },
  {
    id: 23,
    donor_name: "Cebu Pacific Community Fund",
    donor_type: "corporate",
    primary_contact_person: "Nathan Aquino",
    mobile_number: "+63 2 8702 0888",
    target_campaign: "Youth Servant Leadership",
    engagement_status: "Renewal Started",
    donor_tenure: "1 Year Retained",
    last_contact_date: "2026-11-04",
    target_followup_date: "2026-12-03",
  },
  {
    id: 24,
    donor_name: "Century Pacific Food Foundation",
    donor_type: "corporate",
    primary_contact_person: "Gabriel Domingo",
    mobile_number: "+63 2 8856 8100",
    target_campaign: "In-Kind Social Enterprise",
    engagement_status: "Followed-up",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-10-12",
    target_followup_date: "2026-11-04",
  },
  {
    id: 25,
    donor_name: "Yuchengco Group Foundation",
    donor_type: "corporate",
    primary_contact_person: "Victor Yu",
    mobile_number: "+63 2 8845 0100",
    target_campaign: "At-Risk Restorative Justice",
    engagement_status: "Lapsed Donor",
    donor_tenure: "1 Year Retained",
    last_contact_date: "2026-06-02",
    target_followup_date: "2026-12-10",
  },
  {
    id: 26,
    donor_name: "Alliance Global Foundation",
    donor_type: "corporate",
    primary_contact_person: "Angela Cruz",
    mobile_number: "+63 2 8709 2288",
    target_campaign: "Institute for Stewardship",
    engagement_status: "Recommitted",
    donor_tenure: "1 Year Retained",
    last_contact_date: "2026-11-07",
    target_followup_date: "2026-12-14",
  },
  {
    id: 27,
    donor_name: "Fr. Anton Parish Fund",
    donor_type: "community",
    primary_contact_person: "Fr. Anton Lopez",
    mobile_number: "+63 2 8843 8830",
    target_campaign: "At-Risk Restorative Justice",
    engagement_status: "Uncontacted",
    donor_tenure: "1 Year Retained",
    last_contact_date: null,
    target_followup_date: "2026-11-08",
  },
  {
    id: 28,
    donor_name: "Kapampangan Business Club",
    donor_type: "community",
    primary_contact_person: "Daniel Reyes",
    mobile_number: "+63 45 961 2200",
    target_campaign: "Youth Servant Leadership",
    engagement_status: "Followed-up",
    donor_tenure: "2 Years Retained",
    last_contact_date: "2026-11-01",
    target_followup_date: "2026-11-17",
  },
];

/* ------------------------------------------------------------------ */
/* Labels and styles                                                   */
/* ------------------------------------------------------------------ */

const ENGAGEMENT_STATUSES: EngagementStatusEnum[] = [
  "Uncontacted",
  "Followed-up",
  "Renewal Started",
  "Recommitted",
  "Lapsed Donor",
];

const CAMPAIGNS: TargetCampaignEnum[] = [
  "Youth Servant Leadership",
  "Health and Disaster Relief",
  "In-Kind Social Enterprise",
  "At-Risk Restorative Justice",
  "Institute for Stewardship",
];

const DONOR_TYPES: DonorTypeEnum[] = [
  "individual",
  "corporate",
  "community",
  "international",
];

// "Renewal Started" -> "Renewal started" (sentence case, as in the design)
function sentence(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const ENGAGEMENT_STYLES: Record<EngagementStatusEnum, { badge: string }> = {
  Uncontacted: {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  "Followed-up": {
    badge: "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  },
  "Renewal Started": {
    badge: "bg-amber-50/60 text-[#7a5e2c] border border-[#e8ddcb]",
  },
  Recommitted: {
    badge: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  },
  "Lapsed Donor": {
    badge: "bg-rose-50/60 text-[#814b4b] border border-[#e6d3d3]",
  },
};

const TENURE_STYLES: Record<DonorTenureEnum, { badge: string }> = {
  "3+ Years Loyal": {
    badge: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  },
  "2 Years Retained": {
    badge: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  },
  "1 Year Retained": {
    badge: "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  },
  "New Renewal": {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
};

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseISO(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso: string, n: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Sunday of the week that contains `iso` (weeks run Monday to Sunday)
function endOfWeek(iso: string) {
  return addDays(iso, (7 - parseISO(iso).getDay()) % 7);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return parseISO(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDate(value: string) {
  return parseISO(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
/* Filters                                                             */
/* ------------------------------------------------------------------ */

type FollowUp = "any" | "overdue" | "today" | "week" | "custom";
type LastContacted = "any" | "7d" | "30d" | "90d" | "never";

interface Filters {
  engagement: EngagementStatusEnum | "all";
  followUp: FollowUp;
  dateFrom: string; // only used when followUp is "custom"
  dateTo: string;
  campaign: TargetCampaignEnum | "all";
  donorType: DonorTypeEnum | "all";
  lastContacted: LastContacted;
}

const DEFAULT_FILTERS: Filters = {
  engagement: "all",
  followUp: "any",
  dateFrom: "",
  dateTo: "",
  campaign: "all",
  donorType: "all",
  lastContacted: "any",
};

const withDefaults = (partial: Partial<Filters>): Filters => ({
  ...DEFAULT_FILTERS,
  ...partial,
});

const sameFilters = (a: Filters, b: Filters) =>
  JSON.stringify(a) === JSON.stringify(b);

// Quick-view chips provide the donor list's preset filters.
const VIEWS: {
  id: string;
  chip: string;
  warn?: boolean; // amber count, as in the design
  filters: Partial<Filters>;
}[] = [
  { id: "all", chip: "All active", filters: {} },
  {
    id: "uncontacted",
    chip: "Uncontacted queue",
    warn: true,
    filters: { engagement: "Uncontacted" },
  },
  {
    id: "overdue",
    chip: "Overdue follow-ups",
    warn: true,
    filters: { followUp: "overdue" },
  },
];

const FOLLOW_UP_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "custom", label: "Custom range" },
];

const LAST_CONTACTED_OPTIONS = [
  { value: "any", label: "Anytime" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "never", label: "Never contacted" },
];

const LAST_CONTACTED_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function matchesFilters(d: DonorRow, f: Filters, today: string) {
  if (f.engagement !== "all" && d.engagement_status !== f.engagement)
    return false;
  if (f.campaign !== "all" && d.target_campaign !== f.campaign) return false;
  if (f.donorType !== "all" && d.donor_type !== f.donorType) return false;

  const due = d.target_followup_date;
  switch (f.followUp) {
    case "overdue":
      if (!today || !due || due >= today) return false;
      break;
    case "today":
      if (!today || due !== today) return false;
      break;
    case "week":
      if (!today || !due || due < today || due > endOfWeek(today)) return false;
      break;
    case "custom":
      if (f.dateFrom || f.dateTo) {
        // A donor with no follow-up date can't be inside a date range
        if (!due) return false;
        if (f.dateFrom && due < f.dateFrom) return false;
        if (f.dateTo && due > f.dateTo) return false;
      }
      break;
  }

  const last = d.last_contact_date;
  if (f.lastContacted === "never") {
    if (last) return false;
  } else if (f.lastContacted !== "any") {
    if (
      !today ||
      !last ||
      last < addDays(today, -LAST_CONTACTED_DAYS[f.lastContacted])
    ) {
      return false;
    }
  }
  return true;
}

function matchesSearch(d: DonorRow, q: string) {
  if (!q) return true;
  return (
    d.donor_name.toLowerCase().includes(q) ||
    d.primary_contact_person.toLowerCase().includes(q)
  );
}

// Soonest first. Donors with no follow-up date go to the bottom.
function byFollowUpDate(a: DonorRow, b: DonorRow) {
  if (!a.target_followup_date && !b.target_followup_date) return 0;
  if (!a.target_followup_date) return 1;
  if (!b.target_followup_date) return -1;
  return a.target_followup_date.localeCompare(b.target_followup_date);
}

// The pills under the toolbar, one per active filter
function activePills(f: Filters) {
  const pills: { key: string; label: string; clear: Partial<Filters> }[] = [];
  if (f.engagement !== "all") {
    pills.push({
      key: "engagement",
      label: `Engagement: ${f.engagement}`,
      clear: { engagement: "all" },
    });
  }
  if (f.followUp !== "any") {
    const text =
      f.followUp === "custom"
        ? [
            f.dateFrom ? shortDate(f.dateFrom) : "Any",
            f.dateTo ? shortDate(f.dateTo) : "Any",
          ].join(" – ")
        : FOLLOW_UP_OPTIONS.find((o) => o.value === f.followUp)!.label;
    pills.push({
      key: "followUp",
      label: `Follow-up: ${text}`,
      clear: { followUp: "any", dateFrom: "", dateTo: "" },
    });
  }
  if (f.campaign !== "all") {
    pills.push({
      key: "campaign",
      label: `Campaign: ${f.campaign}`,
      clear: { campaign: "all" },
    });
  }
  if (f.donorType !== "all") {
    pills.push({
      key: "donorType",
      label: `Type: ${sentence(f.donorType)}`,
      clear: { donorType: "all" },
    });
  }
  if (f.lastContacted !== "any") {
    pills.push({
      key: "lastContacted",
      label: `Last contacted: ${LAST_CONTACTED_OPTIONS.find((o) => o.value === f.lastContacted)!.label}`,
      clear: { lastContacted: "any" },
    });
  }
  return pills;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

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

function Badge({
  text,
  style,
}: {
  text: string;
  style: { badge: string };
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap",
        style.badge,
      )}
    >
      {text}
    </span>
  );
}

// Wraps the team's DropdownList so the rest of the page can keep using
// plain { value, label } options.
function FieldDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <DropdownList
      label={label}
      selectedKey={value}
      onChange={(option) => onChange(option.key)}
      options={options.map((o) => ({ key: o.value, label: o.label }))}
      width={15}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DonorsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  const router = useRouter();
  const today = useToday();

  const [search, setSearch] = useState("");
  const [contactPeriod, setContactPeriod] = useState<"today" | "week">("today");
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);

  // Sorted once. Replace SAMPLE_DONORS with the Supabase fetch later.
  const donors = useMemo(() => [...SAMPLE_DONORS].sort(byFollowUpDate), []);

  const q = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      donors.filter(
        (d) => matchesFilters(d, applied, today) && matchesSearch(d, q),
      ),
    [donors, applied, q, today],
  );

  const draftCount = useMemo(
    () =>
      donors.filter(
        (d) => matchesFilters(d, draft, today) && matchesSearch(d, q),
      ).length,
    [donors, draft, q, today],
  );

  const chipCounts = useMemo(
    () =>
      Object.fromEntries(
        VIEWS.map((view) => [
          view.id,
          donors.filter((donor) =>
            matchesFilters(donor, withDefaults(view.filters), today),
          ).length,
        ]),
      ),
    [donors, today],
  );

  const activeViewId = VIEWS.find((view) =>
    sameFilters(applied, withDefaults(view.filters)),
  )?.id;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const pills = activePills(applied);
  const draftRangeInvalid =
    draft.followUp === "custom" &&
    Boolean(draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo);
  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));

  // Close the filter popover on outside click or Escape.
  useEffect(() => {
    if (!filterOpen) return;
    function onDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  function openFilters() {
    setDraft(applied);
    setFilterOpen(true);
  }

  function applyView(filters: Partial<Filters>) {
    setApplied(withDefaults(filters));
    setPage(1);
  }

  function applyDraft() {
    setApplied(draft);
    setPage(1);
    setFilterOpen(false);
  }

  function updateDraft(partial: Partial<Filters>) {
    setDraft((prev) => ({ ...prev, ...partial }));
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

  // Exports the ticked rows if any, otherwise everything that matches the filters.
  function exportCsv() {
    const rows =
      selected.length > 0
        ? filtered.filter((r) => selected.includes(r.id))
        : filtered;
    const header = [
      "Donor",
      "Primary contact",
      "Contact number",
      "Campaign",
      "Donor type",
      "Last contacted",
      "Follow-up date",
      "Engagement",
      "Donor tenure",
    ];
    const lines = rows.map((r) =>
      [
        r.donor_name,
        r.primary_contact_person,
        r.mobile_number,
        r.target_campaign,
        r.donor_type,
        r.last_contact_date,
        r.target_followup_date,
        r.engagement_status,
        r.donor_tenure,
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

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="w-[90%] max-w-full min-w-0 mx-auto space-y-4 animate-in fade-in duration-300">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-gray-100 text-gray-500">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Donors</p>
              <h1 className="text-2xl leading-tight font-semibold text-text-primary">
                Active donors
              </h1>
            </div>
            <p className="ml-2 self-end pb-1 text-xs text-text-secondary">
              {filtered.length} items · Sorted by follow-up date
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="flex h-9 items-center gap-2 rounded-button border border-button-stroke bg-white px-3 text-[0.8125rem] font-medium text-text-primary hover:bg-surface-soft-hover"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <Link
              href="/donor-retn/donors/add-donor"
              className="flex h-9 items-center gap-2 rounded-button bg-brand-primary px-4 text-[0.8125rem] font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New donor
            </Link>
          </div>
        </div>

        {/* Quick views */}
        <div className="flex flex-wrap items-center gap-2">
            {VIEWS.map((view) => {
            const active = activeViewId === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => applyView(view.filters)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.8125rem] font-medium",
                  active
                    ? "border-text-primary bg-text-primary text-white"
                    : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                )}
              >
                {view.chip}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[0.6875rem] font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : view.warn
                        ? "bg-amber-100 text-amber-800"
                        : "bg-surface-soft text-text-secondary",
                  )}
                >
                  {chipCounts[view.id]}
                </span>
              </button>
            );
            })}
          {/* Contact progress */}
          <section aria-label="Contact progress" className="ml-auto flex w-full max-w-[460px] shrink-0 items-center gap-3 rounded-[10px] border border-border-soft bg-white px-3 py-1">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem]">
              <span className="whitespace-nowrap font-medium text-text-secondary">Your contacts {contactPeriod === "today" ? "today" : "this week"}</span>
              <span className="whitespace-nowrap font-semibold text-text-primary">{contactPeriod === "today" ? "84 / 126" : "402 / 630"}</span>
              <span className="whitespace-nowrap text-text-muted">{contactPeriod === "today" ? "42 to go" : "228 to go"}</span>
            </div>
            <div
              role="progressbar"
              aria-label={`${contactPeriod === "today" ? "Today's" : "This week's"} contact goal`}
              aria-valuemin={0}
              aria-valuemax={contactPeriod === "today" ? 126 : 630}
              aria-valuenow={contactPeriod === "today" ? 84 : 402}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-soft"
            >
              <div className="h-full w-2/3 rounded-full bg-[#245b8f]" />
            </div>
          </div>

          <div className="flex shrink-0 rounded-button border border-border-strong p-0.5 text-[0.8125rem]">
            <button type="button" onClick={() => setContactPeriod("today")} aria-pressed={contactPeriod === "today"} className={cn("rounded px-2.5 py-1 font-medium", contactPeriod === "today" ? "bg-text-primary text-white" : "text-text-secondary hover:bg-surface-soft")}>Today</button>
            <button type="button" onClick={() => setContactPeriod("week")} aria-pressed={contactPeriod === "week"} className={cn("rounded px-2.5 py-1 font-medium", contactPeriod === "week" ? "bg-text-primary text-white" : "text-text-secondary hover:bg-surface-soft")}>This week</button>
          </div>
          </section>
        </div>

        {/* Table card */}
        <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex w-64 items-center rounded-button border border-border-strong bg-white">
              <Search className="mx-2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search donor or contact"
                aria-label="Search donor or contact person"
                className="h-9 w-full bg-transparent text-[0.8125rem] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>

            <div ref={filterRef} className="relative">
              <button
                type="button"
                onClick={() => (filterOpen ? setFilterOpen(false) : openFilters())}
                aria-expanded={filterOpen}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-button border px-3 text-[0.8125rem] font-medium transition-colors",
                  pills.length > 0
                    ? "border-[#5c5757] bg-surface-soft text-text-primary"
                    : "border-border-strong bg-white text-text-primary hover:bg-surface-soft-hover",
                )}
              >
                Filters{pills.length > 0 ? ` (${pills.length})` : ""}
              </button>
              {filterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30 bg-black/10"
                    onClick={() => setFilterOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 top-full z-40 mt-1.5 w-[580px] max-w-[calc(100vw-32px)] rounded-xl border border-[#e3dfdf] bg-white p-5 shadow-2xl">
                    <div className="mb-4 flex items-center justify-between border-b border-[#e3dfdf] pb-3">
                      <h3 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">Filters</h3>
                      <button
                        type="button"
                        onClick={() => setFilterOpen(false)}
                        aria-label="Close filters"
                        className="rounded-full p-1 text-[#757070] transition-colors hover:bg-[#f7f6f6] hover:text-[#1c1a1a]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[0.6875rem] font-medium text-[#5c5757]">Engagement status</label>
                        <FieldDropdown label="All statuses" value={draft.engagement} onChange={(v) => updateDraft({ engagement: v as Filters["engagement"] })} options={[{ value: "all", label: "All statuses" }, ...ENGAGEMENT_STATUSES.map((s) => ({ value: s, label: s }))]} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[0.6875rem] font-medium text-[#5c5757]">Follow-up due</label>
                        <FieldDropdown label="Any time" value={draft.followUp} onChange={(v) => updateDraft({ followUp: v as FollowUp, ...(v !== "custom" ? { dateFrom: "", dateTo: "" } : {}) })} options={FOLLOW_UP_OPTIONS} />
                      </div>
                      {draft.followUp === "custom" && (
                        <div className="col-span-2">
                          <div className="grid grid-cols-2 gap-3">
                            <label className="text-xs text-text-secondary">From<input type="date" value={draft.dateFrom} max={draft.dateTo || undefined} onChange={(e) => updateDraft({ dateFrom: e.target.value })} className="mt-1 h-9 w-full rounded-button border border-border-strong px-2 text-xs text-text-primary focus:outline-none" /></label>
                            <label className="text-xs text-text-secondary">To<input type="date" value={draft.dateTo} min={draft.dateFrom || undefined} onChange={(e) => updateDraft({ dateTo: e.target.value })} className="mt-1 h-9 w-full rounded-button border border-border-strong px-2 text-xs text-text-primary focus:outline-none" /></label>
                          </div>
                          {draftRangeInvalid && <p className="mt-2 text-xs text-brand-danger">The start date must be on or before the end date.</p>}
                          <p className="mt-2 text-xs text-text-muted">Donors without a follow-up date are hidden while a date range is set.</p>
                        </div>
                      )}
                      <div>
                        <label className="mb-1.5 block text-[0.6875rem] font-medium text-[#5c5757]">Target campaign</label>
                        <FieldDropdown label="All campaigns" value={draft.campaign} onChange={(v) => updateDraft({ campaign: v as Filters["campaign"] })} options={[{ value: "all", label: "All campaigns" }, ...CAMPAIGNS.map((c) => ({ value: c, label: c }))]} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[0.6875rem] font-medium text-[#5c5757]">Donor type</label>
                        <FieldDropdown label="All types" value={draft.donorType} onChange={(v) => updateDraft({ donorType: v as Filters["donorType"] })} options={[{ value: "all", label: "All types" }, ...DONOR_TYPES.map((t) => ({ value: t, label: sentence(t) }))]} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[0.6875rem] font-medium text-[#5c5757]">Last contacted</label>
                        <FieldDropdown label="Anytime" value={draft.lastContacted} onChange={(v) => updateDraft({ lastContacted: v as LastContacted })} options={LAST_CONTACTED_OPTIONS} />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#e3dfdf] pt-3">
                      <button type="button" onClick={() => setDraft(DEFAULT_FILTERS)} disabled={sameFilters(draft, DEFAULT_FILTERS)} className="cursor-pointer text-xs font-medium text-text-secondary hover:text-text-primary hover:underline disabled:opacity-40">Reset all</button>
                      <button type="button" onClick={applyDraft} disabled={draftRangeInvalid} className="cursor-pointer rounded-md bg-[#221f1f] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#110f0f] disabled:opacity-40">Apply</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {pills.map((p) => (
              <span
                key={p.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 py-1 pr-1.5 pl-3 text-xs font-medium text-blue-800"
              >
                {p.label}
                <button
                  type="button"
                  onClick={() => {
                    setApplied((prev) => ({ ...prev, ...p.clear }));
                    setPage(1);
                  }}
                  aria-label={`Remove filter ${p.label}`}
                  className="rounded-full p-0.5 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

          </div>

          <div className="min-h-[440px] overflow-x-auto">
            <table className="w-full text-center text-[0.75rem]">
              <thead className="bg-surface-soft text-text-secondary">
                <tr className="border-y border-border-soft">
                  <th className="px-3 py-2.5 text-center text-[0.75rem] font-medium">Donor</th>
                  <th className="px-3 py-2.5 text-center text-[0.75rem] font-medium">Contact number</th>
                  <th className="px-3 py-2.5 text-center text-[0.75rem] font-medium">Campaign</th>
                  <th className="px-3 py-2.5 text-center text-[0.75rem] font-medium">
                    Last contacted
                  </th>
                  <th className="px-3 py-2.5 text-center text-[0.75rem] font-medium">Follow-up date</th>
                  <th className="px-3 py-2.5 text-center text-[0.75rem] font-medium">Engagement status</th>
                  <th className="px-3 py-2.5 text-center text-[0.75rem] font-medium">Tenure</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-24 text-center text-[0.75rem] text-text-secondary"
                    >
                      No donors match your search or filters.
                    </td>
                  </tr>
                )}
                {pageRows.map((r) => {
                  const href = `/donor-retn/donors/edit-donor?id=${r.id}`;
                  const due = r.target_followup_date;
                  const dueToday = !!today && due === today;
                  const overdue = !!today && !!due && due < today;
                  return (
                    <tr
                      key={r.id}
                      tabIndex={0}
                      role="link"
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") router.push(href);
                      }}
                      className="h-[39px] cursor-pointer border-b border-border-soft text-[0.75rem] text-text-primary hover:bg-surface-soft focus:bg-surface-soft focus:outline-none"
                    >
                      <td
                        className="max-w-64 truncate px-3 py-2.5 text-center font-semibold"
                        title={r.donor_name}
                      >
                        {r.donor_name}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-center">
                        {r.mobile_number}
                      </td>
                      <td className="px-3 py-2.5 text-center">{r.target_campaign}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-center">
                        {formatDate(r.last_contact_date)}
                      </td>
                      {/* Always rendered so the column never disappears */}
                      <td
                        className={cn(
                          "px-3 py-2.5 whitespace-nowrap text-center",
                          !due && "text-text-muted",
                          overdue && "font-medium text-[#a33838]",
                          dueToday && "font-medium text-amber-700",
                        )}
                      >
                        {dueToday ? "Due today" : formatDate(due)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          text={r.engagement_status}
                          style={ENGAGEMENT_STYLES[r.engagement_status]}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          text={r.donor_tenure}
                          style={TENURE_STYLES[r.donor_tenure]}
                        />
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length > 0 &&
                  Array.from({
                    length: Math.max(0, PAGE_SIZE - pageRows.length),
                  }).map((_, i) => (
                    <tr
                      key={`filler-${i}`}
                      aria-hidden="true"
                      className="pointer-events-none h-[39px] select-none border-b border-border-soft/40"
                    >
                      <td colSpan={7} className="px-3 py-2.5">
                        &nbsp;
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 text-xs text-text-secondary">
            <span>
              {filtered.length === 0
                ? "Showing 0 donors"
                : `Showing ${start + 1}–${start + pageRows.length} of ${filtered.length} donors`}
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
                      "h-8 min-w-8 rounded-button border px-2 text-[0.8125rem]",
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
