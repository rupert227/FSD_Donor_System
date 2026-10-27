"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SAMPLE_LEADS } from "@/lib/mock-data/leads";

function UpdateLeadProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  // Find lead by id query param; fallback to first lead if not found or not specified
  const matchedLead =
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
    pipelineStatus: matchedLead.pipeline_status,
    probability: matchedLead.probability,
    assignedOfficer: matchedLead.assigned_officer,
    followupDate: matchedLead.target_followup_date ?? "",
    actionPlan: matchedLead.action_plan,
  });

  // Dynamically update form whenever the ID in the URL changes
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
        pipelineStatus: matchedLead.pipeline_status,
        probability: matchedLead.probability,
        assignedOfficer: matchedLead.assigned_officer,
        followupDate: matchedLead.target_followup_date ?? "",
        actionPlan: matchedLead.action_plan,
      });
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

  const handleLeadSwitch = (newId: string) => {
    router.push(`/conv-unit/update-lead-profile?id=${newId}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/conv-unit/lead-prospects-list");
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Navigation Breadcrumb & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <Link
            href="/conv-unit/lead-prospects-list"
            className="flex items-center gap-1.5 font-medium text-gray-600 hover:text-[#801313] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Leads</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-800">
            Update prospect ({matchedLead.prospect_name})
          </span>
        </div>

        {/* Quick Lead Selector for easy testing across records */}
        <div className="flex items-center gap-2 text-gray-600">
          <label htmlFor="lead-switcher" className="text-xs font-medium text-gray-500">
            Preview profile:
          </label>
          <select
            id="lead-switcher"
            value={matchedLead.id}
            onChange={(e) => handleLeadSwitch(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs focus:border-[#801313] focus:outline-none"
          >
            {SAMPLE_LEADS.map((lead) => (
              <option key={lead.id} value={lead.id}>
                #{lead.id} - {lead.prospect_name} ({lead.pipeline_status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {formData.prospectName || "Prospect profile"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Record #{matchedLead.id} · Pipeline: {formData.pipelineStatus}
            </p>
          </div>
          <span className="text-xs text-gray-500">
            Fields marked <span className="text-[#801313] font-semibold">*</span> are required
          </span>
        </div>

        {/* Form Body */}
        <div className="px-8 py-6 space-y-8">
          {/* 1. Prospect Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Prospect details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Organization name <span className="text-[#801313]">*</span>
                </label>
                <input
                  type="text"
                  name="prospectName"
                  value={formData.prospectName}
                  onChange={handleChange}
                  placeholder="Enter organization or prospect name"
                  required
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Donor type <span className="text-[#801313]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="donorType"
                    value={formData.donorType}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select donor type</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Individual">Individual</option>
                    <option value="Community">Community</option>
                    <option value="International">International</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Lead source <span className="text-[#801313]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="leadSource"
                    value={formData.leadSource}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select lead source</option>
                    <option value="Research">Research</option>
                    <option value="Booths">Booths</option>
                    <option value="Direct Call">Direct Call</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Primary Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Primary contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Contact person <span className="text-[#801313]">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter contact person name"
                  required
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Title or designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter title or designation"
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Mobile or landline <span className="text-[#801313]">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone or mobile number"
                  required
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Street address
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="Enter street address"
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  City and province
                </label>
                <input
                  type="text"
                  name="cityProvince"
                  value={formData.cityProvince}
                  onChange={handleChange}
                  placeholder="Enter city and province"
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>
            </div>
          </div>

          {/* 3. Stewardship Target */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Stewardship target
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Target campaign <span className="text-[#801313]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="targetCampaign"
                    value={formData.targetCampaign}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select target campaign</option>
                    <option value="Health and Disaster Relief">
                      Health and Disaster Relief
                    </option>
                    <option value="Youth Servant Leadership">
                      Youth Servant Leadership
                    </option>
                    <option value="In-Kind Social Enterprise">
                      In-Kind Social Enterprise
                    </option>
                    <option value="At-Risk Restorative Justice">
                      At-Risk Restorative Justice
                    </option>
                    <option value="Institute for Stewardship">
                      Institute for Stewardship
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Target amount (₱) <span className="text-[#801313]">*</span>
                </label>
                <input
                  type="number"
                  step="1000"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  placeholder="Enter target amount"
                  required
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Whole pesos, no centavos
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Pipeline status <span className="text-[#801313]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="pipelineStatus"
                    value={formData.pipelineStatus}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select pipeline status</option>
                    <option value="New Lead">New Lead</option>
                    <option value="Under Research">Under Research</option>
                    <option value="Outreach Started">Outreach Started</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Secured Donor">Secured Donor</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Probability estimate
                </label>
                <div className="relative">
                  <select
                    name="probability"
                    value={formData.probability}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select probability</option>
                    <option value="20">20% · Low likelihood</option>
                    <option value="40">40% · Fair likelihood</option>
                    <option value="60">60% · Good likelihood</option>
                    <option value="80">80% · High likelihood</option>
                    <option value="100">100% · Secured commitment</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Assigned officer <span className="text-[#801313]">*</span>
                </label>
                <div className="relative">
                  <select
                    name="assignedOfficer"
                    value={formData.assignedOfficer}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 pr-8 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select officer</option>
                    <option value="Officer J. Reyes">Officer J. Reyes</option>
                    <option value="Officer A. Tan">Officer A. Tan</option>
                    <option value="Officer M. Cruz">Officer M. Cruz</option>
                    <option value="Officer V. De Guzman">Officer V. De Guzman</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Target follow-up date
                </label>
                <input
                  type="date"
                  name="followupDate"
                  value={formData.followupDate}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Next step action plan
              </label>
              <textarea
                name="actionPlan"
                value={formData.actionPlan}
                onChange={handleChange}
                rows={3}
                placeholder="Enter next action plan steps..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#801313]/20 focus:border-[#801313] transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-8 py-4 bg-white">
          <button
            type="button"
            onClick={() => router.push("/conv-unit/lead-prospects-list")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-[#5A0C0C] hover:bg-[#480a0a] rounded-lg transition shadow-xs cursor-pointer"
          >
            Update prospect
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UpdateLeadProfilePage() {
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
    >
      <Suspense
        fallback={
          <div className="w-full max-w-6xl mx-auto py-12 text-center text-sm text-gray-500">
            Loading prospect profile...
          </div>
        }
      >
        <UpdateLeadProfileForm />
      </Suspense>
    </AppShell>
  );
}
