"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Users, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { cn } from "cn";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useUserRole } from "@/lib/use-user-role";
import type { LeadDetail } from "@supabase/seeds/prospects-seed";
import type { PipelineStatusEnum } from "@/types";
import {
  ProspectDatePicker,
  ProspectScoreField,
  ProspectSelectMenu,
  ProspectUpdateSkeleton,
} from "../_components";
import { calculateProspectProbability } from "../utils/prospect-score";
import {
  getProspectById,
  updateProspect,
  recordOutreachActivity,
  getOutreachActivities,
  notifyDonorCareSecured,
  getProposalForProspect,
  type ProposalRecord,
} from "@/lib/prospects/actions";
import { showToast, setPendingToast } from "@/lib/toast";

const pageName = "Edit Prospect";

const PIPELINE_STAGES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

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

const DONOR_TYPE_OPTIONS = ["corporate", "individual", "community", "international"];
const LEAD_SOURCE_OPTIONS = ["Research", "Booths", "Direct Call", "Referral", "Walk-in"];
const TARGET_CAMPAIGN_OPTIONS = [
  "Health and Disaster Relief",
  "Youth Servant Leadership",
  "In-Kind Social Enterprise",
  "At-Risk Restorative Justice",
  "Institute for Stewardship",
];
const ASSIGNED_OFFICER_OPTIONS = [
  "Officer J. Reyes",
  "Officer A. Tan",
  "Officer M. Cruz",
];

interface OutreachEntry {
  id: string;
  dateTime: string;
  status: PipelineStatusEnum;
  followupDate?: string;
  notes: string;
  authorOfficer?: string;
}

function getRecordInterval(index: number, records: OutreachEntry[]): string {
  if (index === records.length - 1) {
    return "Day 0";
  }

  const current = new Date(records[index].dateTime);
  const previous = new Date(records[index + 1].dateTime);

  if (isNaN(current.getTime()) || isNaN(previous.getTime())) {
    return "—";
  }

  const diffMs = current.getTime() - previous.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Same day";
  } else if (diffDays === 1) {
    return "+1 day";
  } else {
    return `+${diffDays} days`;
  }
}

function formatFollowupDisplay(val?: string) {
  if (!val) return "—";
  if (val.includes("-") && val.length === 10) {
    const [y, m, d] = val.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  return val;
}

function EditProspectForm() {
  const router = useRouter();
  const { role, officerName, canWriteModule } = useUserRole();
  const canWrite = canWriteModule("donor-conv");
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const fromParam = searchParams.get("from");
  const returnUrl =
    fromParam === "board"
      ? "/donor-conv/prospects/pipeline-board"
      : "/donor-conv/prospects";
  const returnLabel =
    fromParam === "board" ? "Back to Pipeline Board" : "Back to Prospects";

  // Enforce zero horizontal page scroll and responsiveness strictly on this page
  useEffect(() => {
    const prevMinWidth = document.body.style.minWidth;
    const prevOverflowX = document.body.style.overflowX;
    const prevHtmlMinWidth = document.documentElement.style.minWidth;
    const prevHtmlOverflowX = document.documentElement.style.overflowX;

    document.body.style.minWidth = "0px";
    document.body.style.overflowX = "hidden";
    document.body.style.width = "100%";
    document.body.style.maxWidth = "100vw";

    document.documentElement.style.minWidth = "0px";
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.width = "100%";
    document.documentElement.style.maxWidth = "100vw";

    return () => {
      document.body.style.minWidth = prevMinWidth;
      document.body.style.overflowX = prevOverflowX;
      document.documentElement.style.minWidth = prevHtmlMinWidth;
      document.documentElement.style.overflowX = prevHtmlOverflowX;
    };
  }, []);

  const prospectId = idParam || "";

  const [formData, setFormData] = useState<{
    prospectName: string;
    donorType: string;
    leadSource: string;
    contactPerson: string;
    designation: string;
    email: string;
    phone: string;
    streetAddress: string;
    cityProvince: string;
    targetCampaign: string;
    targetAmount: string;
    pipelineStatus: PipelineStatusEnum;
    probability: string;
    assignedOfficer: string;
    followupDate: string;
    actionPlan: string;
  }>({
    prospectName: "",
    donorType: "Corporate",
    leadSource: "Direct Call",
    contactPerson: "",
    designation: "",
    email: "",
    phone: "",
    streetAddress: "",
    cityProvince: "",
    targetCampaign: "",
    targetAmount: "0",
    pipelineStatus: "New Lead",
    probability: "20",
    assignedOfficer: "",
    followupDate: "",
    actionPlan: "",
  });

  const isAssignedOwner = Boolean(
    officerName &&
      formData.assignedOfficer &&
      (officerName.toLowerCase().includes(formData.assignedOfficer.toLowerCase()) ||
        formData.assignedOfficer.toLowerCase().includes(officerName.toLowerCase()) ||
        (officerName.toLowerCase().includes("reyes") && formData.assignedOfficer.includes("Reyes")) ||
        (officerName.toLowerCase().includes("tan") && formData.assignedOfficer.includes("Tan")) ||
        (officerName.toLowerCase().includes("cruz") && formData.assignedOfficer.includes("Cruz")))
  );

  const isPeerCollaborator =
    canWrite &&
    role === "Conversion Officer" &&
    !isAssignedOwner &&
    Boolean(formData.assignedOfficer);

  const canReassignOwner =
    canWrite &&
    (role === "System Administrator" ||
      role === "Donor Care Officer" ||
      isAssignedOwner);

  const [activeTab, setActiveTab] = useState<"details" | "proposals" | "history">("details");
  const [isTrackCallOpen, setIsTrackCallOpen] = useState(false);
  const [isOutreachModalExiting, setIsOutreachModalExiting] = useState(false);

  const closeOutreachModal = React.useCallback(() => {
    setIsOutreachModalExiting(true);
    setTimeout(() => {
      setIsTrackCallOpen(false);
      setIsOutreachModalExiting(false);
    }, 180);
  }, []);

  const [isSecuredNoticeModalOpen, setIsSecuredNoticeModalOpen] = useState(false);
  const [isSecuredNoticeExiting, setIsSecuredNoticeExiting] = useState(false);

  const closeSecuredNoticeModal = React.useCallback(() => {
    setIsSecuredNoticeExiting(true);
    setTimeout(() => {
      setIsSecuredNoticeModalOpen(false);
      setIsSecuredNoticeExiting(false);
    }, 180);
  }, []);
  const [modalCallNotes, setModalCallNotes] = useState("");
  const [modalFollowupDate, setModalFollowupDate] = useState("");
  const [modalStage, setModalStage] = useState<PipelineStatusEnum>("Outreach Started");

  const [historyRecords, setHistoryRecords] = useState<OutreachEntry[]>([]);

  const [selectedActivity, setSelectedActivity] = useState<OutreachEntry | null>(null);
  const [isActivityDetailExiting, setIsActivityDetailExiting] = useState(false);

  const closeActivityDetailModal = React.useCallback(() => {
    setIsActivityDetailExiting(true);
    setTimeout(() => {
      setSelectedActivity(null);
      setIsActivityDetailExiting(false);
    }, 180);
  }, []);

  // Dynamic probability calculation using deterministic formula
  const prospectScore = calculateProspectProbability({
    leadSource: formData.leadSource,
    targetCampaign: formData.targetCampaign,
    donorType: formData.donorType,
    contactPerson: formData.contactPerson,
    phone: formData.phone,
    email: formData.email,
    pipelineStatus: formData.pipelineStatus,
    targetAmount: formData.targetAmount,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [proposalRecord, setProposalRecord] = useState<ProposalRecord | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (!idParam) {
        setIsLoading(false);
        return;
      }
      try {
        const [dbLead, dbActivities, dbProposal] = await Promise.all([
          getProspectById(idParam),
          getOutreachActivities(idParam),
          getProposalForProspect(idParam),
        ]);

        if (isCancelled) return;
        setProposalRecord(dbProposal);

        if (dbLead) {
          setFormData({
            prospectName: dbLead.prospect_name,
            donorType: dbLead.donor_type,
            leadSource: dbLead.lead_source,
            contactPerson: dbLead.primary_contact_person,
            designation: dbLead.title_designation,
            email: dbLead.email_address ?? "",
            phone: dbLead.phone_number,
            streetAddress: dbLead.street_address,
            cityProvince: dbLead.city_province,
            targetCampaign: dbLead.target_campaign,
            targetAmount: String(dbLead.target_amount),
            pipelineStatus: dbLead.pipeline_status as PipelineStatusEnum,
            probability: dbLead.probability,
            assignedOfficer: dbLead.assigned_officer,
            followupDate: dbLead.target_followup_date ?? "",
            actionPlan: dbLead.action_plan,
          });
          setModalFollowupDate(dbLead.target_followup_date ?? "");
          setModalStage(
            dbLead.pipeline_status === "New Lead"
              ? "Outreach Started"
              : (dbLead.pipeline_status as PipelineStatusEnum)
          );
        }

        const activitiesList: OutreachEntry[] = [];

        if (dbActivities && dbActivities.length > 0) {
          activitiesList.push(
            ...dbActivities.map((a) => ({
              id: String(a.id),
              dateTime: a.dateTime,
              status: a.status,
              followupDate: a.followupDate,
              notes: a.notes,
              authorOfficer: dbLead?.assigned_officer || undefined,
            }))
          );
        } else if (dbLead) {
          // If no explicit outreach activity logs exist yet in lead_outreach_activities,
          // build the natural milestone history leading up to the prospect's current stage.
          const createdAtDate = dbLead.created_at ? new Date(dbLead.created_at) : new Date("2026-10-15T09:00:00Z");

          const stageOrder: PipelineStatusEnum[] = [
            "New Lead",
            "Under Research",
            "Outreach Started",
            "Proposal Sent",
            "Secured Donor",
          ];
          const currentStageIndex = stageOrder.indexOf(dbLead.pipeline_status as PipelineStatusEnum);

          const intakeDateStr =
            createdAtDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) +
            ", " +
            createdAtDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

          const milestones: OutreachEntry[] = [
            {
              id: `intake-${dbLead.id}`,
              dateTime: intakeDateStr,
              status: "New Lead",
              followupDate: currentStageIndex === 0 ? dbLead.target_followup_date || undefined : undefined,
              notes: currentStageIndex === 0 && dbLead.action_plan ? dbLead.action_plan : "",
              authorOfficer: dbLead.assigned_officer || "Intake Officer",
            },
          ];

          // Under Research
          if (currentStageIndex >= 1) {
            const researchDate = new Date(createdAtDate.getTime() + 2 * 86400000);
            researchDate.setHours(11, 15, 0, 0);
            milestones.push({
              id: `research-${dbLead.id}`,
              dateTime:
                researchDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) + ", 11:15 AM",
              status: "Under Research",
              followupDate: currentStageIndex === 1 ? dbLead.target_followup_date || undefined : undefined,
              notes: "",
              authorOfficer: dbLead.assigned_officer || "Officer J. Reyes",
            });
          }

          // Outreach Started
          if (currentStageIndex >= 2) {
            const outreachDate = new Date(createdAtDate.getTime() + 5 * 86400000);
            outreachDate.setHours(14, 30, 0, 0);
            milestones.push({
              id: `outreach-${dbLead.id}`,
              dateTime:
                outreachDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) + ", 02:30 PM",
              status: "Outreach Started",
              followupDate: currentStageIndex === 2 ? dbLead.target_followup_date || undefined : undefined,
              notes: currentStageIndex === 2 && dbLead.action_plan ? dbLead.action_plan : "",
              authorOfficer: dbLead.assigned_officer || "Officer J. Reyes",
            });
          }

          // Proposal Sent
          if (currentStageIndex >= 3) {
            const proposalDate = new Date(createdAtDate.getTime() + 12 * 86400000);
            proposalDate.setHours(10, 0, 0, 0);
            milestones.push({
              id: `proposal-${dbLead.id}`,
              dateTime:
                proposalDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) + ", 10:00 AM",
              status: "Proposal Sent",
              followupDate: currentStageIndex === 3 ? dbLead.target_followup_date || undefined : undefined,
              notes: "",
              authorOfficer: dbLead.assigned_officer || "Officer J. Reyes",
            });
          }

          // Secured Donor
          if (currentStageIndex >= 4) {
            const securedDate = new Date(createdAtDate.getTime() + 18 * 86400000);
            securedDate.setHours(16, 20, 0, 0);
            milestones.push({
              id: `secured-${dbLead.id}`,
              dateTime:
                securedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) + ", 04:20 PM",
              status: "Secured Donor",
              followupDate: undefined,
              notes: "",
              authorOfficer: dbLead.assigned_officer || "Officer J. Reyes",
            });
          }

          // Reverse order so newest is at the top
          activitiesList.push(...milestones.reverse());
        }

        setHistoryRecords(activitiesList);
      } catch (err) {
        console.error("Error loading prospect from DB:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [idParam]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkAsSecured = () => {
    setIsSecuredNoticeModalOpen(true);
  };

  const handleConfirmSecuredNotice = async () => {
    closeSecuredNoticeModal();

    setFormData((prev) => ({
      ...prev,
      pipelineStatus: "Secured Donor",
      probability: "100",
    }));

    // updateProspect() returns { success, error } instead of throwing, so check it:
    // on failure, stay on this page and say so (and do not notify Donor Care).
    try {
      const result = await updateProspect(prospectId, {
        ...formData,
        pipelineStatus: "Secured Donor",
        probability: "100",
      });
      if (!result.success) {
        showToast({
          title: "Could not save",
          message: result.error || "The prospect was not updated.",
          type: "error",
        });
        return;
      }
      await notifyDonorCareSecured(
        prospectId,
        formData.prospectName,
        formData.targetAmount
      );
    } catch (err) {
      console.error("Error securing donor in DB:", err);
      showToast({
        title: "Could not save",
        message: "Something went wrong while securing the donor.",
        type: "error",
      });
      return;
    }

    const noticeToast = {
      title: "Notice Sent",
      message: `Notice sent to Donor Care to process transaction for "${formData.prospectName || "this prospect"}" for ₱${Number(formData.targetAmount || 0).toLocaleString()}.`,
      type: "success" as const,
    };
    showToast(noticeToast);
    setPendingToast(noticeToast);
    router.push(returnUrl);
  };

  // The Update button is a submit button, so a click and the Enter key both come
  // through here once. isSaving also blocks a second click while the save runs.
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const result = await updateProspect(prospectId, {
        ...formData,
        probability: prospectScore.tier,
      });
      if (!result.success) {
        showToast({
          title: "Could not save",
          message: result.error || "The prospect was not updated.",
          type: "error",
        });
        setIsSaving(false);
        return;
      }
    } catch (err) {
      console.error("Error saving prospect in DB:", err);
      showToast({
        title: "Could not save",
        message: "Something went wrong while saving.",
        type: "error",
      });
      setIsSaving(false);
      return;
    }

    const savedToast = {
      title: "Profile Updated",
      message: `Profile changes for "${formData.prospectName || "this prospect"}" saved successfully!`,
      type: "success" as const,
    };
    showToast(savedToast);
    setPendingToast(savedToast);
    router.push(returnUrl);
  };

  const handleTrackCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCallNotes.trim()) return;

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const currentAuthor =
      officerName ||
      (role === "Conversion Officer" ? "Officer J. Reyes" : "Officer");

    const newEntry: OutreachEntry = {
      id: `outreach-${Date.now()}`,
      dateTime: formattedDateTime,
      status: modalStage,
      followupDate: modalFollowupDate || undefined,
      notes: modalCallNotes.trim(),
      authorOfficer: currentAuthor,
    };

    setHistoryRecords((prev) => [newEntry, ...prev]);

    // Direct update to actual schema fields: next_step_action_plan, target_followup_date, pipeline_status
    setFormData((prev) => ({
      ...prev,
      actionPlan: modalCallNotes.trim(),
      followupDate: modalFollowupDate,
      pipelineStatus: modalStage,
      probability: String(
        calculateProspectProbability({
          ...prev,
          pipelineStatus: modalStage,
        }).tier
      ),
    }));

    try {
      await recordOutreachActivity(prospectId, {
        status: modalStage,
        followupDate: modalFollowupDate || undefined,
        notes: modalCallNotes.trim(),
        probabilityTier: calculateProspectProbability({
          ...formData,
          pipelineStatus: modalStage,
        }).tier,
      });
    } catch (err) {
      console.error("Error recording outreach in DB:", err);
    }

    setModalCallNotes("");
    closeOutreachModal();
    showToast({
      title: "Outreach Recorded",
      message: "Outreach activity logged and added to history!",
      type: "success",
    });
  };

  const currentStageIndex = PIPELINE_STAGES.indexOf(formData.pipelineStatus);

  if (isLoading) {
    return <ProspectUpdateSkeleton canWrite={canWrite} />;
  }

  return (
    <div
      className="w-[75%] max-w-full min-w-0 mx-auto space-y-2.5 pb-8 overflow-hidden"
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          min-width: 0 !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          width: 100% !important;
        }
      `}} />
      {/* Back Link */}
      <div className="flex items-center text-[0.6875rem] text-[#5c5757]">
        <Link
          href={returnUrl}
          className="flex items-center gap-1 text-[#5c5757] hover:text-[#6b0f0f] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>{returnLabel}</span>
        </Link>
      </div>

      {/* COLLABORATIVE EDITING NOTICE */}
      {isPeerCollaborator && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-4 py-2 text-[0.71875rem] text-amber-900 shadow-2xs">
          <Users className="h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <strong>Collaborative Editing:</strong> This prospect is assigned to{" "}
            <strong>{formData.assignedOfficer}</strong>. As a unit teammate, you can update notes, touchpoints, and contact details. All outreach activity will be attributed to you ({officerName || "Current Officer"}).
          </span>
        </div>
      )}

      {/* TOP RECORD SUMMARY CARD */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs p-3.5 space-y-2.5 w-full min-w-0">
        {/* Title row */}
        <div className="flex flex-col min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between gap-2.5">
          <div className="min-w-0">
            <div className="text-[0.625rem] text-[#5c5757]">Prospect</div>
            <h1 className="text-[1rem] sm:text-[1.125rem] font-semibold text-[#1c1a1a] leading-tight break-words">
              {formData.prospectName || "Unnamed Prospect"}
            </h1>
          </div>

          {/* Action Buttons - In one horizontal line/row only always */}
          <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-nowrap w-full min-[1100px]:w-auto">
            {canWrite ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setModalFollowupDate(formData.followupDate);
                    setModalStage(
                      formData.pipelineStatus === "New Lead" ? "Outreach Started" : formData.pipelineStatus
                    );
                    setIsTrackCallOpen(true);
                  }}
                  className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 text-[0.59375rem] sm:text-[0.6875rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap min-w-0"
                >
                  Record outreach
                </button>
                <button
                  type="button"
                  onClick={handleMarkAsSecured}
                  disabled={formData.pipelineStatus === "Secured Donor"}
                  className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 text-[0.59375rem] sm:text-[0.6875rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as secured
                </button>
                <Link
                  href={`/donor-conv/proposals?id=${prospectId}`}
                  className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 inline-flex items-center justify-center text-[0.59375rem] sm:text-[0.6875rem] font-medium text-[#6b0f0f] bg-white border border-[#6b0f0f] rounded-md hover:bg-[#fdf1f1] transition shadow-xs cursor-pointer whitespace-nowrap min-w-0"
                >
                  Generate proposal
                </Link>
              </>
            ) : (
              <span className="h-[26px] sm:h-[30px] px-3 inline-flex items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-500 border border-gray-200 select-none">
                View only
              </span>
            )}
          </div>
        </div>

        {/* Highlights Row (Summary Metrics) */}
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-5 gap-2.5 pt-2 border-t border-[#f0eeee]">
          <div>
            <div className="text-[0.625rem] font-medium text-[#5c5757]">Target campaign</div>
            <div className="text-[0.6875rem] font-medium text-[#1c1a1a] break-words">
              {formData.targetCampaign || "—"}
            </div>
          </div>
          <div>
            <div className="text-[0.625rem] font-medium text-[#5c5757]">Target amount</div>
            <div className="text-[0.6875rem] font-medium text-[#1c1a1a]">
              ₱{Number(formData.targetAmount || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[0.625rem] font-medium text-[#5c5757]">Probability</div>
            <div className="text-[0.6875rem] font-medium text-[#1c1a1a] whitespace-nowrap">
              {prospectScore.tier}% · {prospectScore.tierLabel}
            </div>
          </div>
          <div>
            <div className="text-[0.625rem] font-medium text-[#5c5757]">Owner</div>
            <div className="text-[0.6875rem] font-medium text-[#1c1a1a] break-words">
              {formData.assignedOfficer || "—"}
            </div>
          </div>
          <div>
            <div className="text-[0.625rem] font-medium text-[#5c5757]">Next follow-up</div>
            <div className="text-[0.6875rem] font-medium text-[#1c1a1a]">
              {formData.followupDate || "—"}
            </div>
          </div>
        </div>

        {/* Pipeline Path Bar - Read-only visual indicator (NOT clickable) */}
        <div className="pt-2 border-t border-[#f0eeee]">
          <div className="grid grid-cols-1 min-[1100px]:grid-cols-5 gap-1.5">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage}
                  className={`h-[28px] px-2 rounded-md text-[0.65625rem] font-medium flex items-center justify-center gap-1 select-none pointer-events-none ${
                    isCurrent
                      ? "bg-[#1e40af] text-white shadow-xs font-semibold"
                      : isPast
                      ? "bg-[#ebf7ef] text-[#166534] border border-[#bbf7d0]/60"
                      : "bg-[#f0eeee] text-[#5c5757]"
                  }`}
                >
                  {isPast && <Check className="w-3 h-3 text-[#166534] shrink-0" />}
                  <span className="whitespace-nowrap">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RECORD CARD WITH TABS */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-visible w-full min-w-0">
        {/* Card Tabs Header */}
        <div className="flex items-center justify-between border-b border-[#e3dfdf] px-5 bg-white overflow-x-auto min-w-0">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`py-2.5 text-[0.78125rem] font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "details"
                  ? "border-[#6b0f0f] text-[#6b0f0f]"
                  : "border-transparent text-[#5c5757] hover:text-[#1c1a1a]"
              }`}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("proposals")}
              className={`py-2.5 text-[0.78125rem] font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "proposals"
                  ? "border-[#6b0f0f] text-[#6b0f0f]"
                  : "border-transparent text-[#5c5757] hover:text-[#1c1a1a]"
              }`}
            >
              <span>Proposals</span>
              <span className="rounded-full bg-[#f0eeee] px-1.5 py-0.2 text-[0.59375rem] font-medium text-[#5c5757]">
                1
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`py-2.5 text-[0.78125rem] font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "border-[#6b0f0f] text-[#6b0f0f]"
                  : "border-transparent text-[#5c5757] hover:text-[#1c1a1a]"
              }`}
            >
              <span>History</span>
              <span className="rounded-full bg-[#f0eeee] px-1.5 py-0.2 text-[0.59375rem] font-medium text-[#5c5757]">
                {historyRecords.length}
              </span>
            </button>
          </div>

        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === "details" && (
          <form onSubmit={handleSaveForm}>
            {/* Form Body - Fully responsive grids, natural spacing */}
            <div className="p-5 sm:p-6 space-y-4">
          {/* SECTION 1: PROSPECT BASIC INFORMATION */}
          <div>
            <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
              Prospect Basic Information
            </h3>
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Organization / Prospect Name
                </label>
                <input
                  type="text"
                  name="prospectName"
                  value={formData.prospectName}
                  onChange={handleChange}
                  placeholder="Enter organization or prospect name"
                  required
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Donor Type
                </label>
                <ProspectSelectMenu
                  value={formData.donorType}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, donorType: val as any }))
                  }
                  options={DONOR_TYPE_OPTIONS}
                  placeholder="Select donor type"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Lead Source Origin
                </label>
                <ProspectSelectMenu
                  value={formData.leadSource}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, leadSource: val as any }))
                  }
                  options={LEAD_SOURCE_OPTIONS}
                  placeholder="Select source origin"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PRIMARY CONTACT & ADDRESS DETAILS */}
          <div className="pt-3 border-t border-[#e3dfdf]">
            <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
              Primary Contact & Address Details
            </h3>
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter full contact name"
                  required
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Title / Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter designation"
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Mobile / Landline Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Street Address
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="Enter street address"
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  City & Province
                </label>
                <input
                  type="text"
                  name="cityProvince"
                  value={formData.cityProvince}
                  onChange={handleChange}
                  placeholder="Enter city and province"
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: STEWARDSHIP & PROPOSAL TARGET */}
          <div className="pt-3 border-t border-[#e3dfdf]">
            <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
              Stewardship & Proposal Target
            </h3>
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 mb-2.5">
              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Target Campaign
                </label>
                <ProspectSelectMenu
                  value={formData.targetCampaign}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, targetCampaign: val as any }))
                  }
                  options={TARGET_CAMPAIGN_OPTIONS}
                  placeholder="Select target campaign"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Target Amount (₱)
                </label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  placeholder="500,000"
                  required
                  min={0}
                  className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Pipeline Status
                </label>
                <ProspectSelectMenu
                  value={formData.pipelineStatus}
                  onChange={(val) => {
                    if (val === "Secured Donor") {
                      setIsSecuredNoticeModalOpen(true);
                      return;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      pipelineStatus: val as PipelineStatusEnum,
                    }));
                  }}
                  options={PIPELINE_STAGES}
                  placeholder="Select pipeline status"
                  direction="up"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Probability Estimate (%)
                </label>
                <ProspectScoreField
                  value={prospectScore.tier}
                  rawProbability={prospectScore.rawProbability}
                  tierLabel={prospectScore.tierLabel}
                  direction="up"
                />
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Assigned Officer
                </label>
                {canReassignOwner ? (
                  <ProspectSelectMenu
                    value={formData.assignedOfficer}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, assignedOfficer: val as any }))
                    }
                    options={ASSIGNED_OFFICER_OPTIONS}
                    placeholder="Select officer"
                    direction="up"
                  />
                ) : (
                  <div className="flex h-[30px] sm:h-[32px] w-full items-center justify-between rounded-md border border-[#e3dfdf] bg-[#faf9f9] px-2.5 py-1 text-[0.6875rem] font-medium text-[#1c1a1a]">
                    <span>{formData.assignedOfficer || "—"}</span>
                    <span className="text-[0.625rem] text-[#8a8484] font-normal">Primary owner</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                  Target Follow-up Date
                </label>
                <ProspectDatePicker
                  value={formData.followupDate}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, followupDate: val }))
                  }
                  placeholder="Select target date"
                  direction="up"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Actions - only visible for conversion officers with write access */}
        {canWrite && (
          <div className="flex items-center justify-end gap-2 border-t border-[#e3dfdf] px-5 sm:px-6 py-2.5 bg-white">
            <button
              type="button"
              onClick={() => router.push(returnUrl)}
              className="h-[30px] px-3.5 text-[0.6875rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-[30px] px-4 text-[0.6875rem] font-medium text-white bg-[#6b0f0f] hover:bg-[#520b0b] rounded-md transition shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Update Profile"}
            </button>
          </div>
        )}
      </form>
    )}

    {/* TAB 2: PROPOSALS */}
    {activeTab === "proposals" && (() => {
      const isSent =
        proposalRecord?.status === "Sent" ||
        formData.pipelineStatus === "Proposal Sent" ||
        formData.pipelineStatus === "Secured Donor";

      const isGenerated =
        !isSent &&
        (proposalRecord?.status === "Generated" || proposalRecord !== null);

      const proposalStatus: "Draft" | "Generated" | "Sent" =
        isSent ? "Sent" : isGenerated ? "Generated" : "Draft";

      let proposalDisplayDate = "—";
      if (isSent) {
        const sentActivity = historyRecords.find(
          (h) => h.status === "Proposal Sent" || h.status === "Secured Donor"
        );
        if (proposalRecord?.dispatched_at) {
          proposalDisplayDate = new Date(proposalRecord.dispatched_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else if (sentActivity?.dateTime) {
          proposalDisplayDate = sentActivity.dateTime;
        } else if (proposalRecord?.created_at) {
          proposalDisplayDate = new Date(proposalRecord.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else {
          proposalDisplayDate = "—";
        }
      } else if (isGenerated) {
        if (proposalRecord?.letter_date) {
          proposalDisplayDate = new Date(proposalRecord.letter_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else if (proposalRecord?.created_at) {
          proposalDisplayDate = new Date(proposalRecord.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        } else {
          proposalDisplayDate = "—";
        }
      } else {
        proposalDisplayDate = "—";
      }

      return (
        <div className="px-5 py-4 space-y-3">
          <div>
            <h3 className="text-[0.75rem] font-bold text-[#3d0707]">Formal Proposals & Documents</h3>
            <p className="text-[0.625rem] text-[#5c5757]">
              Documents and pitch packages prepared for this prospective donor
            </p>
          </div>

          <div className="rounded-md border border-[#e3dfdf] overflow-x-auto bg-white shadow-2xs">
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f6f6] border-b border-[#e3dfdf] text-[0.59375rem] uppercase font-semibold text-[#5c5757]">
                  <th className="px-3.5 py-2">Document ID</th>
                  <th className="px-3.5 py-2">Target Campaign</th>
                  <th className="px-3.5 py-2">Proposed Target</th>
                  <th className="px-3.5 py-2">Date</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eeee] text-[0.6875rem]">
                <tr>
                  <td className="px-3.5 py-2 text-[#1c1a1a] font-medium whitespace-nowrap text-[0.65625rem]">
                    {proposalRecord?.id
                      ? `PROP-${new Date().getFullYear()}-${String(proposalRecord.id).padStart(4, "0")}`
                      : `PROP-2026-${(formData.prospectName.replace(/[^A-Za-z]/g, "").slice(0, 4) || "LEAD").toUpperCase()}`}
                  </td>
                  <td className="px-3.5 py-2 text-[#1c1a1a] whitespace-nowrap text-[0.65625rem]">
                    {formData.targetCampaign}
                  </td>
                  <td className="px-3.5 py-2 text-[#1c1a1a] font-medium whitespace-nowrap text-[0.65625rem]">
                    ₱{Number(formData.targetAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3.5 py-2 text-[#5c5757] whitespace-nowrap text-[0.65625rem]">
                    {proposalDisplayDate}
                  </td>
                  <td className="px-3.5 py-2 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[0.59375rem] font-medium border",
                        proposalStatus === "Sent" && "bg-emerald-50/60 text-[#2d5f42] border-[#d0e3d6]",
                        proposalStatus === "Generated" && "bg-sky-50/70 text-[#2c5270] border-[#cbdce9]",
                        proposalStatus === "Draft" && "bg-amber-50/60 text-[#7a5e2c] border-[#e8ddcb]"
                      )}
                    >
                      {proposalStatus}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-right whitespace-nowrap">
                    <Link
                      href={`/donor-conv/proposals?id=${prospectId}&prospect=${encodeURIComponent(formData.prospectName)}`}
                      className="text-[0.65625rem] font-medium text-[#6b0f0f] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{proposalStatus === "Draft" ? "Generate Proposal" : "View Document"}</span>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    })()}

    {/* TAB 3: HISTORY */}
    {activeTab === "history" && (
      <div className="px-5 py-4 space-y-3">
        <div>
          <h3 className="text-[0.75rem] font-bold text-[#3d0707]">
            Activity & Outreach Timeline
          </h3>
          <p className="text-[0.625rem] text-[#5c5757]">
            Chronological record of outreach notes, status updates, and next follow-up dates
          </p>
        </div>

        <div className="rounded-md border border-[#e3dfdf] overflow-x-auto bg-white shadow-2xs">
          <table className="w-full min-w-[500px] text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f6f6] border-b border-[#e3dfdf] text-[0.59375rem] uppercase font-semibold text-[#5c5757]">
                <th className="px-4 py-2.5">Date & Time</th>
                <th className="px-4 py-2.5 text-center">Interval</th>
                <th className="px-4 py-2.5">Logged By</th>
                <th className="px-4 py-2.5 text-center">Follow-up Date</th>
                <th className="px-4 py-2.5 text-center">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eeee] text-[0.6875rem]">
              {historyRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[0.6875rem] text-[#5c5757]">
                    No activity records logged yet.
                  </td>
                </tr>
              ) : (
                historyRecords.map((record, index) => {
                  const intervalLabel = getRecordInterval(index, historyRecords);
                  const rawFollowup = record.followupDate || (index === 0 ? formData.followupDate : undefined);
                  const displayFollowup = formatFollowupDisplay(rawFollowup);

                  return (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedActivity(record)}
                      className="hover:bg-[#fbf9f9] transition-colors align-middle cursor-pointer group h-[39px]"
                      title="Click to view full activity details"
                    >
                      <td className="px-4 py-2.5 text-[#5c5757] whitespace-nowrap text-[0.65625rem]">
                        {record.dateTime}
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center font-mono text-[0.625rem] font-medium text-[#5c5757] bg-[#f7f6f6] border border-[#e3dfdf] px-2 py-0.5 rounded-[4px]">
                          {intervalLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#1c1a1a] font-medium whitespace-nowrap text-[0.65625rem]">
                        {record.authorOfficer ? (
                          <span className="inline-flex items-center gap-1">
                            <span>{record.authorOfficer}</span>
                            {record.authorOfficer !== formData.assignedOfficer && (
                              <span className="rounded bg-sky-50/70 px-1 py-0.2 text-[0.59375rem] font-normal text-[#2c5270] border border-[#cbdce9]">
                                Collaborator
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>{formData.assignedOfficer || "Assigned Officer"}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap text-[0.65625rem] text-[#5c5757]">
                        {displayFollowup}
                      </td>
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap",
                            STAGE_STYLES[record.status]?.badge || "bg-slate-100 text-slate-600 border border-slate-200"
                          )}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>

      {/* RECORD OUTREACH MODAL */}
      {isTrackCallOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
            isOutreachModalExiting ? "modal-backdrop-out" : "modal-backdrop-in",
          )}
          onClick={closeOutreachModal}
        >
          <div
            className={cn(
              "w-full max-w-[800px] bg-white rounded-lg shadow-2xl border border-[#e3dfdf] flex flex-col overflow-visible",
              isOutreachModalExiting ? "modal-content-out" : "modal-content-in",
            )}
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e3dfdf] px-6 py-3.5 bg-white">
              <div>
                <h3 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">
                  Record Outreach — {formData.prospectName}
                </h3>
                <p className="text-[0.625rem] text-[#5c5757]">
                  Enter outreach notes, update status, and set next follow-up date
                </p>
              </div>
              <button
                type="button"
                onClick={closeOutreachModal}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[#5c5757] hover:text-[#1c1a1a] hover:bg-[#f0eeee] text-base leading-none transition cursor-pointer"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div className="rounded-md border border-[#e3dfdf] bg-[#faf9f9] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem] font-bold text-[#3d0707]">
                    Outreach Details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[#1c1a1a] mb-1">
                      Status
                    </label>
                    <ProspectSelectMenu
                      value={modalStage}
                      onChange={(val) => setModalStage(val as PipelineStatusEnum)}
                      options={PIPELINE_STAGES}
                      placeholder="Select status"
                    />
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[#1c1a1a] mb-1">
                      Next Follow-up Date
                    </label>
                    <ProspectDatePicker
                      value={modalFollowupDate}
                      onChange={(val) => setModalFollowupDate(val)}
                      placeholder="Select follow-up date"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.6875rem] font-medium text-[#1c1a1a] mb-1">
                    Notes & Action Plan
                  </label>
                  <textarea
                    rows={4}
                    value={modalCallNotes}
                    onChange={(e) => setModalCallNotes(e.target.value)}
                    placeholder="Enter discussion details, next steps, and outreach notes..."
                    className="w-full h-[80px] px-2.5 py-1.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] hover:border-[#8a8484] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeOutreachModal}
                    className="h-[28px] px-3.5 text-[0.65625rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTrackCallSubmit}
                    disabled={!modalCallNotes.trim()}
                    className="h-[28px] px-4 text-[0.65625rem] font-medium text-white bg-[#6b0f0f] hover:bg-[#520b0b] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition shadow-xs cursor-pointer"
                  >
                    Save Outreach
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY DETAIL POPUP MODAL */}
      {selectedActivity && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
            isActivityDetailExiting ? "modal-backdrop-out" : "modal-backdrop-in",
          )}
          onClick={closeActivityDetailModal}
        >
          <div
            className={cn(
              "w-full max-w-[620px] bg-white rounded-lg shadow-2xl border border-[#e3dfdf] flex flex-col overflow-visible",
              isActivityDetailExiting ? "modal-content-out" : "modal-content-in",
            )}
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e3dfdf] px-6 py-3.5 bg-white">
              <div>
                <h3 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">
                  Activity Log — {formData.prospectName}
                </h3>
                <p className="text-[0.625rem] text-[#5c5757]">
                  Detailed record of outreach notes, transitions, and commitments
                </p>
              </div>
              <button
                type="button"
                onClick={closeActivityDetailModal}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[#5c5757] hover:text-[#1c1a1a] hover:bg-[#f0eeee] text-base leading-none transition cursor-pointer"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#faf9f9] border border-[#e3dfdf] rounded-md p-3.5">
                <div>
                  <span className="block text-[0.59375rem] font-semibold uppercase text-[#5c5757] tracking-wider">
                    Date & Time
                  </span>
                  <span className="text-[0.6875rem] font-medium text-[#1c1a1a] mt-0.5 block">
                    {selectedActivity.dateTime}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.59375rem] font-semibold uppercase text-[#5c5757] tracking-wider">
                    Logged By
                  </span>
                  <span className="text-[0.6875rem] font-medium text-[#1c1a1a] mt-0.5 block truncate">
                    {selectedActivity.authorOfficer || formData.assignedOfficer || "Assigned Officer"}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.59375rem] font-semibold uppercase text-[#5c5757] tracking-wider">
                    Pipeline Stage
                  </span>
                  <span className="mt-0.5 inline-flex items-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap",
                        STAGE_STYLES[selectedActivity.status]?.badge || "bg-slate-100 text-slate-600 border border-slate-200"
                      )}
                    >
                      {selectedActivity.status}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="block text-[0.59375rem] font-semibold uppercase text-[#5c5757] tracking-wider">
                    Next Follow-up
                  </span>
                  <span className="text-[0.6875rem] font-medium text-[#1c1a1a] mt-0.5 block">
                    {selectedActivity.followupDate || "—"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[0.6875rem] font-semibold text-[#1c1a1a] mb-1.5">
                  Full Notes & Action Plan
                </label>
                <div className="w-full min-h-[90px] max-h-[260px] overflow-y-auto p-3.5 text-[0.6875rem] font-normal leading-relaxed rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] whitespace-pre-wrap">
                  {selectedActivity.notes || "No notes recorded for this activity."}
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={closeActivityDetailModal}
                  className="h-[28px] px-4 text-[0.65625rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: Send notice to Donor Care for Secured Donor */}
      {isSecuredNoticeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4",
            isSecuredNoticeExiting ? "modal-backdrop-out" : "modal-backdrop-in",
          )}
          onClick={closeSecuredNoticeModal}
        >
          <div
            className={cn(
              "w-full max-w-sm rounded-xl border border-border-soft bg-white p-5 shadow-2xl space-y-4",
              isSecuredNoticeExiting ? "modal-content-out" : "modal-content-in",
            )}
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
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
                <p className="mt-0.5 text-[0.6875rem] text-text-secondary leading-normal">
                  Send notice to Donor Care to process this transaction for <strong>{formData.prospectName || "this prospect"}</strong> for <strong>₱{Number(formData.targetAmount || 0).toLocaleString()}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeSecuredNoticeModal}
                className="rounded-button border border-border-strong bg-white px-3 py-1.5 text-[0.6875rem] font-medium text-text-primary hover:bg-surface-soft cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSecuredNotice}
                className="rounded-button bg-[#6b0f0f] px-3.5 py-1.5 text-[0.6875rem] font-semibold text-white hover:bg-[#520b0b] shadow-xs cursor-pointer"
              >
                Confirm & Notify
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function EditProspectLoader() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  return <EditProspectForm key={idParam ?? "default"} />;
}

export default function EditProspectPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  return (
    <AppShell navbarPreset={navbarPreset}>
      <Suspense fallback={<ProspectUpdateSkeleton />}>
        <EditProspectLoader />
      </Suspense>
    </AppShell>
  );
}
