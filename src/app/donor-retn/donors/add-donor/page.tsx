"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-retn/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useUserRole } from "@/lib/use-user-role";
import {
  ProspectDatePicker,
  ProspectSelectMenu,
  ProspectCreateSkeleton,
} from "@/app/donor-conv/prospects/_components";
import { createDonor } from "@/lib/donors/actions";
import { setPendingToast } from "@/lib/toast";
import type {
  DonorTenureEnum,
  EngagementStatusEnum,
  TargetCampaignEnum,
} from "@/types";

const pageName = "Add Donor";

const DONOR_TYPE_OPTIONS = [
  { label: "Corporate", value: "corporate" },
  { label: "Individual", value: "individual" },
  { label: "Community", value: "community" },
  { label: "International", value: "international" },
];

const TARGET_CAMPAIGN_OPTIONS: TargetCampaignEnum[] = [
  "Health and Disaster Relief",
  "Youth Servant Leadership",
  "In-Kind Social Enterprise",
  "At-Risk Restorative Justice",
  "Institute for Stewardship",
];

const ENGAGEMENT_STATUS_OPTIONS: EngagementStatusEnum[] = [
  "Uncontacted",
  "Followed-up",
  "Renewal Started",
  "Recommitted",
  "Lapsed Donor",
];

const DONOR_TENURE_OPTIONS: DonorTenureEnum[] = [
  "New Renewal",
  "1 Year Retained",
  "2 Years Retained",
  "3+ Years Loyal",
];

const ASSIGNED_OFFICER_OPTIONS = [
  "Officer J. Reyes",
  "Officer A. Tan",
  "Officer M. Cruz",
];

function AddDonorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { officerName, canWriteModule } = useUserRole();
  const canWrite = canWriteModule("donor-retn");

  const fromParam = searchParams.get("from");
  const returnUrl = "/donor-retn/donors";
  const returnLabel = "Back to Donors";

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

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

  const [formData, setFormData] = useState({
    donorName: "",
    donorType: "corporate",
    primaryContactPerson: "",
    titleDesignation: "",
    emailAddress: "",
    mobileNumber: "",
    taxId: "",
    streetAddress: "",
    cityProvince: "",
    taxCertificateRequested: false,
    targetCampaign: "Health and Disaster Relief" as TargetCampaignEnum,
    engagementStatus: "Uncontacted" as EngagementStatusEnum,
    donorTenure: "New Renewal" as DonorTenureEnum,
    assignedOfficer: "Officer J. Reyes",
    targetFollowupDate: "",
    lastContactDate: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (officerName) {
      const matched = ASSIGNED_OFFICER_OPTIONS.find(
        (opt) =>
          officerName
            .toLowerCase()
            .includes(opt.replace("Officer ", "").toLowerCase()) ||
          opt.toLowerCase().includes(officerName.toLowerCase())
      );
      setFormData((prev) => ({
        ...prev,
        assignedOfficer: matched || officerName,
      }));
    }
  }, [officerName]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const fullAddress = [formData.streetAddress, formData.cityProvince]
        .filter(Boolean)
        .join(", ");

      const res = await createDonor({
        donorName: formData.donorName,
        donorType: formData.donorType,
        primaryContactPerson: formData.primaryContactPerson,
        titleDesignation: formData.titleDesignation,
        emailAddress: formData.emailAddress,
        mobileNumber: formData.mobileNumber,
        taxId: formData.taxId,
        streetAddress: formData.streetAddress,
        cityProvince: formData.cityProvince,
        deliveryAddress: fullAddress,
        taxCertificateRequested: formData.taxCertificateRequested,
        targetCampaign: formData.targetCampaign,
        engagementStatus: formData.engagementStatus,
        donorTenure: formData.donorTenure,
        assignedOfficer: formData.assignedOfficer,
        targetFollowupDate: formData.targetFollowupDate || null,
        lastContactDate: formData.lastContactDate || null,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save donor record");
        setIsSubmitting(false);
        return;
      }

      setPendingToast({
        title: "Donor Created",
        message: `New donor "${formData.donorName}" was added successfully!`,
        type: "success",
      });
      router.push(returnUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ProspectCreateSkeleton />;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        html, body {
          min-width: 0 !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          width: 100% !important;
        }
      `,
        }}
      />
      <div
        className="w-[75%] max-w-full min-w-0 mx-auto space-y-2.5 overflow-visible pb-12"
        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
      >
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

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-visible w-full min-w-0 max-w-full"
        >
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dfdf] px-5 sm:px-6 py-2.5 bg-white">
            <h2 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">
              Add New Donor Profile
            </h2>
            <span className="text-[0.625rem] text-[#5c5757]">
              Fields marked with <span className="text-[#b42318]">*</span> are mandatory
            </span>
          </div>

          {/* Form Body - 75% width, collapses cleanly on smaller screens */}
          <div className="p-5 sm:p-6 space-y-4 w-full min-w-0">
            {/* SECTION 1: DONOR BASIC INFORMATION */}
            <div className="w-full min-w-0">
              <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
                Donor Basic Information
              </h3>
              <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0">
                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Organization / Donor Name <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    type="text"
                    name="donorName"
                    value={formData.donorName}
                    onChange={handleChange}
                    placeholder="Enter organization or donor name"
                    required
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
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

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                    placeholder="Enter TIN (optional)"
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PRIMARY CONTACT & ADDRESS DETAILS */}
            <div className="pt-3 border-t border-[#e3dfdf] w-full min-w-0">
              <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
                Primary Contact & Address Details
              </h3>
              <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0">
                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Primary Contact Person <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    type="text"
                    name="primaryContactPerson"
                    value={formData.primaryContactPerson}
                    onChange={handleChange}
                    placeholder="Enter full contact name"
                    required
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    name="titleDesignation"
                    value={formData.titleDesignation}
                    onChange={handleChange}
                    placeholder="Enter designation"
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Email Address <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Mobile / Phone Number <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    placeholder="Enter street address"
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    City & Province
                  </label>
                  <input
                    type="text"
                    name="cityProvince"
                    value={formData.cityProvince}
                    onChange={handleChange}
                    placeholder="Enter city and province"
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: RETENTION & CAMPAIGN ASSIGNMENT */}
            <div className="pt-3 border-t border-[#e3dfdf] w-full min-w-0">
              <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
                Retention & Campaign Assignment
              </h3>
              <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0">
                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Target Campaign <span className="text-[#b42318]">*</span>
                  </label>
                  <ProspectSelectMenu
                    value={formData.targetCampaign}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetCampaign: val as TargetCampaignEnum,
                      }))
                    }
                    options={TARGET_CAMPAIGN_OPTIONS}
                    placeholder="Select campaign"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Tax Certificate (COD)
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.taxCertificateRequested}
                    disabled={!canWrite}
                    onClick={() => {
                      if (!canWrite) return;
                      setFormData((prev) => ({
                        ...prev,
                        taxCertificateRequested: !prev.taxCertificateRequested,
                      }));
                    }}
                    className={`w-full h-[30px] px-2.5 rounded-md border border-[#e3dfdf] flex items-center justify-between transition min-w-0 select-none ${
                      canWrite
                        ? "bg-white hover:border-[#6b0f0f]/50 cursor-pointer"
                        : "bg-[#f7f6f6] cursor-not-allowed opacity-70"
                    }`}
                  >
                    <span className="text-[0.6875rem] font-medium text-[#1c1a1a]">
                      {formData.taxCertificateRequested
                        ? "Certificate requested"
                        : "Not requested"}
                    </span>
                    <span
                      className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                        formData.taxCertificateRequested
                          ? "bg-[#6b0f0f]"
                          : "bg-[#d1d5db]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                          formData.taxCertificateRequested
                            ? "translate-x-3.5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </span>
                  </button>
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Engagement Status <span className="text-[#b42318]">*</span>
                  </label>
                  <ProspectSelectMenu
                    value={formData.engagementStatus}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagementStatus: val as EngagementStatusEnum,
                      }))
                    }
                    options={ENGAGEMENT_STATUS_OPTIONS}
                    placeholder="Select engagement status"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Assigned Officer <span className="text-[#b42318]">*</span>
                  </label>
                  <ProspectSelectMenu
                    value={formData.assignedOfficer}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, assignedOfficer: val }))
                    }
                    options={ASSIGNED_OFFICER_OPTIONS}
                    placeholder="Select assigned officer"
                    direction="up"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Target Follow-up Date
                  </label>
                  <ProspectDatePicker
                    value={formData.targetFollowupDate}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, targetFollowupDate: val }))
                    }
                    placeholder="Select follow-up date"
                    direction="up"
                    align="right"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                    Last Contact Date
                  </label>
                  <ProspectDatePicker
                    value={formData.lastContactDate}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, lastContactDate: val }))
                    }
                    placeholder="Select last contact date"
                    direction="up"
                    align="left"
                  />
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div
                className="p-3 text-[0.6875rem] font-medium text-red-700 bg-red-50 border border-red-200 rounded-md"
                role="alert"
              >
                {errorMessage}
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[#e3dfdf] px-5 sm:px-6 py-2.5 bg-white">
            <button
              type="button"
              onClick={() => router.push(returnUrl)}
              disabled={isSubmitting}
              className="h-[30px] px-3.5 text-[0.6875rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            {canWrite ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[30px] px-4 text-[0.6875rem] font-medium text-white bg-[#6b0f0f] hover:bg-[#520b0b] rounded-md transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Donor"}
              </button>
            ) : (
              <span className="h-[30px] inline-flex items-center px-3.5 text-[0.6875rem] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-md select-none">
                View only
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export default function AddDonorPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  return (
    <AppShell navbarPreset={navbarPreset}>
      <Suspense fallback={<ProspectCreateSkeleton />}>
        <AddDonorForm />
      </Suspense>
    </AppShell>
  );
}
