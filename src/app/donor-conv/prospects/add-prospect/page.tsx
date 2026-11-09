"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { navbarPreset } from "@/app/donor-conv/struct";
import { ProspectSelectMenu } from "@/components/ProspectSelectMenu";
import { ProspectDatePicker } from "@/components/ProspectDatePicker";
import { ProspectScoreField } from "@/components/ProspectScoreField";
import { calculateProspectProbability } from "@/lib/prospect-score";

const DONOR_TYPE_OPTIONS = ["Corporate", "Individual", "Community", "International"];
const LEAD_SOURCE_OPTIONS = ["Research", "Booths", "Direct Call", "Referral", "Walk-in"];
const TARGET_CAMPAIGN_OPTIONS = [
  "Health and Disaster Relief",
  "Youth Servant Leadership",
  "In-Kind Social Enterprise",
  "At-Risk Restorative Justice",
  "Institute for Stewardship",
];
const PIPELINE_STATUS_OPTIONS = [
  "New Lead",
  "Under Research",
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];
const ASSIGNED_OFFICER_OPTIONS = [
  "Officer J. Reyes",
  "Officer A. Tan",
  "Officer M. Cruz",
];

export default function AddProspectPage() {
  navbarPreset.selectedTabIndex = 0;
  const router = useRouter();

  const [formData, setFormData] = useState({
    prospectName: "",
    donorType: "",
    leadSource: "",
    contactPerson: "",
    designation: "",
    email: "",
    phone: "",
    streetAddress: "",
    cityProvince: "",
    targetCampaign: "",
    targetAmount: "",
    pipelineStatus: "New Lead",
    probability: "",
    assignedOfficer: "",
    followupDate: "",
    actionPlan: "",
  });

  // Calculate probability live using the deterministic formula
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/donor-conv/prospects");
  };

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="w-[75%] max-w-full min-w-0 mx-auto space-y-2.5" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
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

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-visible w-full min-w-0"
        >
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dfdf] px-5 sm:px-6 py-2.5 bg-white">
            <h2 className="text-[13px] font-semibold text-[#1c1a1a]">
              Add New Lead Prospect Profile
            </h2>
            <span className="text-[10px] text-[#5c5757]">
              Fields marked with <span className="text-[#b42318]">*</span> are mandatory
            </span>
          </div>

          {/* Form Body - 75% width, collapses to 1 column when 3 columns do not fit */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* SECTION 1: PROSPECT BASIC INFORMATION */}
            <div>
              <h3 className="text-[11px] font-bold text-[#3d0707] mb-1.5">
                Prospect Basic Information
              </h3>
              <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
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
                  <ProspectSelectMenu
                    value={formData.donorType}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, donorType: val }))
                    }
                    options={DONOR_TYPE_OPTIONS}
                    placeholder="Select donor type"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                    Lead Source Origin <span className="text-[#b42318]">*</span>
                  </label>
                  <ProspectSelectMenu
                    value={formData.leadSource}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, leadSource: val }))
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
            <div className="pt-3 border-t border-[#e3dfdf]">
              <h3 className="text-[11px] font-bold text-[#3d0707] mb-1.5">
                Stewardship & Proposal Target
              </h3>
              <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 mb-2.5">
                <div>
                  <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                    Target Campaign <span className="text-[#b42318]">*</span>
                  </label>
                  <ProspectSelectMenu
                    value={formData.targetCampaign}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, targetCampaign: val }))
                    }
                    options={TARGET_CAMPAIGN_OPTIONS}
                    placeholder="Select target campaign"
                  />
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
                  <ProspectSelectMenu
                    value={formData.pipelineStatus}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, pipelineStatus: val }))
                    }
                    options={PIPELINE_STATUS_OPTIONS}
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
                    Assigned Officer <span className="text-[#b42318]">*</span>
                  </label>
                  <ProspectSelectMenu
                    value={formData.assignedOfficer}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, assignedOfficer: val }))
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

              <div>
                <label className="block text-[10.5px] font-normal text-[#5c5757] mb-0.5">
                  Next Step Action Plan
                </label>
                <textarea
                  name="actionPlan"
                  value={formData.actionPlan}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Enter next action plan steps..."
                  className="w-full h-[64px] px-2.5 py-1.5 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition resize-none"
                />
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
              Save Prospect
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
