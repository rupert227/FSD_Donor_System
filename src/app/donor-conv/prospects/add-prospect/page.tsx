"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { navbarPreset } from "@/app/donor-conv/struct";

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
      <div className="w-full max-w-[954px] mx-auto space-y-1.5" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
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
          className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-hidden"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-[#e3dfdf] px-5 py-2 bg-white">
            <h2 className="text-[13px] font-semibold text-[#1c1a1a]">
              Add New Lead Prospect Profile
            </h2>
            <span className="text-[10px] text-[#5c5757]">
              Fields marked with <span className="text-[#b42318]">*</span> are mandatory
            </span>
          </div>

          {/* Form Body - Exact V1 Measurements (30px inputs, 11px text) */}
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
                  className="w-full h-[48px] px-2.5 py-1 text-[11px] font-normal rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition resize-none"
                />
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
              Save Prospect
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
