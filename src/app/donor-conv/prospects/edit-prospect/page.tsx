"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  PhoneCall,
  Check,
  FileText,
  X,
  Calendar,
  User,
  History as HistoryIcon,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { navbarPreset } from "@/app/donor-conv/struct";
import { SAMPLE_LEADS, type LeadDetail } from "@/lib/mock-data/leads";
import type { PipelineStatusEnum } from "@/types";

const PIPELINE_STAGES: PipelineStatusEnum[] = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

function EditProspectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const matchedLead: LeadDetail =
    SAMPLE_LEADS.find((lead) => String(lead.id) === idParam) ?? SAMPLE_LEADS[0];

  const [formData, setFormData] = useState({
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

  const [isTrackCallOpen, setIsTrackCallOpen] = useState(false);
  const [modalCallNotes, setModalCallNotes] = useState("");
  const [modalFollowupDate, setModalFollowupDate] = useState(matchedLead.target_followup_date ?? "");
  const [modalStage, setModalStage] = useState<PipelineStatusEnum>(
    matchedLead.pipeline_status === "New Lead" ? "Outreach Started" : (matchedLead.pipeline_status as PipelineStatusEnum)
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

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

    // Direct update to actual schema fields: next_step_action_plan, target_followup_date, pipeline_status
    setFormData((prev) => ({
      ...prev,
      actionPlan: modalCallNotes.trim(),
      followupDate: modalFollowupDate,
      pipelineStatus: modalStage,
      probability:
        modalStage === "Secured Donor"
          ? "100"
          : modalStage === "Proposal Sent"
          ? "80"
          : modalStage === "Outreach Started"
          ? "60"
          : modalStage === "Under Research"
          ? "40"
          : "20",
    }));

    setModalCallNotes("");
    setIsTrackCallOpen(false);
    setSaveSuccessMessage("Call recorded and action plan updated!");
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  const currentStageIndex = PIPELINE_STAGES.indexOf(formData.pipelineStatus);

  return (
    <div
      className="w-full max-w-[954px] mx-auto space-y-1.5 pb-8"
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
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
            className="text-[#166534] hover:text-[#14532d] ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* TOP RECORD SUMMARY CARD (Figma V2 Highlights) */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs p-3.5 space-y-2.5">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <div className="text-[10px] text-[#5c5757]">Prospect</div>
            <h1 className="text-[16px] sm:text-[18px] font-semibold text-[#1c1a1a] leading-tight">
              {formData.prospectName || "Unnamed Prospect"}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setModalFollowupDate(formData.followupDate);
                setModalStage(
                  formData.pipelineStatus === "New Lead" ? "Outreach Started" : formData.pipelineStatus
                );
                setIsTrackCallOpen(true);
              }}
              className="h-[30px] px-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#5c5757]" />
              <span>Track a call</span>
            </button>
            <button
              type="button"
              onClick={handleMarkAsSecured}
              className="h-[30px] px-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-[#166534]" />
              <span>Mark as secured</span>
            </button>
            <Link
              href="/donor-conv/proposals/send-proposal"
              className="h-[30px] px-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6b0f0f] bg-white border border-[#6b0f0f] rounded-md hover:bg-[#fdf1f1] transition shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#6b0f0f]" />
              <span>Generate proposal</span>
            </Link>
          </div>
        </div>

        {/* Highlights Row (Summary Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-[#f0eeee]">
          <div>
            <div className="text-[10px] font-medium text-[#5c5757]">Target campaign</div>
            <div className="text-[11px] font-medium text-[#1c1a1a] truncate" title={formData.targetCampaign}>
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
            <div className="text-[11px] font-medium text-[#1c1a1a]">
              {formData.probability ? `${formData.probability}%` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-[#5c5757]">Owner</div>
            <div className="text-[11px] font-medium text-[#1c1a1a] truncate">
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
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
                  <span className="truncate">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN INLINE EDITABLE FORM (954px width) */}
      <form
        onSubmit={handleSaveForm}
        className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-hidden"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#e3dfdf] px-5 py-2 bg-white">
          <h2 className="text-[13px] font-semibold text-[#1c1a1a]">
            Prospect Details & Record Settings
          </h2>
          <span className="text-[10px] text-[#5c5757]">
            Fields marked with <span className="text-[#b42318]">*</span> are mandatory
          </span>
        </div>

        {/* Form Body - Exact V1 Measurements & Styling */}
        <div className="px-5 py-2.5 space-y-2">
          {/* SECTION 1: PROSPECT BASIC INFORMATION */}
          <div>
            <h3 className="text-[11px] font-bold text-[#3d0707] mb-1">
              Prospect Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1.5">
              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Organization / Prospect Name <span className="text-[#b42318]">*</span>
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
                  Donor Type <span className="text-[#b42318]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="donorType"
                    value={formData.donorType}
                    onChange={handleChange}
                    required
                    className="w-full h-[30px] px-2.5 pr-7 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select donor type</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Individual">Individual</option>
                    <option value="Community">Community</option>
                    <option value="International">International</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5c5757]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Lead Source Origin <span className="text-[#b42318]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="leadSource"
                    value={formData.leadSource}
                    onChange={handleChange}
                    required
                    className="w-full h-[30px] px-2.5 pr-7 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select source origin</option>
                    <option value="Research">Research</option>
                    <option value="Booths">Booths</option>
                    <option value="Direct Call">Direct Call</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5c5757]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRIMARY CONTACT & ADDRESS DETAILS */}
          <div className="pt-1.5 border-t border-[#e3dfdf]">
            <h3 className="text-[11px] font-bold text-[#3d0707] mb-1">
              Primary Contact & Address Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1.5">
              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Primary Contact Person <span className="text-[#b42318]">*</span>
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
                  Mobile / Landline Number <span className="text-[#b42318]">*</span>
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
          <div className="pt-1.5 border-t border-[#e3dfdf]">
            <h3 className="text-[11px] font-bold text-[#3d0707] mb-1">
              Stewardship & Proposal Target
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1.5 mb-1.5">
              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Target Campaign <span className="text-[#b42318]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="targetCampaign"
                    value={formData.targetCampaign}
                    onChange={handleChange}
                    required
                    className="w-full h-[30px] px-2.5 pr-7 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select target campaign</option>
                    <option value="Health and Disaster Relief">Health and Disaster Relief</option>
                    <option value="Youth Servant Leadership">Youth Servant Leadership</option>
                    <option value="In-Kind Social Enterprise">In-Kind Social Enterprise</option>
                    <option value="At-Risk Restorative Justice">At-Risk Restorative Justice</option>
                    <option value="Institute for Stewardship">Institute for Stewardship</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5c5757]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Target Amount (₱) <span className="text-[#b42318]">*</span>
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
                  Pipeline Status <span className="text-[#b42318]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="pipelineStatus"
                    value={formData.pipelineStatus}
                    onChange={handleChange}
                    required
                    className="w-full h-[30px] px-2.5 pr-7 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition appearance-none cursor-pointer"
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Under Research">Under Research</option>
                    <option value="Outreach Started">Outreach Started</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Secured Donor">Secured Donor</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5c5757]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Probability Estimate (%)
                </label>
                <div className="relative">
                  <select
                    name="probability"
                    value={formData.probability}
                    onChange={handleChange}
                    className="w-full h-[30px] px-2.5 pr-7 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select probability</option>
                    <option value="20">20% - Low Likelihood</option>
                    <option value="40">40% - Fair Likelihood</option>
                    <option value="60">60% - Good Likelihood</option>
                    <option value="80">80% - High Likelihood</option>
                    <option value="100">100% - Secured Donor</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5c5757]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Assigned Officer <span className="text-[#b42318]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="assignedOfficer"
                    value={formData.assignedOfficer}
                    onChange={handleChange}
                    required
                    className="w-full h-[30px] px-2.5 pr-7 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select officer</option>
                    <option value="Officer J. Reyes">Officer J. Reyes</option>
                    <option value="Officer A. Tan">Officer A. Tan</option>
                    <option value="Officer M. Cruz">Officer M. Cruz</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5c5757]">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Target Follow-up Date
                </label>
                <input
                  type="date"
                  name="followupDate"
                  value={formData.followupDate}
                  onChange={handleChange}
                  className="w-full h-[30px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#e3dfdf] px-5 py-2 bg-white">
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

      {/* TRACK A CALL MODAL (Spacious, binds to real schema fields) */}
      {isTrackCallOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
          onClick={() => setIsTrackCallOpen(false)}
        >
          <div
            className="w-full max-w-[800px] max-h-[88vh] bg-white rounded-lg shadow-2xl border border-[#e3dfdf] flex flex-col overflow-hidden"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e3dfdf] px-6 py-3.5 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#fdf1f1] flex items-center justify-center text-[#6b0f0f]">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-[#1c1a1a]">
                    Track a Call — {formData.prospectName}
                  </h3>
                  <p className="text-[10px] text-[#5c5757]">
                    Update next step action plan and follow-up timeline based on outreach call
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrackCallOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[#5c5757] hover:text-[#1c1a1a] hover:bg-[#f0eeee] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto px-6 py-4 space-y-4">
              {/* TOP: COMPOSER ENTRY FIELDS (Directly updates schema fields) */}
              <div className="rounded-md border border-[#e3dfdf] bg-[#faf9f9] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#3d0707] flex items-center gap-1.5">
                    Record Outreach Call
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-normal text-[#5c5757] mb-1">
                      Advance Pipeline Status <span className="text-[#b42318]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={modalStage}
                        onChange={(e) => setModalStage(e.target.value as PipelineStatusEnum)}
                        className="w-full h-[32px] px-2.5 pr-7 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition appearance-none cursor-pointer"
                      >
                        {PIPELINE_STAGES.map((stg) => (
                          <option key={stg} value={stg}>
                            {stg}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5c5757]">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-normal text-[#5c5757] mb-1">
                      New Target Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={modalFollowupDate}
                      onChange={(e) => setModalFollowupDate(e.target.value)}
                      className="w-full h-[32px] px-2.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10.5px] font-normal text-[#5c5757] mb-1">
                    Call Discussion & Next Step Action Plan <span className="text-[#b42318]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={modalCallNotes}
                    onChange={(e) => setModalCallNotes(e.target.value)}
                    placeholder="Enter what was discussed during the call and agreed next action steps..."
                    className="w-full h-[64px] px-2.5 py-1.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition resize-none"
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
                    className="h-[28px] px-4 text-[10.5px] font-medium text-white bg-[#6b0f0f] hover:bg-[#520b0b] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3" />
                    <span>Save & Update Action Plan</span>
                  </button>
                </div>
              </div>

              {/* BOTTOM: INTERACTION HISTORY (Derived strictly from schema fields) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[#3d0707] flex items-center gap-1.5">
                    <HistoryIcon className="w-3.5 h-3.5 text-[#5c5757]" />
                    Interaction History
                  </h4>
                  <span className="text-[10px] text-[#5c5757]">
                    Current Status: <strong className="text-[#1c1a1a]">{formData.pipelineStatus}</strong>
                  </span>
                </div>

                <div className="rounded-md border border-[#e3dfdf] overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f7f6f6] border-b border-[#e3dfdf] text-[9.5px] uppercase font-semibold text-[#5c5757]">
                        <th className="px-3.5 py-2">Milestone / Date</th>
                        <th className="px-3.5 py-2">Status Stage</th>
                        <th className="px-3.5 py-2">Action Plan / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eeee] text-[11px]">
                      {formData.actionPlan && (
                        <tr className="bg-[#fdfcfc]">
                          <td className="px-3.5 py-2 text-[#1c1a1a] font-medium whitespace-nowrap text-[10.5px]">
                            {formData.followupDate ? `Due: ${formData.followupDate}` : "Active Follow-up"}
                          </td>
                          <td className="px-3.5 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {formData.pipelineStatus}
                            </span>
                          </td>
                          <td className="px-3.5 py-2">
                            <div className="text-[#1c1a1a] font-medium">Next Step Action Plan</div>
                            <div className="text-[10px] text-[#5c5757] line-clamp-2 mt-0.5">
                              {formData.actionPlan}
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-3.5 py-2 text-[#5c5757] whitespace-nowrap text-[10.5px]">
                          Initial Intake
                        </td>
                        <td className="px-3.5 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            New Lead
                          </span>
                        </td>
                        <td className="px-3.5 py-2">
                          <div className="text-[#1c1a1a] font-medium">Prospect record created</div>
                          <div className="text-[10px] text-[#5c5757] mt-0.5">
                            Sourced via {formData.leadSource} · Target campaign: {formData.targetCampaign}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
  navbarPreset.selectedTabIndex = 0;

  return (
    <AppShell navbarPreset={navbarPreset}>
      <Suspense
        fallback={
          <div
            className="w-full max-w-[954px] mx-auto py-6 text-center text-xs text-[#5c5757]"
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
