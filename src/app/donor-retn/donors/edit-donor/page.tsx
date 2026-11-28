"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { cn } from "cn";
import { getNavbarPreset, moduleName } from "@/app/donor-retn/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useUserRole } from "@/lib/use-user-role";
import {
  ProspectDatePicker,
  ProspectSelectMenu,
  ProspectUpdateSkeleton,
} from "@/app/donor-conv/prospects/_components";
import {
  getDonorById,
  updateDonor,
  getDonorRenewals,
  getDonorOutreachActivities,
  recordDonorOutreach,
  type DonorRenewalItem,
  type DonorOutreachItem,
} from "@/lib/donors/actions";
import { showToast, setPendingToast } from "@/lib/toast";
import {
  OUTREACH_HEADER_MAX,
  encodeOutreachNotes,
  parseOutreachNotes,
} from "@/lib/outreach-notes";
import type {
  DonorTenureEnum,
  EngagementStatusEnum,
  TargetCampaignEnum,
} from "@/types";

const pageName = "Edit Donor";

const RETENTION_STAGES: EngagementStatusEnum[] = [
  "Uncontacted",
  "Followed-up",
  "Renewal Started",
  "Recommitted",
];

const STATUS_STYLES: Record<EngagementStatusEnum, { badge: string }> = {
  Uncontacted: {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  "Followed-up": {
    badge: "bg-stone-100 text-stone-600 border border-stone-200",
  },
  "Renewal Started": {
    badge: "bg-sky-50/70 text-[#2c5270] border border-[#cbdce9]",
  },
  Recommitted: {
    badge: "bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]",
  },
  "Lapsed Donor": {
    badge: "bg-rose-50/70 text-[#842323] border border-[#f0c4c4]",
  },
};

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

function getRecordInterval(index: number, records: DonorOutreachItem[]): string {
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

function formatFollowupDisplay(val?: string | null) {
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

function EditDonorForm() {
  const router = useRouter();
  const { role, officerName, canWriteModule } = useUserRole();
  const canWrite = canWriteModule("donor-retn");
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const returnUrl = "/donor-retn/donors";
  const returnLabel = "Back to Donors";

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

  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [donorId, setDonorId] = useState<number | null>(null);

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

  const [renewalsList, setRenewalsList] = useState<DonorRenewalItem[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<DonorOutreachItem[]>([]);

  const [activeTab, setActiveTab] = useState<"details" | "renewals" | "history">("details");

  // Outreach recording modal state (patterned directly after edit-prospect)
  const [isTrackOutreachOpen, setIsTrackOutreachOpen] = useState(false);
  const [isOutreachModalExiting, setIsOutreachModalExiting] = useState(false);
  const [modalStatus, setModalStatus] = useState<EngagementStatusEnum>("Followed-up");
  const [modalFollowupDate, setModalFollowupDate] = useState("");
  const [modalHeader, setModalHeader] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [isSavingOutreach, setIsSavingOutreach] = useState(false);

  const closeOutreachModal = React.useCallback(() => {
    setIsOutreachModalExiting(true);
    setTimeout(() => {
      setIsTrackOutreachOpen(false);
      setIsOutreachModalExiting(false);
    }, 160);
  }, []);

  // Activity detail view modal (patterned directly after edit-prospect)
  const [selectedActivity, setSelectedActivity] = useState<DonorOutreachItem | null>(null);
  const [isActivityDetailExiting, setIsActivityDetailExiting] = useState(false);

  const closeActivityDetailModal = React.useCallback(() => {
    setIsActivityDetailExiting(true);
    setTimeout(() => {
      setSelectedActivity(null);
      setIsActivityDetailExiting(false);
    }, 160);
  }, []);

  // Escape closes the open modal. A dropdown inside the modal that handles
  // Escape itself calls preventDefault, so the first press only closes that.
  useEffect(() => {
    if (!isTrackOutreachOpen && !selectedActivity) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (selectedActivity) closeActivityDetailModal();
      else closeOutreachModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTrackOutreachOpen, selectedActivity, closeOutreachModal, closeActivityDetailModal]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!idParam) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const numericId = Number(idParam);
    if (isNaN(numericId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setDonorId(numericId);

    async function loadData() {
      try {
        const donor = await getDonorById(numericId);
        if (!donor) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const rawAddr = donor.delivery_address || "";
        const parts = rawAddr.split(",").map((s) => s.trim()).filter(Boolean);
        let street = "";
        let city = "";
        if (parts.length >= 2) {
          if (parts.length === 2) {
            street = parts[0];
            city = parts[1];
          } else {
            street = parts.slice(0, -2).join(", ") || parts[0];
            city = parts.slice(-2).join(", ");
          }
        } else {
          street = rawAddr;
          city = "";
        }

        setFormData({
          donorName: donor.donor_name || "",
          donorType: donor.donor_type || "corporate",
          primaryContactPerson: donor.primary_contact_person || "",
          titleDesignation: donor.title_designation || "",
          emailAddress: donor.email_address || "",
          mobileNumber: donor.mobile_number || "",
          taxId: donor.tax_id || "",
          streetAddress: street,
          cityProvince: city,
          taxCertificateRequested: Boolean(donor.cod_requested),
          targetCampaign: donor.target_campaign || "Health and Disaster Relief",
          engagementStatus: donor.engagement_status || "Uncontacted",
          donorTenure: donor.donor_tenure || "New Renewal",
          assignedOfficer: donor.assigned_officer || "Officer J. Reyes",
          targetFollowupDate: donor.target_followup_date || "",
          lastContactDate: donor.last_contact_date || "",
        });

        const [renewals, outreach] = await Promise.all([
          getDonorRenewals(numericId),
          getDonorOutreachActivities(numericId),
        ]);

        setRenewalsList(renewals);
        setOutreachRecords(outreach);
      } catch (err) {
        console.error("Error loading donor:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [idParam]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorId) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const fullAddress = [formData.streetAddress, formData.cityProvince]
        .filter(Boolean)
        .join(", ");

      const res = await updateDonor(donorId, {
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
        setErrorMessage(res.error || "Failed to update donor record");
        setIsSaving(false);
        return;
      }

      const savedToast = {
        title: "Donor Updated",
        message: `Donor profile changes for "${formData.donorName || "this donor"}" saved successfully.`,
        type: "success" as const,
      };
      setPendingToast(savedToast);
      router.push(returnUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setIsSaving(false);
    }
  };

  const handleSaveOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorId) return;

    setIsSavingOutreach(true);
    try {
      const effectiveAuthor =
        (role === "System Administrator" ? "System Admin" : null) ||
        officerName ||
        formData.assignedOfficer;

      const storedNotes = encodeOutreachNotes(modalHeader, modalNotes);
      const res = await recordDonorOutreach(donorId, {
        status: modalStatus,
        followupDate: modalFollowupDate || undefined,
        notes: storedNotes,
        authorOfficer: effectiveAuthor,
      });

      if (res.success) {
        const newRecord: DonorOutreachItem = {
          id: `outreach-${Date.now()}`,
          dateTime: new Date().toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: modalStatus,
          followupDate: modalFollowupDate,
          notes: storedNotes,
          authorOfficer: effectiveAuthor,
        };

        setOutreachRecords((prev) => [newRecord, ...prev]);
        setFormData((prev) => ({
          ...prev,
          engagementStatus: modalStatus,
          targetFollowupDate: modalFollowupDate || prev.targetFollowupDate,
          lastContactDate: new Date().toISOString().split("T")[0],
        }));

        showToast({
          title: "Outreach Logged",
          message: "Stewardship touchpoint recorded successfully.",
          type: "success",
        });
        setModalHeader("");
        setModalNotes("");

        closeOutreachModal();
      } else {
        alert(res.error || "Failed to record outreach");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setIsSavingOutreach(false);
    }
  };

  const handleMarkAsRecommitted = async () => {
    if (!donorId || formData.engagementStatus === "Recommitted") return;

    try {
      const res = await updateDonor(donorId, {
        engagementStatus: "Recommitted",
      });

      if (res.success) {
        setFormData((prev) => ({ ...prev, engagementStatus: "Recommitted" }));
        showToast({
          title: "Donor Recommitted",
          message: `${formData.donorName} has been marked as Recommitted for this renewal cycle!`,
          type: "success",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentStageIndex = RETENTION_STAGES.indexOf(formData.engagementStatus);

  if (isLoading) {
    return <ProspectUpdateSkeleton canWrite={canWrite} />;
  }

  if (notFound) {
    return (
      <div className="mx-auto w-[75%] space-y-3 py-8 text-sm" role="alert">
        <p>That donor record was not found. Return to the donor list.</p>
        <Link href="/donor-retn/donors" className="text-[#6b0f0f] underline">
          Back to Donors
        </Link>
      </div>
    );
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
        className="w-[75%] max-w-full min-w-0 mx-auto space-y-2.5 pb-12 overflow-visible"
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

        {/* TOP RECORD SUMMARY CARD */}
        <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs p-3.5 space-y-2.5 w-full min-w-0">
          {/* Title row */}
          <div className="flex flex-col min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-[0.625rem] text-[#5c5757]">Donor</div>
              <h1 className="text-[1rem] sm:text-[1.125rem] font-semibold text-[#1c1a1a] leading-tight break-words">
                {formData.donorName || "Unnamed Donor"}
              </h1>
            </div>

            {/* Action Buttons - Switched text/emphasis: Mark as recommitted uses exact same color/styling as mark as secured in prospects */}
            <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-nowrap w-full min-[1100px]:w-auto">
              {canWrite ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setModalFollowupDate(formData.targetFollowupDate);
                      setModalStatus(
                        formData.engagementStatus === "Uncontacted"
                          ? "Followed-up"
                          : formData.engagementStatus
                      );
                      setIsTrackOutreachOpen(true);
                    }}
                    className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 text-[0.59375rem] sm:text-[0.6875rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap min-w-0"
                  >
                    Record outreach
                  </button>
                  <Link
                    href={`/donor-retn/renewals?donorId=${donorId}&donor=${encodeURIComponent(formData.donorName)}`}
                    className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 text-[0.59375rem] sm:text-[0.6875rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap min-w-0"
                  >
                    Generate renewal
                  </Link>
                  <button
                    type="button"
                    onClick={handleMarkAsRecommitted}
                    disabled={formData.engagementStatus === "Recommitted"}
                    className="flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 inline-flex items-center justify-center text-[0.59375rem] sm:text-[0.6875rem] font-medium text-[#6b0f0f] bg-white border border-[#6b0f0f] rounded-md hover:bg-[#fdf1f1] transition shadow-xs cursor-pointer whitespace-nowrap min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mark as recommitted
                  </button>
                </>
              ) : (
                <span className="h-[26px] sm:h-[30px] px-3 inline-flex items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-500 border border-gray-200 select-none">
                  View only
                </span>
              )}
            </div>
          </div>

          {/* Highlights Row (Summary Metrics) */}
          <div className="grid grid-cols-1 min-[1100px]:grid-cols-4 gap-2.5 pt-2 border-t border-[#f0eeee]">
            <div>
              <div className="text-[0.625rem] font-medium text-[#5c5757]">
                Target campaign
              </div>
              <div className="text-[0.6875rem] font-medium text-[#1c1a1a] break-words">
                {formData.targetCampaign || "—"}
              </div>
            </div>
            <div>
              <div className="text-[0.625rem] font-medium text-[#5c5757]">
                Donor tenure
              </div>
              <div className="text-[0.6875rem] font-medium text-[#1c1a1a] whitespace-nowrap">
                {formData.donorTenure}
              </div>
            </div>
            <div>
              <div className="text-[0.625rem] font-medium text-[#5c5757]">
                Owner
              </div>
              <div className="text-[0.6875rem] font-medium text-[#1c1a1a] break-words">
                {formData.assignedOfficer || "—"}
              </div>
            </div>
            <div>
              <div className="text-[0.625rem] font-medium text-[#5c5757]">
                Next follow-up
              </div>
              <div className="text-[0.6875rem] font-medium text-[#1c1a1a]">
                {formatFollowupDisplay(formData.targetFollowupDate)}
              </div>
            </div>
          </div>

          {/* Retention Lifecycle Path Bar */}
          <div className="pt-2 border-t border-[#f0eeee]">
            {formData.engagementStatus === "Lapsed Donor" ? (
              <div className="h-[28px] px-3 rounded-md text-[0.65625rem] font-medium flex items-center justify-between bg-rose-50/70 text-[#842323] border border-[#f0c4c4]">
                <span className="font-semibold">Lapsed Renewal Cycle</span>
                <span className="text-[0.625rem] text-[#842323]/80">
                  Renewal period elapsed without recommitment
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[1100px]:grid-cols-4 gap-1.5">
                {RETENTION_STAGES.map((stage, idx) => {
                  const isPast =
                    currentStageIndex >= 0 && idx < currentStageIndex;
                  const isCurrent =
                    currentStageIndex >= 0 && idx === currentStageIndex;

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
                      {isPast && (
                        <Check className="w-3 h-3 text-[#166534] shrink-0" />
                      )}
                      <span className="whitespace-nowrap">{stage}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RECORD CARD WITH TABS */}
        <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-visible w-full min-w-0">
          {/* Card Tabs Header */}
          <div className="flex items-center gap-6 border-b border-[#e3dfdf] px-5 sm:px-6 bg-white">
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
              onClick={() => setActiveTab("renewals")}
              className={`py-2.5 text-[0.78125rem] font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "renewals"
                  ? "border-[#6b0f0f] text-[#6b0f0f]"
                  : "border-transparent text-[#5c5757] hover:text-[#1c1a1a]"
              }`}
            >
              <span>Renewals</span>
              <span className="rounded-full bg-[#f0eeee] px-1.5 py-0.2 text-[0.625rem] text-[#5c5757]">
                {renewalsList.length}
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
              <span className="rounded-full bg-[#f0eeee] px-1.5 py-0.2 text-[0.625rem] text-[#5c5757]">
                {outreachRecords.length}
              </span>
            </button>
          </div>

          {/* TAB 1: DETAILS */}
          {activeTab === "details" && (
            <form onSubmit={handleSaveForm}>
              <div className="p-5 sm:p-6 space-y-4">
                {/* SECTION 1: DONOR BASIC INFORMATION */}
                <div>
                  <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
                    Donor Basic Information
                  </h3>
                  <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
                    <div className="min-w-0">
                      <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                        Organization / Donor Name <span className="text-[#b42318]">*</span>
                      </label>
                      <input
                        type="text"
                        name="donorName"
                        value={formData.donorName}
                        onChange={handleChange}
                        disabled={!canWrite}
                        required
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
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
                        disabled={!canWrite}
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
                        disabled={!canWrite}
                        placeholder="Enter TIN (optional)"
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
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
                    <div className="min-w-0">
                      <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                        Primary Contact Person <span className="text-[#b42318]">*</span>
                      </label>
                      <input
                        type="text"
                        name="primaryContactPerson"
                        value={formData.primaryContactPerson}
                        onChange={handleChange}
                        disabled={!canWrite}
                        required
                        placeholder="Enter full contact name"
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
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
                        disabled={!canWrite}
                        placeholder="Enter designation"
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
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
                        disabled={!canWrite}
                        required
                        placeholder="name@example.com"
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
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
                        disabled={!canWrite}
                        required
                        placeholder="Enter phone number"
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
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
                        disabled={!canWrite}
                        placeholder="Enter street address"
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
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
                        disabled={!canWrite}
                        placeholder="Enter city and province"
                        className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] focus:outline-none focus:border-[#6b0f0f] transition disabled:bg-[#f7f6f6]"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: RETENTION & CAMPAIGN ASSIGNMENT */}
                <div className="pt-3 border-t border-[#e3dfdf]">
                  <h3 className="text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5">
                    Retention & Campaign Assignment
                  </h3>
                  <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
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
                        disabled={!canWrite}
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
                            taxCertificateRequested:
                              !prev.taxCertificateRequested,
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
                        disabled={!canWrite}
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5">
                        c/o (Specialist) <span className="text-[#b42318]">*</span>
                      </label>
                      <ProspectSelectMenu
                        value={formData.assignedOfficer}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, assignedOfficer: val }))
                        }
                        options={ASSIGNED_OFFICER_OPTIONS}
                        placeholder="Select assigned officer"
                        disabled={!canWrite}
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
                        disabled={!canWrite}
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
                        disabled={!canWrite}
                        placeholder="Select last contact date"
                        direction="up"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div
                    className="p-3 text-[0.6875rem] font-medium text-red-700 bg-red-50 border border-red-200 rounded-md"
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Form Action Footer - White background with Cancel and Update Profile matching edit-prospect */}
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

          {/* TAB 2: RENEWALS & GIVING HISTORY */}
          {activeTab === "renewals" && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[0.75rem] font-bold text-[#3d0707]">
                    Donation & Renewal Remittances
                  </h3>
                  <p className="text-[0.625rem] text-[#5c5757]">
                    Official receipt records and campaign contributions for this donor.
                  </p>
                </div>
              </div>

              {renewalsList.length === 0 ? (
                <div className="py-12 text-center text-[0.75rem] text-[#5c5757]">
                  No past donation records registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#e3dfdf] rounded-md">
                  <table className="w-full text-left text-[0.6875rem]">
                    <thead className="bg-[#f7f6f6] text-[#5c5757] border-b border-[#e3dfdf]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Official Receipt</th>
                        <th className="px-3 py-2 font-semibold">Campaign</th>
                        <th className="px-3 py-2 font-semibold">Pledged Amount</th>
                        <th className="px-3 py-2 font-semibold">Collected</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                        <th className="px-3 py-2 font-semibold">Clearance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0eeee]">
                      {renewalsList.map((r) => (
                        <tr key={r.id} className="hover:bg-[#fafafa]">
                          <td className="px-3 py-2.5 font-medium text-[#1c1a1a]">
                            {r.officialReceiptNo || (
                              <span className="font-normal text-[#8a8585]">Not issued yet</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[#5c5757]">
                            {r.campaignName}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-[#1c1a1a]">
                            ₱{r.amountPledged.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-[#2d5f42]">
                            ₱{r.amountCollected.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-[#5c5757]">
                            {r.transactionDate}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[0.625rem] font-medium bg-emerald-50/60 text-[#2d5f42] border border-[#d0e3d6]">
                              {r.clearanceStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY (OUTREACH TIMELINE) */}
          {/* Matches edit-prospect timeline format exactly: single-line horizontal notes, no made-up fields */}
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
                <table className="w-full min-w-[650px] text-left border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "28%" }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#f7f6f6] border-b border-[#e3dfdf] text-[0.59375rem] uppercase font-semibold text-[#5c5757]">
                      <th className="px-3.5 py-2 text-left">Date & Time</th>
                      <th className="px-3.5 py-2 text-center">Interval</th>
                      <th className="px-3.5 py-2 text-center">Logged By</th>
                      <th className="px-3.5 py-2 text-center">Retention Status</th>
                      <th className="px-3.5 py-2 text-left pl-6 sm:pl-8">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eeee] text-[0.6875rem]">
                    {outreachRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3.5 py-6 text-center text-[0.6875rem] text-[#5c5757]"
                        >
                          No activity records logged yet.
                        </td>
                      </tr>
                    ) : (
                      outreachRecords.map((record, index) => {
                        const intervalLabel = getRecordInterval(index, outreachRecords);

                        return (
                          <tr
                            key={record.id}
                            onClick={() => setSelectedActivity(record)}
                            className="hover:bg-[#fbf9f9] transition-colors align-middle cursor-pointer group h-[39px]"
                            title="Click to view full activity details"
                          >
                            <td className="px-3.5 py-2 text-left text-[#5c5757] whitespace-nowrap text-[0.65625rem] truncate">
                              {record.dateTime}
                            </td>
                            {/* Normal plain text interval without enclosing shapes */}
                            <td className="px-3.5 py-2 text-center whitespace-nowrap text-[#5c5757] text-[0.65625rem]">
                              {intervalLabel}
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap text-[0.65625rem]">
                              <span className="text-[#1c1a1a] font-medium">
                                {record.authorOfficer === "System" ||
                                record.authorOfficer === "System Administrator"
                                  ? "System Admin"
                                  : record.authorOfficer ||
                                    formData.assignedOfficer ||
                                    "Assigned Officer"}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap">
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap",
                                  STATUS_STYLES[record.status]?.badge ||
                                    "bg-slate-100 text-slate-600 border border-slate-200"
                                )}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-left pl-6 sm:pl-8 text-[#5c5757] whitespace-nowrap text-[0.65625rem] truncate">
                              {parseOutreachNotes(record.notes).header || "-"}
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
      </div>

      {/* RECORD OUTREACH MODAL (Patterned directly after edit-prospect) */}
      {isTrackOutreachOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
            isOutreachModalExiting ? "modal-backdrop-out" : "modal-backdrop-in"
          )}
          onClick={closeOutreachModal}
        >
          <div
            className={cn(
              "w-full max-w-[800px] bg-white rounded-lg shadow-2xl border border-[#e3dfdf] flex flex-col overflow-visible",
              isOutreachModalExiting ? "modal-content-out" : "modal-content-in"
            )}
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e3dfdf] px-6 py-3.5 bg-white">
              <div>
                <h3 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">
                  Record Outreach
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
                      value={modalStatus}
                      onChange={(val) => setModalStatus(val as EngagementStatusEnum)}
                      options={ENGAGEMENT_STATUS_OPTIONS}
                      placeholder="Select status"
                    />
                  </div>

                  {/* Next Follow-up Date Input */}
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
                    Header <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalHeader}
                    maxLength={OUTREACH_HEADER_MAX}
                    onChange={(e) => setModalHeader(e.target.value)}
                    placeholder="Short summary, e.g. Sent renewal letter"
                    className="w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] hover:border-[#8a8484] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition"
                  />
                  <div className="mt-0.5 text-right text-[0.625rem] text-[#5c5757]">
                    {modalHeader.length} / {OUTREACH_HEADER_MAX}
                  </div>
                </div>

                <div>
                  <label className="block text-[0.6875rem] font-medium text-[#1c1a1a] mb-1">
                    Notes & Action Plan <span className="text-[#b42318]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
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
                    onClick={handleSaveOutreach}
                    disabled={!modalHeader.trim() || !modalNotes.trim() || isSavingOutreach}
                    className="h-[28px] px-4 text-[0.65625rem] font-medium text-white bg-[#6b0f0f] hover:bg-[#520b0b] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition shadow-xs cursor-pointer"
                  >
                    {isSavingOutreach ? "Saving..." : "Save Outreach"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY DETAIL VIEW MODAL (Patterned directly after edit-prospect) */}
      {selectedActivity && (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
            isActivityDetailExiting ? "modal-backdrop-out" : "modal-backdrop-in"
          )}
          onClick={closeActivityDetailModal}
        >
          <div
            className={cn(
              "w-full max-w-[800px] rounded-lg border border-[#e3dfdf] bg-white shadow-2xl p-5 space-y-4",
              isActivityDetailExiting ? "popup-out" : "popup-in"
            )}
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            <div className="flex items-start justify-between border-b border-[#f0eeee] pb-3">
              <div>
                <h3 className="text-[0.875rem] font-bold text-[#1c1a1a]">
                  Activity Log Entry Details
                </h3>
                <p className="text-[0.625rem] text-[#5c5757] mt-0.5">
                  Full recorded details for this touchpoint event
                </p>
              </div>
              <button
                type="button"
                onClick={closeActivityDetailModal}
                className="text-[#757070] hover:text-[#1c1a1a] transition p-1 cursor-pointer"
                aria-label="Close activity detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-[#faf9f9] border border-[#f0eeee]">
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
                    {selectedActivity.authorOfficer === "System" ||
                    selectedActivity.authorOfficer === "System Administrator"
                      ? "System Admin"
                      : selectedActivity.authorOfficer ||
                        formData.assignedOfficer ||
                        "Assigned Officer"}
                  </span>
                </div>
                <div>
                  <span className="block text-[0.59375rem] font-semibold uppercase text-[#5c5757] tracking-wider">
                    Retention Status
                  </span>
                  <span className="mt-0.5 inline-flex items-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap",
                        STATUS_STYLES[selectedActivity.status]?.badge ||
                          "bg-slate-100 text-slate-600 border border-slate-200"
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

              {parseOutreachNotes(selectedActivity.notes).header && (
                <div>
                  <label className="block text-[0.6875rem] font-semibold text-[#1c1a1a] mb-1.5">
                    Header
                  </label>
                  <div className="w-full px-3.5 py-2 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a]">
                    {parseOutreachNotes(selectedActivity.notes).header}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[0.6875rem] font-semibold text-[#1c1a1a] mb-1.5">
                  Full Notes & Action Plan
                </label>
                <div className="w-full min-h-[90px] max-h-[260px] overflow-y-auto p-3.5 text-[0.6875rem] font-normal leading-relaxed rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] whitespace-pre-wrap">
                  {parseOutreachNotes(selectedActivity.notes).body || "No notes recorded for this activity."}
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
    </>
  );
}

export default function EditDonorPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(0);

  return (
    <AppShell navbarPreset={navbarPreset}>
      <Suspense fallback={<ProspectUpdateSkeleton canWrite={false} />}>
        <EditDonorForm />
      </Suspense>
    </AppShell>
  );
}
