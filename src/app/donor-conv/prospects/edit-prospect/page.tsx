"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { moduleName, navbarPreset } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { SAMPLE_LEADS, type LeadDetail } from "@/lib/mock-data/leads";
import type { PipelineStatusEnum } from "@/types";
import { ProspectSelectMenu } from "@/components/prospects-form/ProspectSelectMenu";
import { ProspectDatePicker } from "@/components/prospects-form/ProspectDatePicker";
import { ProspectScoreField } from "@/components/prospects-form/ProspectScoreField";
import { calculateProspectProbability } from "@/lib/prospect-score";

const pageName = "Edit Prospect";

const PIPELINE_STAGES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

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
}

function EditProspectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

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

  const matchedLead: LeadDetail =
    SAMPLE_LEADS.find((lead) => String(lead.id) === idParam) ?? SAMPLE_LEADS[0];

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
    prospectName: matchedLead.prospect_name,
    donorType: matchedLead.donor_type,
    leadSource: matchedLead.lead_source,
    contactPerson: matchedLead.primary_contact_person,
    designation: matchedLead.title_designation,
    email: matchedLead.email_address ?? "",
    phone: matchedLead.phone_number,
    streetAddress: matchedLead.street_address,
    cityProvince: matchedLead.city_province,
    targetCampaign: matchedLead.target_campaign,
    targetAmount: String(matchedLead.target_amount),
    pipelineStatus: matchedLead.pipeline_status as PipelineStatusEnum,
    probability: matchedLead.probability,
    assignedOfficer: matchedLead.assigned_officer,
    followupDate: matchedLead.target_followup_date ?? "",
    actionPlan: matchedLead.action_plan,
  });

  const [activeTab, setActiveTab] = useState<"details" | "proposals" | "history">("details");
  const [isTrackCallOpen, setIsTrackCallOpen] = useState(false);
  const [modalCallNotes, setModalCallNotes] = useState("");
  const [modalFollowupDate, setModalFollowupDate] = useState(matchedLead.target_followup_date ?? "");
  const [modalStage, setModalStage] = useState<PipelineStatusEnum>(
    matchedLead.pipeline_status === "New Lead" ? "Outreach Started" : (matchedLead.pipeline_status as PipelineStatusEnum)
  );

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const [historyRecords, setHistoryRecords] = useState<OutreachEntry[]>(() => {
    const list: OutreachEntry[] = [];
    if (matchedLead.action_plan) {
      list.push({
        id: "initial-outreach",
        dateTime: "Oct 24, 2026, 2:30 PM",
        status: (matchedLead.pipeline_status as PipelineStatusEnum) || "Outreach Started",
        followupDate: matchedLead.target_followup_date || undefined,
        notes: matchedLead.action_plan,
      });
    }
    list.push({
      id: "intake-record",
      dateTime: "Oct 18, 2026, 9:15 AM",
      status: "New Lead",
      followupDate: undefined,
      notes: "Prospect profile created",
    });
    return list;
  });

  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

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

  useEffect(() => {
    if (matchedLead) {
      setFormData({
        prospectName: matchedLead.prospect_name,
        donorType: matchedLead.donor_type,
        leadSource: matchedLead.lead_source,
        contactPerson: matchedLead.primary_contact_person,
        designation: matchedLead.title_designation,
        email: matchedLead.email_address ?? "",
        phone: matchedLead.phone_number,
        streetAddress: matchedLead.street_address,
        cityProvince: matchedLead.city_province,
        targetCampaign: matchedLead.target_campaign,
        targetAmount: String(matchedLead.target_amount),
        pipelineStatus: matchedLead.pipeline_status as PipelineStatusEnum,
        probability: matchedLead.probability,
        assignedOfficer: matchedLead.assigned_officer,
        followupDate: matchedLead.target_followup_date ?? "",
        actionPlan: matchedLead.action_plan,
      });
      setModalFollowupDate(matchedLead.target_followup_date ?? "");
      setModalStage(
        matchedLead.pipeline_status === "New Lead" ? "Outreach Started" : (matchedLead.pipeline_status as PipelineStatusEnum)
      );
    }
  }, [idParam, matchedLead]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkAsSecured = () => {
    setFormData((prev) => ({
      ...prev,
      pipelineStatus: "Secured Donor",
      probability: "100",
    }));
    setSaveSuccessMessage("Prospect marked as Secured Donor!");
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMessage("Prospect profile changes saved successfully!");
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleTrackCallSubmit = (e: React.FormEvent) => {
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

    const newEntry: OutreachEntry = {
      id: `outreach-${Date.now()}`,
      dateTime: formattedDateTime,
      status: modalStage,
      followupDate: modalFollowupDate || undefined,
      notes: modalCallNotes.trim(),
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

    setModalCallNotes("");
    setIsTrackCallOpen(false);
    setSaveSuccessMessage("Outreach recorded and added to history!");
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  const currentStageIndex = PIPELINE_STAGES.indexOf(formData.pipelineStatus);

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
      <div className="flex items-center text-[11px] text-[#5c5757]">
        <Link
          href="/donor-conv/prospects"
          className="flex items-center gap-1 text-[#5c5757] hover:text-[#6b0f0f] transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Prospects</span>
        </Link>
      </div>

      {saveSuccessMessage && (
        <div className="bg-[#ebf7ef] border border-[#bbf7d0] text-[#166534] px-4 py-2 rounded-md text-[11.5px] flex items-center justify-between">
          <span>{saveSuccessMessage}</span>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-[#166534] hover:text-[#14532d] ml-2 font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* TOP RECORD SUMMARY CARD */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs p-3.5 space-y-2.5 w-full min-w-0">
        {/* Title row */}
        <div className="flex flex-col min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between gap-2.5">
          <div className="min-w-0">
            <div className="text-[10px] text-[#5c5757]">Prospect</div>
            <h1 className="text-[16px] sm:text-[18px] font-semibold text-[#1c1a1a] leading-tight break-words">
              {formData.prospectName || "Unnamed Prospect"}
            </h1>
          </div>

          {/* Action Buttons - In one horizontal line/row only always */}
          <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-nowrap w-full min-[1100px]:w-auto">
            <button
              type="button"
              onClick={() => {
                setModalFollowupDate(formData.followupDate);
                setModalStage(
                  formData.pipelineStatus === "New Lead" ? "Outreach Started" : formData.pipelineStatus
                );
                setIsTrackCallOpen(true);
              }}
              className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 text-[9.5px] sm:text-[11px] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap min-w-0"
            >
              Record outreach
            </button>
            <button
              type="button"
              onClick={handleMarkAsSecured}
              className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 text-[9.5px] sm:text-[11px] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap min-w-0"
            >
              Mark as secured
            </button>
            <Link
              href="/donor-conv/proposals/send-proposal"
              className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 inline-flex items-center justify-center text-[9.5px] sm:text-[11px] font-medium text-[#6b0f0f] bg-white border border-[#6b0f0f] rounded-md hover:bg-[#fdf1f1] transition shadow-xs cursor-pointer whitespace-nowrap min-w-0"
            >
              Generate proposal
            </Link>
          </div>
        </div>

        {/* Highlights Row (Summary Metrics) */}
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-5 gap-2.5 pt-2 border-t border-[#f0eeee]">
          <div>
            <div className="text-[10px] font-medium text-[#5c5757]">Target campaign</div>
            <div className="text-[11px] font-medium text-[#1c1a1a] break-words">
              {formData.targetCampaign || "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-[#5c5757]">Target amount</div>
            <div className="text-[11px] font-medium text-[#1c1a1a]">
              ₱{Number(formData.targetAmount || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-[#5c5757]">Probability</div>
            <div className="text-[11px] font-medium text-[#1c1a1a] whitespace-nowrap">
              {prospectScore.tier}% · {prospectScore.tierLabel}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-[#5c5757]">Owner</div>
            <div className="text-[11px] font-medium text-[#1c1a1a] break-words">
              {formData.assignedOfficer || "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-[#5c5757]">Next follow-up</div>
            <div className="text-[11px] font-medium text-[#1c1a1a]">
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
                  className={`h-[28px] px-2 rounded-md text-[10.5px] font-medium flex items-center justify-center gap-1 select-none pointer-events-none ${
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
              className={`py-2.5 text-[12.5px] font-semibold border-b-2 transition-colors cursor-pointer ${
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
              className={`py-2.5 text-[12.5px] font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "proposals"
                  ? "border-[#6b0f0f] text-[#6b0f0f]"
                  : "border-transparent text-[#5c5757] hover:text-[#1c1a1a]"
              }`}
            >
              <span>Proposals</span>
              <span className="rounded-full bg-[#f0eeee] px-1.5 py-0.2 text-[9.5px] font-medium text-[#5c5757]">
                1
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`py-2.5 text-[12.5px] font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "border-[#6b0f0f] text-[#6b0f0f]"
                  : "border-transparent text-[#5c5757] hover:text-[#1c1a1a]"
              }`}
            >
              <span>History</span>
              <span className="rounded-full bg-[#f0eeee] px-1.5 py-0.2 text-[9.5px] font-medium text-[#5c5757]">
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
            <h3 className="text-[11px] font-bold text-[#3d0707] mb-1.5">
              Prospect Basic Information
            </h3>
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Organization / Prospect Name
                </label>
                <input
                  type="text"
                  name="prospectName"
                  value={formData.prospectName}
                  onChange={handleChange}
                  placeholder="Enter organization or prospect name"
                  required
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
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
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
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
            <h3 className="text-[11px] font-bold text-[#3d0707] mb-1.5">
              Primary Contact & Address Details
            </h3>
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter full contact name"
                  required
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Title / Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter designation"
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Mobile / Landline Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Street Address
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="Enter street address"
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  City & Province
                </label>
                <input
                  type="text"
                  name="cityProvince"
                  value={formData.cityProvince}
                  onChange={handleChange}
                  placeholder="Enter city and province"
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: STEWARDSHIP & PROPOSAL TARGET */}
          <div className="pt-3 border-t border-[#e3dfdf]">
            <h3 className="text-[11px] font-bold text-[#3d0707] mb-1.5">
              Stewardship & Proposal Target
            </h3>
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 mb-2.5">
              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
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
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
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
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Pipeline Status
                </label>
                <ProspectSelectMenu
                  value={formData.pipelineStatus}
                  onChange={(val) => {
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
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
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
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Assigned Officer
                </label>
                <ProspectSelectMenu
                  value={formData.assignedOfficer}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, assignedOfficer: val as any }))
                  }
                  options={ASSIGNED_OFFICER_OPTIONS}
                  placeholder="Select officer"
                  direction="up"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
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

        {/* Card Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#e3dfdf] px-5 sm:px-6 py-2.5 bg-white">
          <button
            type="button"
            onClick={() => router.push("/donor-conv/prospects")}
            className="h-[30px] px-3.5 text-[11px] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-[30px] px-4 text-[11px] font-medium text-white bg-[#6b0f0f] hover:bg-[#520b0b] rounded-md transition shadow-xs cursor-pointer"
          >
            Update Profile
          </button>
        </div>
      </form>
    )}

    {/* TAB 2: PROPOSALS */}
    {activeTab === "proposals" && (
      <div className="px-5 py-4 space-y-3">
        <div>
          <h3 className="text-[12px] font-bold text-[#3d0707]">Formal Proposals & Documents</h3>
          <p className="text-[10px] text-[#5c5757]">
            Documents and pitch packages prepared for this prospective donor
          </p>
        </div>

        <div className="rounded-md border border-[#e3dfdf] overflow-x-auto bg-white shadow-2xs">
          <table className="w-full min-w-[500px] text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f6f6] border-b border-[#e3dfdf] text-[9.5px] uppercase font-semibold text-[#5c5757]">
                <th className="px-3.5 py-2">Document ID</th>
                <th className="px-3.5 py-2">Target Campaign</th>
                <th className="px-3.5 py-2">Proposed Target</th>
                <th className="px-3.5 py-2">Date</th>
                <th className="px-3.5 py-2">Status</th>
                <th className="px-3.5 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eeee] text-[11px]">
              <tr>
                <td className="px-3.5 py-2 text-[#1c1a1a] font-medium whitespace-nowrap text-[10.5px]">
                  PROP-2026-{(formData.prospectName.replace(/[^A-Za-z]/g, "").slice(0, 4) || "LEAD").toUpperCase()}
                </td>
                <td className="px-3.5 py-2 text-[#1c1a1a] whitespace-nowrap text-[10.5px]">
                  {formData.targetCampaign}
                </td>
                <td className="px-3.5 py-2 text-[#1c1a1a] font-medium whitespace-nowrap text-[10.5px]">
                  ₱{Number(formData.targetAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3.5 py-2 text-[#5c5757] whitespace-nowrap text-[10.5px]">
                  {formData.followupDate || "Current Period"}
                </td>
                <td className="px-3.5 py-2 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-medium border ${
                    formData.pipelineStatus === "Proposal Sent" || formData.pipelineStatus === "Secured Donor"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {formData.pipelineStatus === "Proposal Sent" ? "Sent" : formData.pipelineStatus === "Secured Donor" ? "Accepted" : "Draft"}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-right whitespace-nowrap">
                  <Link
                    href={`/donor-conv/proposals?prospect=${encodeURIComponent(formData.prospectName)}`}
                    className="text-[10.5px] font-medium text-[#6b0f0f] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Document</span>
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* TAB 3: HISTORY */}
    {activeTab === "history" && (
      <div className="px-5 py-4 space-y-3">
        <div>
          <h3 className="text-[12px] font-bold text-[#3d0707]">
            Activity & Outreach Timeline
          </h3>
          <p className="text-[10px] text-[#5c5757]">
            Chronological record of outreach notes, status updates, and next follow-up dates
          </p>
        </div>

        <div className="rounded-md border border-[#e3dfdf] overflow-x-auto bg-white shadow-2xs">
          <table className="w-full min-w-[500px] text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f6f6] border-b border-[#e3dfdf] text-[9.5px] uppercase font-semibold text-[#5c5757]">
                <th className="px-3.5 py-2 w-[160px]">Date & Time</th>
                <th className="px-3.5 py-2 w-[140px]">Status</th>
                <th className="px-3.5 py-2 w-[130px]">Next Follow-up</th>
                <th className="px-3.5 py-2">Notes & Action Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eeee] text-[11px]">
              {historyRecords.map((record) => {
                const isExpanded = expandedNoteId === record.id;
                const isLong = record.notes.length > 90;

                return (
                  <tr key={record.id} className="hover:bg-[#faf9f9] transition-colors align-top">
                    <td className="px-3.5 py-2.5 text-[#5c5757] whitespace-nowrap text-[10.5px]">
                      {record.dateTime}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-medium border ${
                        record.status === "Secured Donor"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : record.status === "Proposal Sent"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : record.status === "Outreach Started"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-[#5c5757] whitespace-nowrap text-[10.5px]">
                      {record.followupDate ? record.followupDate : "—"}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="text-[#1c1a1a] text-[11px] leading-relaxed">
                        {isExpanded || !isLong ? (
                          <div className="whitespace-pre-wrap">{record.notes}</div>
                        ) : (
                          <div className="line-clamp-2">{record.notes}</div>
                        )}
                      </div>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => setExpandedNoteId(isExpanded ? null : record.id)}
                          className="text-[10px] text-[#6b0f0f] hover:underline font-semibold mt-1 inline-flex items-center cursor-pointer"
                        >
                          {isExpanded ? "Show less" : "View full note"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
          onClick={() => setIsTrackCallOpen(false)}
        >
          <div
            className="w-full max-w-[800px] bg-white rounded-lg shadow-2xl border border-[#e3dfdf] flex flex-col overflow-visible"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e3dfdf] px-6 py-3.5 bg-white">
              <div>
                <h3 className="text-[13px] font-semibold text-[#1c1a1a]">
                  Record Outreach — {formData.prospectName}
                </h3>
                <p className="text-[10px] text-[#5c5757]">
                  Enter outreach notes, update status, and set next follow-up date
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackCallOpen(false)}
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
                  <span className="text-[11px] font-bold text-[#3d0707]">
                    Outreach Details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#1c1a1a] mb-1">
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
                    <label className="block text-[11px] font-medium text-[#1c1a1a] mb-1">
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
                  <label className="block text-[11px] font-medium text-[#1c1a1a] mb-1">
                    Notes & Action Plan
                  </label>
                  <textarea
                    rows={4}
                    value={modalCallNotes}
                    onChange={(e) => setModalCallNotes(e.target.value)}
                    placeholder="Enter discussion details, next steps, and outreach notes..."
                    className="w-full h-[80px] px-2.5 py-1.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] hover:border-[#8a8484] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsTrackCallOpen(false)}
                    className="h-[28px] px-3.5 text-[10.5px] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleTrackCallSubmit}
                    disabled={!modalCallNotes.trim()}
                    className="h-[28px] px-4 text-[10.5px] font-medium text-white bg-[#6b0f0f] hover:bg-[#520b0b] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition shadow-xs cursor-pointer"
                  >
                    Save Outreach
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditProspectPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  navbarPreset.selectedTabIndex = 0;

  return (
    <AppShell navbarPreset={navbarPreset}>
      <Suspense
        fallback={
          <div
            className="w-[75%] max-w-full min-w-0 mx-auto py-6 text-center text-xs text-[#5c5757]"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            Loading prospect profile...
          </div>
        }
      >
        <EditProspectForm />
      </Suspense>
    </AppShell>
  );
}
