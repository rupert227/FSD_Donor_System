"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Kanban,
  List,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { cn } from "cn";

import { AppShell } from "@/components/AppShell";
import { moduleName, navbarPreset } from "@/app/donor-conv/struct";
import { ProspectSelectMenu, ProspectsBoardSkeleton } from "../_components";

import type { LeadDetail } from "@supabase/seeds/prospects-seed";
import type { PipelineStatusEnum } from "@/types";
import {
  getProspects,
  updateProspectStage,
  notifyDonorCareSecured,
  getBuiltProposalProspectIds,
} from "@/lib/prospects/actions";
import { showToast } from "@/lib/toast";

import { useDocumentTitle } from "@/components/Navbar";
import { useUserRole } from "@/lib/use-user-role";

const pageName = "Pipeline Board";

const STAGES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

const DEFAULT_OWNERS = [
  "Officer A. Tan",
  "Officer J. Reyes",
  "Officer M. Cruz",
];

const CAMPAIGN_OPTIONS = [
  { label: "All Campaigns", value: "all" },
  { label: "Health and Disaster Relief", value: "Health and Disaster Relief" },
  { label: "Youth Servant Leadership", value: "Youth Servant Leadership" },
  { label: "In-Kind Social Enterprise", value: "In-Kind Social Enterprise" },
  { label: "At-Risk Restorative Justice", value: "At-Risk Restorative Justice" },
  { label: "Institute for Stewardship", value: "Institute for Stewardship" },
];

const AMOUNT_OPTIONS = [
  { label: "All target amounts", value: "all" },
  { label: "₱0 – ₱50,000", value: "0-50k" },
  { label: "₱50,000 – ₱250,000", value: "50000-250000" },
  { label: "₱250,000 – ₱1,000,000", value: "250000-1000000" },
  { label: "Above ₱1,000,000", value: "over1m" },
];

const PROBABILITY_OPTIONS = [
  { label: "All probabilities", value: "all" },
  { label: "High (80% – 100%)", value: "high" },
  { label: "Medium (40% – 60%)", value: "medium" },
  { label: "Low (20%)", value: "low" },
  { label: "100%", value: "100" },
  { label: "80%", value: "80" },
  { label: "60%", value: "60" },
  { label: "40%", value: "40" },
  { label: "20%", value: "20" },
];

const DONOR_TYPE_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Corporate", value: "corporate" },
  { label: "Individual", value: "individual" },
  { label: "Community", value: "community" },
  { label: "International", value: "international" },
];

const LEAD_SOURCE_OPTIONS = [
  { label: "All lead sources", value: "all" },
  { label: "Direct Call", value: "Direct Call" },
  { label: "Referral", value: "Referral" },
  { label: "Research", value: "Research" },
  { label: "Booths", value: "Booths" },
  { label: "Walk-in", value: "Walk-in" },
];

export interface BoardFilters {
  campaign: string;
  amountRange: string;
  probability: string;
  donorType: string;
  leadSource: string;
  officer: string;
}

const DEFAULT_FILTERS: BoardFilters = {
  campaign: "all",
  amountRange: "all",
  probability: "all",
  donorType: "all",
  leadSource: "all",
  officer: "all",
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

// Low-saturation, soft muted badges matching prospects table exactly
const STAGE_STYLES: Record<PipelineStatusEnum, { badge: string; dropGlow: string }> = {
  "New Lead": {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
    dropGlow: "bg-slate-50/80 ring-2 ring-slate-300 border-slate-300",
  },
  "Under Research": {
    badge: "bg-stone-100 text-stone-600 border border-stone-200",
    dropGlow: "bg-stone-50/80 ring-2 ring-stone-300 border-stone-300",
  },
  "Outreach Started": {
    badge: "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
    dropGlow: "bg-sky-50/60 ring-2 ring-[#a4c6e2] border-[#a4c6e2]",
  },
  "Proposal Sent": {
    badge: "bg-amber-50/60 text-[#7a5e2c] border border-[#e8ddcb]",
    dropGlow: "bg-amber-50/50 ring-2 ring-[#d8c3a5] border-[#d8c3a5]",
  },
  "Secured Donor": {
    badge: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
    dropGlow: "bg-emerald-50/60 ring-2 ring-[#a6ceb3] border-[#a6ceb3]",
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

function shortDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function initials(officer: string) {
  const words = officer.replace(/^Officer\s+/, "").split(" ");
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

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

interface ColumnBound {
  stage: PipelineStatusEnum;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface ToastNotification {
  id: string;
  type: "success" | "error";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const CURRENT_OFFICER = "Officer J. Reyes";

export default function PipelineBoardPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  navbarPreset.selectedTabIndex = 0;
  const router = useRouter();
  const { role, officerName, canWriteModule } = useUserRole();
  const canWrite = canWriteModule("donor-conv");
  const isConversionOfficer = role === "Conversion Officer";
  const myOfficerFilterName = officerName || CURRENT_OFFICER;

  const today = useToday();

  const [leads, setLeads] = useState<LeadDetail[]>([]);
  const [search, setSearch] = useState("");

  // Quick view filter pills (matching prospects table exactly)
  const [quickOfficer, setQuickOfficer] = useState<string | null>(null);
  const [quickDate, setQuickDate] = useState<"today" | "overdue" | null>(null);
  const [quickStage, setQuickStage] = useState<PipelineStatusEnum | null>(null);

  const isAllView = !quickDate && !quickOfficer && !quickStage;
  const isDueTodayView = quickDate === "today";
  const isOverdueView = quickDate === "overdue";
  const isMineView = isConversionOfficer && quickOfficer === myOfficerFilterName;
  const isProposalSentView = quickStage === "Proposal Sent";

  // Track which prospects have official proposals generated in system
  const [proposalsBuilt, setProposalsBuilt] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    let isCancelled = false;
    async function loadBoardData() {
      try {
        const [dbLeads, dbProposals] = await Promise.all([
          getProspects(),
          getBuiltProposalProspectIds(),
        ]);
        if (!isCancelled) {
          setLeads(dbLeads ?? []);
          if (dbProposals && dbProposals.length > 0) setProposalsBuilt(new Set(dbProposals));
        }
      } catch (err) {
        console.error("Failed to load board data from DB:", err);
      } finally {
        if (!isCancelled) {
          setIsRefreshing(false);
        }
      }
    }
    loadBoardData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // FILTERS STATE: Matches Prospect Table Filters Exactly
  const [appliedFilters, setAppliedFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  const [isRefreshing, setIsRefreshing] = useState(true);

  const triggerToast = useCallback((notif: ToastNotification) => {
    showToast({
      title: notif.title,
      message: notif.message,
      type: notif.type,
      action: notif.action,
    });
  }, []);
  const [activeLead, setActiveLead] = useState<LeadDetail | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragWidth, setDragWidth] = useState<number>(220);
  const [swayTilt, setSwayTilt] = useState<number>(0);
  const [dragOverStage, setDragOverStage] = useState<PipelineStatusEnum | null>(null);

  const activeLeadRef = useRef<LeadDetail | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragOverStageRef = useRef<PipelineStatusEnum | null>(null);
  const startCoordRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMouseXRef = useRef<number>(0);
  const swayDecayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const columnRefs = useRef<Record<string, HTMLElement | null>>({});
  const colBoundsRef = useRef<ColumnBound[]>([]);

  // Confirmation modal for Secured Donor
  const [securingLead, setSecuringLead] = useState<LeadDetail | null>(null);
  const [isSecuringModalExiting, setIsSecuringModalExiting] = useState(false);

  const closeSecuringModal = useCallback(() => {
    setIsSecuringModalExiting(true);
    setTimeout(() => {
      setSecuringLead(null);
      setIsSecuringModalExiting(false);
    }, 180);
  }, []);

  // Filter popup animation state
  const [isFilterExiting, setIsFilterExiting] = useState(false);

  const closeFilterPopup = useCallback(() => {
    setIsFilterExiting(true);
    setTimeout(() => {
      setFilterOpen(false);
      setIsFilterExiting(false);
    }, 160);
  }, []);

  // Click outside to close filter popup
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        closeFilterPopup();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [closeFilterPopup]);

  // Full screen vs window resized layout handling
  const [fixedWidth, setFixedWidth] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(true);

  useEffect(() => {
    function updateLayoutMode() {
      const isMax = window.outerWidth >= window.screen.availWidth - 32;
      setIsFullScreen(isMax);
      const base90 = Math.round(window.screen.availWidth * 0.9);
      setFixedWidth(base90);
    }
    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => window.removeEventListener("resize", updateLayoutMode);
  }, []);

  const chipCounts = useMemo(() => {
    return {
      all: leads.length,
      "due-today": leads.filter((l) => !!today && l.target_followup_date === today).length,
      overdue: leads.filter((l) => !!today && !!l.target_followup_date && l.target_followup_date < today).length,
      mine: isConversionOfficer
        ? leads.filter((l) => {
            const target = myOfficerFilterName.toLowerCase();
            const leadOfficer = (l.assigned_officer || "").toLowerCase();
            return (
              leadOfficer === target ||
              leadOfficer.includes(target) ||
              target.includes(leadOfficer) ||
              (target.includes("reyes") && leadOfficer.includes("reyes")) ||
              (target.includes("tan") && leadOfficer.includes("tan")) ||
              (target.includes("cruz") && leadOfficer.includes("cruz"))
            );
          }).length
        : 0,
      "proposal-sent": leads.filter((l) => l.pipeline_status === "Proposal Sent").length,
    };
  }, [leads, today, isConversionOfficer, myOfficerFilterName]);

  const appliedFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.campaign !== "all") count++;
    if (appliedFilters.amountRange !== "all") count++;
    if (appliedFilters.probability !== "all" && Number(appliedFilters.probability) > 0) count++;
    if (appliedFilters.donorType !== "all") count++;
    if (appliedFilters.leadSource !== "all") count++;
    return count;
  }, [appliedFilters]);

  // Filter prospects using exact criteria as the table
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const f = appliedFilters;

    return [...leads].sort(byFollowUpDate).filter((l) => {
      if (
        q &&
        !l.prospect_name.toLowerCase().includes(q) &&
        !l.primary_contact_person.toLowerCase().includes(q)
      ) {
        return false;
      }

      // Quick officer shortcut
      if (quickOfficer) {
        const target = quickOfficer.toLowerCase();
        const leadOfficer = (l.assigned_officer || "").toLowerCase();
        const matches =
          leadOfficer === target ||
          leadOfficer.includes(target) ||
          target.includes(leadOfficer) ||
          (target.includes("reyes") && leadOfficer.includes("reyes")) ||
          (target.includes("tan") && leadOfficer.includes("tan")) ||
          (target.includes("cruz") && leadOfficer.includes("cruz"));
        if (!matches) return false;
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

      if (f.campaign !== "all" && l.target_campaign !== f.campaign) return false;
      if (f.donorType !== "all" && l.donor_type.toLowerCase() !== f.donorType.toLowerCase()) return false;
      if (f.leadSource !== "all" && (l.lead_source_origin || l.lead_source) !== f.leadSource) return false;
      if (f.officer !== "all" && l.assigned_officer !== f.officer) return false;

      // Target amount range filter (aligned with feasibility tiers)
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

      // Probability filter (slider threshold >= num%, tiers, and exact percentages)
      if (f.probability !== "all") {
        const num = Number(f.probability);
        const p = Number(l.probability) || 0;
        if (!isNaN(num) && num > 0) {
          if (p < num) return false;
        } else if (f.probability === "high" && p < 80) {
          return false;
        } else if (f.probability === "medium" && (p < 40 || p >= 80)) {
          return false;
        } else if (f.probability === "low" && p >= 40) {
          return false;
        }
      }

      return true;
    });
  }, [leads, search, appliedFilters, quickOfficer, quickDate, quickStage, today]);

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

  const availableOwners = useMemo(() => {
    const fromLeads = Array.from(
      new Set(leads.map((l) => l.assigned_officer).filter(Boolean)),
    ).sort();
    return fromLeads.length > 0 ? fromLeads : DEFAULT_OWNERS;
  }, [leads]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const [dbLeads, dbProposals] = await Promise.all([
        getProspects(),
        getBuiltProposalProspectIds(),
      ]);
      setLeads(dbLeads ?? []);
      if (dbProposals && dbProposals.length > 0) setProposalsBuilt(new Set(dbProposals));
      setAppliedFilters(DEFAULT_FILTERS);
      setDraftFilters(DEFAULT_FILTERS);
      setQuickOfficer(null);
      setQuickDate(null);
      setQuickStage(null);
      setSearch("");
      triggerToast({
        id: String(Date.now()),
        type: "success",
        title: "Board Refreshed",
        message: "Pipeline board updated with latest database records.",
      });
    } catch (err) {
      console.error("Failed to refresh board from DB:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleStageUpdate(leadId: number, nextStage: PipelineStatusEnum) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const currentProb = Number(l.probability) || 20;
        let nextProb: "20" | "40" | "60" | "80" | "100" = l.probability;

        if (nextStage === "Secured Donor") {
          nextProb = "100";
        } else if (nextStage === "Proposal Sent") {
          nextProb = currentProb < 80 ? "80" : (l.probability as "80" | "100");
        } else if (nextStage === "Outreach Started") {
          nextProb = currentProb < 60 ? "60" : l.probability;
        } else if (nextStage === "Under Research") {
          nextProb = currentProb < 40 ? "40" : l.probability;
        }

        return {
          ...l,
          pipeline_status: nextStage,
          probability: nextProb,
        };
      }),
    );

    // Persist to Supabase
    updateProspectStage(leadId, nextStage).catch((err) => {
      console.error("Failed to update prospect stage in DB:", err);
    });
  }

  // STRICT GATING TRANSITION LOGIC
  const executeDrop = useCallback((lead: LeadDetail, targetStage: PipelineStatusEnum) => {
    if (lead.pipeline_status === targetStage) return;

    // RULE 1: STRICT GATING ON PROPOSAL SENT
    // If no proposal has been built for this prospect in the system, block drop and fire bottom-right alert
    if (targetStage === "Proposal Sent") {
      const hasProposal = proposalsBuilt.has(lead.id);

      if (!hasProposal) {
        // Block transition and notify with action shortcut
        triggerToast({
          id: String(Date.now()),
          type: "error",
          title: "Proposal Required",
          message: `A proposal has not been generated yet for ${lead.prospect_name}.`,
          action: {
            label: "Generate Proposal",
            onClick: () => {
              router.push(`/donor-conv/proposals?prospectId=${lead.id}`);
            },
          },
        });
        return; // Card snaps back to origin column!
      }
    }

    // RULE 2: Confirmation modal for Secured Donor to prevent accidental closure
    if (targetStage === "Secured Donor") {
      setSecuringLead(lead);
      return;
    }

    // Standard valid transition
    handleStageUpdate(lead.id, targetStage);
    triggerToast({
      id: String(Date.now()),
      type: "success",
      title: "Stage Updated",
      message: `Moved "${lead.prospect_name}" to ${stageLabel(targetStage)}.`,
    });
  }, [handleStageUpdate, proposalsBuilt, router, triggerToast]);

  // WINDOW-LEVEL POINTER HANDLERS
  useEffect(() => {
    if (!activeLead) return;

    function handleWindowPointerMove(e: PointerEvent) {
      if (!canWrite) return;

      const moveDist = Math.hypot(
        e.clientX - startCoordRef.current.x,
        e.clientY - startCoordRef.current.y,
      );

      if (!isDraggingRef.current && moveDist > 4) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (isDraggingRef.current) {
        setPointerPos({ x: e.clientX, y: e.clientY });

        const dx = e.clientX - lastMouseXRef.current;
        if (Math.abs(dx) > 1) {
          const computedTilt = Math.max(-10, Math.min(10, -dx * 1.05));
          setSwayTilt(computedTilt);
          lastMouseXRef.current = e.clientX;

          if (swayDecayTimerRef.current) clearTimeout(swayDecayTimerRef.current);
          swayDecayTimerRef.current = setTimeout(() => {
            setSwayTilt(0);
          }, 110);
        }

        let found: PipelineStatusEnum | null = null;
        for (const b of colBoundsRef.current) {
          if (
            e.clientX >= b.left &&
            e.clientX <= b.right &&
            e.clientY >= b.top &&
            e.clientY <= b.bottom
          ) {
            found = b.stage;
            break;
          }
        }
        dragOverStageRef.current = found;
        setDragOverStage(found);
      }
    }

    function handleWindowPointerUp() {
      const currentLead = activeLeadRef.current;
      const targetStage = dragOverStageRef.current;

      if (isDraggingRef.current && currentLead) {
        if (targetStage && targetStage !== currentLead.pipeline_status) {
          executeDrop(currentLead, targetStage);
        }
      } else if (currentLead) {
        // Pure click: Navigate to edit prospect
        router.push(`/donor-conv/prospects/edit-prospect?id=${currentLead.id}&from=board`);
      }

      activeLeadRef.current = null;
      isDraggingRef.current = false;
      dragOverStageRef.current = null;
      setActiveLead(null);
      setIsDragging(false);
      setDragOverStage(null);
      setSwayTilt(0);
      if (swayDecayTimerRef.current) clearTimeout(swayDecayTimerRef.current);
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [activeLead, canWrite, executeDrop, router]);

  function handleCardPointerDown(e: React.PointerEvent<HTMLDivElement>, lead: LeadDetail) {
    if (e.button !== 0) return;
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    startCoordRef.current = { x: e.clientX, y: e.clientY };
    lastMouseXRef.current = e.clientX;

    const bounds: ColumnBound[] = [];
    for (const stage of STAGES) {
      const el = columnRefs.current[stage];
      if (el) {
        const r = el.getBoundingClientRect();
        bounds.push({
          stage,
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
        });
      }
    }
    colBoundsRef.current = bounds;

    activeLeadRef.current = lead;
    isDraggingRef.current = false;
    dragOverStageRef.current = null;

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragWidth(rect.width);
    setPointerPos({ x: e.clientX, y: e.clientY });
    setActiveLead(lead);
    setIsDragging(false);
    setSwayTilt(0);
  }

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
      {/* Scrollbar styles: Allotted 4px gutter, zero layout shift */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          background-color: var(--content-background) !important;
        }

        .kanban-scroll-stable {
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .kanban-scroll-stable::-webkit-scrollbar {
          width: 4px;
        }
        .kanban-scroll-stable::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-scroll-stable::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 9999px;
          transition: background-color 0.2s ease;
        }
        .kanban-scroll-stable:hover {
          scrollbar-color: rgba(0, 0, 0, 0.16) transparent;
        }
        .kanban-scroll-stable:hover::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.16);
        }
        .kanban-scroll-stable:hover::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.28);
        }

        .kanban-cards-container {
          max-height: min(425px, calc(100vh - 230px));
        }

        @media (min-height: 820px) {
          .kanban-cards-container {
            max-height: min(525px, calc(100vh - 230px));
          }
        }

        @keyframes toastFadeIn {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes toastFadeOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
        }

        .toast-animate-in {
          animation: toastFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }

        .toast-animate-out {
          animation: toastFadeOut 0.24s cubic-bezier(0.4, 0, 1, 1) forwards;
          pointer-events: none;
          will-change: transform, opacity;
        }
      `}} />

      {isRefreshing ? (
        <ProspectsBoardSkeleton isConversionOfficer={isConversionOfficer} />
      ) : (
        <div className="w-full max-w-full min-w-0 mx-auto space-y-4">
        {/* Title row matching prospects table exactly */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-text-secondary">Prospects</p>
              <h1 className="text-2xl leading-tight font-semibold text-text-primary">
                All open prospects
              </h1>
            </div>
            <p className="ml-2 self-end pb-1 text-xs text-text-secondary">
              {openCards.length} open · {peso.format(openTotal)} in pipeline
            </p>
          </div>

          {/* Right Toolbar: View toggle, Export, New Prospect, and Refresh Button */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-button border border-border-strong bg-white p-0.5 text-[0.8125rem]">
              <Link
                href="/donor-conv/prospects"
                className="flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-text-secondary hover:bg-surface-soft-hover transition-colors"
              >
                <List className="h-3.5 w-3.5" /> List
              </Link>
              <span className="flex items-center gap-1.5 rounded-[4px] bg-surface-soft px-3 py-1.5 font-medium text-text-primary">
                <Kanban className="h-3.5 w-3.5 text-brand-primary" /> Board
              </span>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              className="flex h-9 items-center gap-2 rounded-button border border-button-stroke bg-white px-3 text-[0.8125rem] font-medium text-text-primary hover:bg-surface-soft-hover cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>

            {canWrite ? (
              <Link
                href="/donor-conv/prospects/add-prospect?from=board"
                className="flex h-9 items-center gap-2 rounded-button bg-brand-primary px-4 text-[0.8125rem] font-semibold text-white hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                New prospect
              </Link>
            ) : (
              <span className="flex h-9 items-center gap-1.5 rounded-button bg-gray-100 px-3 text-[0.8125rem] font-medium text-gray-500 border border-gray-200 select-none">
                View only
              </span>
            )}
          </div>
        </div>

        {/* Quick views matching table screen exactly */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setQuickDate(null);
              setQuickOfficer(null);
              setQuickStage(null);
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

          {isConversionOfficer && (
            <button
              type="button"
              onClick={() => {
                setQuickOfficer((prev) =>
                  prev === myOfficerFilterName ? null : myOfficerFilterName,
                );
                setQuickDate(null);
                setQuickStage(null);
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
          )}

          <button
            type="button"
            onClick={() => {
              setQuickStage((prev) =>
                prev === "Proposal Sent" ? null : "Proposal Sent",
              );
              setQuickDate(null);
              setQuickOfficer(null);
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

        {/* Search + Table-Matched Filters */}
        <div className="flex items-center gap-3">
          <div className="flex w-64 items-center rounded-button border border-border-strong bg-white">
            <Search className="mx-2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this board"
              aria-label="Search prospect or contact person"
              className="h-9 w-full bg-transparent text-[0.8125rem] text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          {/* Filter Trigger matching table */}
          <div ref={filterContainerRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (filterOpen) {
                  closeFilterPopup();
                } else {
                  setDraftFilters(appliedFilters);
                  setFilterOpen(true);
                }
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

            {/* Table-Matched Rectangular Filter Popup Panel */}
            {filterOpen && (
              <>
                <div
                  className={cn(
                    "fixed inset-0 z-30 bg-black/10",
                    isFilterExiting ? "modal-backdrop-out" : "modal-backdrop-in",
                  )}
                  onClick={closeFilterPopup}
                  aria-hidden="true"
                />
                <div
                  className={cn(
                    "absolute left-0 top-full z-40 mt-1.5 w-[580px] max-w-[calc(100vw-32px)] rounded-xl border border-[#e3dfdf] bg-white p-5 shadow-2xl",
                    isFilterExiting ? "popup-out" : "popup-in",
                  )}
                >
                  <div className="mb-4 flex items-center justify-between border-b border-[#e3dfdf] pb-3">
                    <h3 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">Filters</h3>
                    <button
                      type="button"
                      onClick={closeFilterPopup}
                      aria-label="Close filters"
                      className="rounded-full p-1 text-[#757070] hover:bg-[#f7f6f6] hover:text-[#1c1a1a] transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    {/* Target Campaign */}
                    <div>
                      <label className="block text-[0.75rem] font-medium text-[#5c5757] mb-1.5">
                        Target Campaign
                      </label>
                      <ProspectSelectMenu
                        value={draftFilters.campaign}
                        onChange={(val) =>
                          setDraftFilters((prev) => ({ ...prev, campaign: val }))
                        }
                        options={CAMPAIGN_OPTIONS}
                      />
                    </div>

                    {/* Target Amount */}
                    <div>
                      <label className="block text-[0.75rem] font-medium text-[#5c5757] mb-1.5">
                        Target Amount
                      </label>
                      <ProspectSelectMenu
                        value={draftFilters.amountRange}
                        onChange={(val) =>
                          setDraftFilters((prev) => ({ ...prev, amountRange: val }))
                        }
                        options={AMOUNT_OPTIONS}
                      />
                    </div>

                    {/* Donor Type */}
                    <div>
                      <label className="block text-[0.75rem] font-medium text-[#5c5757] mb-1.5">
                        Donor Type
                      </label>
                      <ProspectSelectMenu
                        value={draftFilters.donorType}
                        onChange={(val) =>
                          setDraftFilters((prev) => ({ ...prev, donorType: val }))
                        }
                        options={DONOR_TYPE_OPTIONS}
                      />
                    </div>

                    {/* Lead Source */}
                    <div>
                      <label className="block text-[0.75rem] font-medium text-[#5c5757] mb-1.5">
                        Lead Source
                      </label>
                      <ProspectSelectMenu
                        value={draftFilters.leadSource}
                        onChange={(val) =>
                          setDraftFilters((prev) => ({ ...prev, leadSource: val }))
                        }
                        options={LEAD_SOURCE_OPTIONS}
                      />
                    </div>

                    {/* Probability Slider */}
                    <div className="col-span-2">
                      {(() => {
                        const probVal =
                          draftFilters.probability === "all" || !draftFilters.probability
                            ? 0
                            : Number(draftFilters.probability) || 0;
                        return (
                          <>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-[0.75rem] font-medium text-[#5c5757]">
                                Probability
                              </label>
                              <span
                                className={cn(
                                  "text-[0.6875rem] px-1.5 py-0.5 rounded transition-colors",
                                  probVal > 0
                                    ? "bg-[#f0eeee] text-[#3c3838] border border-[#d6d2d2] font-semibold"
                                    : "text-text-muted font-normal",
                                )}
                              >
                                {probVal === 0 ? "All (Any %)" : `≥ ${probVal}%`}
                              </span>
                            </div>

                            <div className="h-[30px] flex flex-col justify-center px-0.5">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={20}
                                value={probVal}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setDraftFilters((prev) => ({
                                    ...prev,
                                    probability: val === 0 ? "all" : String(val),
                                  }));
                                }}
                                aria-label="Filter by minimum probability"
                                className="w-full h-1.5 cursor-pointer appearance-none rounded-lg bg-[#e5e7eb] accent-[#757070] outline-none"
                                style={{
                                  background: `linear-gradient(to right, #757070 0%, #757070 ${probVal}%, #e5e7eb ${probVal}%, #e5e7eb 100%)`,
                                }}
                              />
                              <div className="flex justify-between px-0.5 mt-1 text-[0.625rem] font-medium text-[#8a8484] select-none">
                                <span>0%</span>
                                <span>20%</span>
                                <span>40%</span>
                                <span>60%</span>
                                <span>80%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#e3dfdf] pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftFilters(DEFAULT_FILTERS);
                        setAppliedFilters(DEFAULT_FILTERS);
                        closeFilterPopup();
                      }}
                      className="text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer hover:underline"
                    >
                      Reset all
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedFilters(draftFilters);
                        closeFilterPopup();
                      }}
                      className="rounded-md bg-[#6b0f0f] hover:bg-[#520b0b] px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Far-right Refresh icon button below New prospect, matching the table */}
          <div className="ml-auto relative group">
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh board"
              className="flex h-9 w-9 items-center justify-center rounded-button border border-border-strong bg-white text-text-secondary hover:bg-surface-soft hover:text-text-primary transition-colors cursor-pointer"
            >
              <RotateCcw className={cn("h-4 w-4", isRefreshing && "animate-spin text-brand-primary")} />
            </button>
            <div
              role="tooltip"
              className="pointer-events-none absolute right-0 top-full mt-1.5 hidden group-hover:block whitespace-nowrap rounded bg-[#1c1a1a] px-2 py-1 text-[0.75rem] font-medium text-white shadow-md z-30"
            >
              Refresh board
            </div>
          </div>
        </div>

        {/* 5 Equal Fluid Kanban Columns Grid */}
        <div className="grid grid-cols-5 items-start gap-2.5 w-full min-w-0">
          {columns.map(({ stage, cards, total }) => {
            const style = STAGE_STYLES[stage];
            const isDragOver = dragOverStage === stage && isDragging;

            return (
              <section
                key={stage}
                ref={(el) => {
                  columnRefs.current[stage] = el;
                }}
                aria-label={stageLabel(stage)}
                className={cn(
                  "flex flex-col rounded-[8px] p-2 transition-colors duration-150 w-full min-w-0",
                  isDragOver
                    ? style.dropGlow
                    : "bg-surface-soft/80 hover:bg-surface-soft",
                )}
              >
                {/* Column Header */}
                <header className="mb-2 flex items-center justify-between gap-1 px-0.5 min-w-0">
                  <div className="flex min-w-0 items-center gap-1">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-[3px] px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none whitespace-nowrap",
                        style.badge,
                      )}
                    >
                      {stageLabel(stage)}
                    </span>
                    <span className="rounded-full bg-black/5 px-1 py-0.2 text-[0.625rem] font-semibold text-text-secondary leading-none shrink-0">
                      {cards.length}
                    </span>
                  </div>
                </header>

                {/* Column Scrollable Body: 4 cards + 1/4 on laptop (~425px), 5 cards + 1/4 on big screens (~525px) */}
                <div className="space-y-2 kanban-cards-container overflow-y-auto pr-0.5 kanban-scroll-stable min-h-[380px]">
                  {cards.length === 0 && (
                    <div
                      className={cn(
                        "flex h-24 flex-col items-center justify-center rounded-[6px] border border-dashed p-2 text-center transition-colors",
                        isDragOver
                          ? "border-[#6b0f0f]/40 bg-white/70"
                          : "border-border-strong/50 text-text-muted",
                      )}
                    >
                      <p className="text-[0.6875rem] font-medium">
                        {isDragOver ? "Drop card here" : "No prospects"}
                      </p>
                    </div>
                  )}

                  {cards.map((l) => {
                    const dueToday =
                      !!today && l.target_followup_date === today;
                    const overdue =
                      !!today &&
                      !!l.target_followup_date &&
                      l.target_followup_date < today;
                    const isHeld = activeLead?.id === l.id && isDragging;

                    return (
                      <div
                        key={l.id}
                        onPointerDown={(e) => handleCardPointerDown(e, l)}
                        style={{ touchAction: "none" }}
                        className={cn(
                          "group relative block rounded-[6px] border bg-white p-2 shadow-xs transition-all select-none min-w-0",
                          canWrite ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                          isHeld
                            ? "border-dashed border-gray-300 bg-gray-50/70 opacity-30 shadow-none pointer-events-none"
                            : "border-border-soft hover:border-border-strong hover:shadow-xs",
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <p className="text-[0.75rem] leading-tight font-semibold text-text-primary hover:text-[#6b0f0f] transition-colors truncate min-w-0 pointer-events-none">
                            {l.prospect_name}
                          </p>
                          <span
                            className={cn(
                              "shrink-0 rounded-[3px] px-1 py-0.2 text-[0.625rem] font-medium pointer-events-none whitespace-nowrap",
                              (Number(l.probability) || 0) >= 70
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : (Number(l.probability) || 0) >= 40
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200",
                            )}
                          >
                            {l.probability}%
                          </span>
                        </div>

                        <p className="mt-0.5 text-[0.6875rem] text-text-secondary truncate min-w-0 pointer-events-none">
                          {l.primary_contact_person}
                        </p>

                        <div className="mt-1 flex items-center justify-between gap-1 min-w-0 pointer-events-none">
                          <span className="text-[0.75rem] font-semibold text-text-primary whitespace-nowrap shrink-0">
                            {peso.format(l.target_amount)}
                          </span>
                          <span className="text-[0.625rem] text-text-muted capitalize truncate min-w-0 text-right">
                            {l.donor_type}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-1 border-t border-gray-100 pt-1 pointer-events-none min-w-0">
                          <span
                            className={cn(
                              "flex items-center gap-1 text-[0.6875rem] truncate min-w-0",
                              !l.target_followup_date && "text-text-muted",
                              l.target_followup_date && "text-text-secondary",
                              overdue && "font-medium text-brand-danger",
                              dueToday && "font-medium text-amber-700",
                            )}
                          >
                            <Calendar className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">
                              {!l.target_followup_date
                                ? "No date"
                                : dueToday
                                  ? "Due today"
                                  : overdue
                                    ? `Overdue ${shortDate(l.target_followup_date)}`
                                    : shortDate(l.target_followup_date)}
                            </span>
                          </span>

                          <span
                            title={l.assigned_officer}
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[0.625rem] font-semibold text-brand-primary"
                          >
                            {initials(l.assigned_officer)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* FLOATING CARD AT POINTER POSITION */}
        {activeLead && isDragging && (
          <div
            className="fixed pointer-events-none z-50 select-none rounded-[6px] border border-border-strong bg-white p-2.5 shadow-2xl"
            style={{
              left: pointerPos.x - dragOffset.x,
              top: pointerPos.y - dragOffset.y,
              width: dragWidth,
              transformOrigin: "50% 0%",
              transform: `rotate(${swayTilt}deg) scale(1.03)`,
              transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)",
              boxShadow: "0 18px 32px -4px rgba(0, 0, 0, 0.22), 0 8px 16px -4px rgba(0, 0, 0, 0.12)",
              willChange: "transform, left, top",
            }}
          >
            <div className="flex items-start justify-between gap-1.5">
              <span className="text-[0.75rem] leading-tight font-semibold text-text-primary line-clamp-1">
                {activeLead.prospect_name}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-[3px] px-1 py-0.2 text-[0.625rem] font-medium",
                  (Number(activeLead.probability) || 0) >= 70
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : (Number(activeLead.probability) || 0) >= 40
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200",
                )}
              >
                {activeLead.probability}%
              </span>
            </div>

            <p className="mt-0.5 text-[0.6875rem] text-text-secondary truncate">
              {activeLead.primary_contact_person}
            </p>

            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[0.75rem] font-semibold text-text-primary">
                {peso.format(activeLead.target_amount)}
              </span>
              <span className="text-[0.625rem] text-text-muted capitalize">
                {activeLead.donor_type}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-gray-100 pt-1.5">
              <span className="flex items-center gap-1 text-[0.6875rem] text-text-secondary">
                <Calendar className="h-2.5 w-2.5 shrink-0" />
                {activeLead.target_followup_date
                  ? shortDate(activeLead.target_followup_date)
                  : "No date"}
              </span>

              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[0.625rem] font-semibold text-brand-primary">
                {initials(activeLead.assigned_officer)}
              </span>
            </div>
          </div>
        )}

        {/* CONFIRMATION MODAL: Only for closing into Secured Donor */}
        {securingLead && (
          <div
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4",
              isSecuringModalExiting ? "modal-backdrop-out" : "modal-backdrop-in",
            )}
            onClick={closeSecuringModal}
          >
            <div
              className={cn(
                "w-full max-w-sm rounded-xl border border-border-soft bg-white p-5 shadow-2xl space-y-4",
                isSecuringModalExiting ? "modal-content-out" : "modal-content-in",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fdf1f1] text-[#6b0f0f] border border-[#f5c2c2]/70">
                  <CheckCircle2 className="h-4 w-4 text-[#6b0f0f]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Mark as Secured Donor
                  </h3>
                  <p className="mt-0.5 text-[0.75rem] text-text-secondary leading-normal">
                    Send notice to Donor Care to process this transaction for <strong>{securingLead.prospect_name}</strong> for <strong>{peso.format(securingLead.target_amount)}</strong>?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeSecuringModal}
                  className="rounded-button border border-border-strong bg-white px-3 py-1.5 text-[0.75rem] font-medium text-text-primary hover:bg-surface-soft cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStageUpdate(securingLead.id, "Secured Donor");
                    notifyDonorCareSecured(
                      securingLead.id,
                      securingLead.prospect_name,
                      securingLead.target_amount
                    ).catch((err) => {
                      console.error("Failed to dispatch secured notice:", err);
                    });
                    triggerToast({
                      id: String(Date.now()),
                      type: "success",
                      title: "Notice Sent",
                      message: `Notice sent to Donor Care to process transaction for "${securingLead.prospect_name}" for ${peso.format(securingLead.target_amount)}.`,
                    });
                    closeSecuringModal();
                  }}
                  className="rounded-button bg-[#6b0f0f] px-3.5 py-1.5 text-[0.75rem] font-semibold text-white hover:bg-[#520b0b] shadow-xs cursor-pointer"
                >
                  Confirm & Notify
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </AppShell>
  );
}
