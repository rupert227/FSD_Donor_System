"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useUserRole } from "@/lib/use-user-role";
import {
  ProspectDatePicker,
  ProspectSelectMenu,
} from "@/app/donor-conv/prospects/_components";
import { getDonors, type DonorDetail } from "@/lib/donors/actions";
import {
  createTransaction,
  getTransactionById,
  updateTransaction,
} from "@/lib/transactions/actions";
import { isPendingReceiptNo, STAGE_LABELS } from "@/lib/transactions/constants";
import { setPendingToast } from "@/lib/toast";
import { TransactionFormSkeleton } from "./TransactionFormSkeleton";
import type {
  PaymentMethodEnum,
  SourceOfFundsEnum,
  TargetCampaignEnum,
  TreasuryClearanceStatusEnum,
} from "@/types";

const RETURN_URL = "/donor-care/transactions";

// The label is what staff see. The value is what the table stores.
const PAYMENT_METHOD_OPTIONS: { label: string; value: PaymentMethodEnum }[] = [
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Check Payment", value: "Check Payment" },
  { label: "Cash Payment", value: "Cash" },
];

// The clearance stages, in order. The stage isn't picked by hand: it follows
// from what has been filled in (see stageOf).
const CLEARANCE_STAGES: TreasuryClearanceStatusEnum[] = [
  "Receipt Verification",
  "Certificate Creation",
  "Dispatch Preparation",
  "Transaction Finalized",
];

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// The table needs a source of funds, but it comes from the donor, not the form.
// Corporate and Individual map one to one. Community and International donors
// give through more than one source, so these are only the most common match.
const SOURCE_BY_DONOR_TYPE: Record<string, SourceOfFundsEnum> = {
  corporate: "Corporate Partners",
  individual: "Direct (Individual)",
  community: "Church Institutions",
  international: "Community/Association",
};

// Same classes as the Add Donor / Add Prospect forms
const INPUT_CLS =
  "w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition min-w-0";
// Same look as an input, but it can't be typed in or focused like one
const LOCKED_INPUT_CLS =
  "w-full h-[30px] px-2.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none cursor-default min-w-0";
// Slightly greyed so it reads as filled in for you, not typed in
const READONLY_CLS =
  "w-full h-[30px] px-2.5 flex items-center text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-[#f9f8f8] text-[#3f3b3b] min-w-0 truncate cursor-default";
const LABEL_CLS = "block text-[0.65625rem] font-medium text-[#5c5757] mb-0.5";
// Secondary header button, same as Edit Donor's "Record outreach"
const HEADER_BTN_CLS =
  "flex-1 min-[1100px]:flex-initial h-[26px] sm:h-[30px] px-2 sm:px-3 text-[0.59375rem] sm:text-[0.6875rem] font-medium text-[#1c1a1a] bg-white border border-[#d1d5db] rounded-md hover:bg-[#f7f6f6] transition shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap min-w-0";
const SECTION_TITLE_CLS = "text-[0.6875rem] font-semibold text-[#3d0707] mb-1.5";
const GRID_CLS =
  "grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0";

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
}

// Same street / city split the Edit Donor form uses
function splitAddress(raw: string): { street: string; city: string } {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return { street: raw, city: "" };
  if (parts.length === 2) return { street: parts[0], city: parts[1] };
  return {
    street: parts.slice(0, -2).join(", ") || parts[0],
    city: parts.slice(-2).join(", "),
  };
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className={LABEL_CLS}>
        {label}
        {required && <span className="text-[#b42318]"> *</span>}
      </label>
      {children}
    </div>
  );
}

// An empty value shows a hint in placeholder grey, like an empty input does
function ReadOnly({ value, empty = "" }: { value: string; empty?: string }) {
  return (
    <div className={READONLY_CLS} title={value || undefined}>
      {value || <span className="text-gray-400">{empty}</span>}
    </div>
  );
}

function CodToggle({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={`w-full h-[30px] px-2.5 rounded-md border border-[#e3dfdf] flex items-center justify-between transition min-w-0 select-none ${
        disabled
          ? "bg-[#f7f6f6] cursor-not-allowed opacity-70"
          : "bg-white hover:border-[#6b0f0f]/50 cursor-pointer"
      }`}
    >
      <span className="text-[0.6875rem] font-medium text-[#1c1a1a]">
        {checked ? "Certificate requested" : "Not requested"}
      </span>
      <span
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
          checked ? "bg-[#6b0f0f]" : "bg-[#d1d5db]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

interface FormState {
  // Donor (read-only except the name picker on Add)
  donorId: number | null;
  donorName: string;
  donorType: string;
  donorTin: string;
  contactPerson: string;
  titleDesignation: string;
  emailAddress: string;
  mobileNumber: string;
  streetAddress: string;
  cityProvince: string;
  assignedOfficer: string; // shown as c/o (Specialist) on Edit
  // Taken from the donor, never typed
  sourceOfFunds: SourceOfFundsEnum | "";
  campaignName: TargetCampaignEnum | "";
  codRequested: boolean;
  // Contribution details
  amountPledge: string;
  paymentMethod: PaymentMethodEnum | "";
  // Payment received (edit only, once the money arrives)
  amountCollected: string;
  depositBank: string;
  bankReferenceNo: string;
  // Treasury (edit only)
  officialReceiptNo: string;
  taxCertificateNo: string;
  depositClearanceDate: string;
  fulfillmentDate: string;
  // Kept as loaded on edit. A new transaction is dated today when saved.
  transactionDate: string;
  // UI-only for now: the transactions table has no columns for these two.
  codIssuanceDate: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  donorId: null,
  donorName: "",
  donorType: "",
  donorTin: "",
  contactPerson: "",
  titleDesignation: "",
  emailAddress: "",
  mobileNumber: "",
  streetAddress: "",
  cityProvince: "",
  assignedOfficer: "",
  sourceOfFunds: "",
  campaignName: "",
  codRequested: false,
  amountPledge: "",
  paymentMethod: "",
  amountCollected: "",
  depositBank: "",
  bankReferenceNo: "",
  officialReceiptNo: "",
  taxCertificateNo: "",
  depositClearanceDate: "",
  fulfillmentDate: "",
  transactionDate: "",
  codIssuanceDate: "",
  notes: "",
};

const DONOR_FIELDS_CLEARED = {
  donorId: null,
  donorType: "",
  donorTin: "",
  contactPerson: "",
  titleDesignation: "",
  emailAddress: "",
  mobileNumber: "",
  streetAddress: "",
  cityProvince: "",
  assignedOfficer: "",
  sourceOfFunds: "",
  campaignName: "",
  codRequested: false,
} as const;

/**
 * Where a transaction stands, worked out from its fields. Follows the Caritas
 * interviews (07-08, 07-14): Treasury checks the deposit and issues the DR/OR
 * in one step, Finance (Accounting) returns the certificate, then Donor Care
 * dispatches everything.
 * 1. Receipt Verification  -> DR/OR no. (the field is blank while it's a PENDING placeholder)
 * 2. Certificate Creation  -> COD no. + COD issuance date (skipped if none requested)
 *                             (shown to staff as "COD with Finance", see STAGE_LABELS)
 * 3. Dispatch Preparation  -> fulfillment date
 * 4. Transaction Finalized
 * The bank reference no. and deposit clearance date are kept as records, but
 * don't decide the stage.
 */
function stageOf(f: FormState): TreasuryClearanceStatusEnum {
  if (!f.officialReceiptNo.trim()) return "Receipt Verification";
  if (f.codRequested && (!f.taxCertificateNo.trim() || !f.codIssuanceDate)) {
    return "Certificate Creation";
  }
  if (!f.fulfillmentDate) return "Dispatch Preparation";
  return "Transaction Finalized";
}

// What staff need to do to move a transaction on from each stage
const NEXT_STEP: Record<TreasuryClearanceStatusEnum, string> = {
  "Receipt Verification":
    "Next: enter the DR / OR no. once Treasury confirms the deposit and issues the receipt.",
  "Certificate Creation":
    "Next: enter the COD no., then the COD issuance date once Finance returns the certificate.",
  "Dispatch Preparation":
    "Next: send the thank-you letter with the receipt, then mark the transaction as finalized.",
  "Transaction Finalized": "Done: the receipt has been sent to the donor.",
};

export function TransactionForm({ mode }: { mode: "add" | "edit" }) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const { role, canWriteModule, isLoading: roleLoading } = useUserRole();
  const canWrite = canWriteModule("donor-care");
  // Only an administrator can correct a receipt or certificate number once it's saved
  const canCorrectIssuedNumbers = role === "System Administrator";

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [donors, setDonors] = useState<DonorDetail[]>([]);
  const [donorsLoaded, setDonorsLoaded] = useState(false);
  const [donorOpen, setDonorOpen] = useState(false);
  const donorBoxRef = useRef<HTMLDivElement>(null);

  // The numbers as stored. While the receipt no. is still a PENDING placeholder the
  // field stays blank, and the placeholder is kept unless Treasury types the real one.
  // Saved numbers are locked on screen.
  const [stored, setStored] = useState({ receiptNo: "", codNo: "" });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Add mode: load donors for the picker
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    const loadDonors = () =>
      getDonors().then((list) => {
        if (cancelled) return;
        setDonors(list);
        setDonorsLoaded(true);
      });
    loadDonors();
    // A donor added in another tab shows up as soon as staff come back to this one
    window.addEventListener("focus", loadDonors);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadDonors);
    };
  }, [isEdit]);

  // Edit mode: load the transaction
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      const tx = idParam ? await getTransactionById(idParam) : null;
      if (cancelled) return;
      if (!tx) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { street, city } = splitAddress(tx.donor_address);
      setStored({
        receiptNo: tx.official_receipt_no,
        codNo: tx.tax_certificate_no ?? "",
      });
      setForm({
        ...EMPTY_FORM,
        donorId: tx.donor_id,
        donorName: tx.donor_name,
        donorType: titleCase(tx.donor_type),
        donorTin: tx.donor_tin,
        contactPerson: tx.donor_contact_person,
        titleDesignation: tx.donor_title,
        emailAddress: tx.donor_email,
        mobileNumber: tx.donor_contact_number,
        streetAddress: street,
        cityProvince: city,
        assignedOfficer: tx.assigned_officer,
        sourceOfFunds: tx.source_of_funds,
        campaignName: tx.campaign_name,
        codRequested: tx.cod_requested,
        amountPledge: String(tx.amount_pledge),
        paymentMethod: tx.payment_method,
        amountCollected: String(tx.amount_collected),
        depositBank: tx.deposit_bank,
        bankReferenceNo: tx.bank_reference_no,
        officialReceiptNo: isPendingReceiptNo(tx.official_receipt_no)
          ? ""
          : tx.official_receipt_no,
        taxCertificateNo: tx.tax_certificate_no ?? "",
        depositClearanceDate: tx.deposit_clearance_date ?? "",
        fulfillmentDate: tx.fulfillment_date ?? "",
        codIssuanceDate: tx.cod_issuance_date ?? "",
        transactionDate: tx.transaction_date,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, idParam]);

  // Close the donor dropdown when clicking outside it
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (donorBoxRef.current && !donorBoxRef.current.contains(e.target as Node)) {
        setDonorOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const donorMatches = useMemo(() => {
    const q = form.donorName.trim().toLowerCase();
    return donors
      .filter((d) => q && d.donor_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [donors, form.donorName]);

  function pickDonor(d: DonorDetail) {
    const { street, city } = splitAddress(d.delivery_address);
    setForm((prev) => ({
      ...prev,
      donorId: d.id,
      donorName: d.donor_name,
      donorType: titleCase(d.donor_type),
      donorTin: d.tax_id ?? "",
      contactPerson: d.primary_contact_person,
      titleDesignation: d.title_designation ?? "",
      emailAddress: d.email_address,
      mobileNumber: d.mobile_number,
      streetAddress: street,
      cityProvince: city,
      sourceOfFunds: SOURCE_BY_DONOR_TYPE[d.donor_type] ?? "",
      campaignName: d.target_campaign,
      codRequested: Boolean(d.cod_requested),
      assignedOfficer: d.assigned_officer,
    }));
    setDonorOpen(false);
  }

  // Saves the given form values. Used by the Save button and by "Mark as finalized".
  async function save(values: FormState, successTitle?: string) {
    setError(null);

    if (!values.donorId || !values.sourceOfFunds || !values.campaignName) {
      setError(
        "Select a donor from the list. If the donor isn't there yet, add them as a new donor first.",
      );
      return;
    }
    if (!values.paymentMethod) {
      setError("Payment method is required.");
      return;
    }

    setSubmitting(true);
    const cash = values.paymentMethod === "Cash";
    const input = {
      donorId: values.donorId,
      sourceOfFunds: values.sourceOfFunds,
      campaignName: values.campaignName,
      amountPledge: Number(values.amountPledge),
      // Cash is in hand the moment it's given, so the full amount counts as collected.
      // Otherwise nothing is collected yet when a transaction is added.
      amountCollected: cash
        ? Number(values.amountPledge)
        : isEdit
          ? Number(values.amountCollected || 0)
          : 0,
      transactionDate: isEdit ? values.transactionDate : todayISO(),
      paymentMethod: values.paymentMethod,
      // Cash never goes through a bank
      depositBank: cash ? "" : values.depositBank,
      bankReferenceNo: cash ? "" : values.bankReferenceNo,
      // Blank on add: a PENDING placeholder is saved until Treasury issues the real one
      officialReceiptNo: values.officialReceiptNo.trim() || stored.receiptNo,
      codRequested: values.codRequested,
      ...(isEdit && {
        taxCertificateNo: values.taxCertificateNo,
        codIssuanceDate: values.codIssuanceDate || null,
        // The stage always matches what has been filled in
        treasuryClearanceStatus: stageOf(values),
        depositClearanceDate: values.depositClearanceDate || null,
        fulfillmentDate: values.fulfillmentDate || null,
      }),
    };

    const res = isEdit
      ? await updateTransaction(idParam as string, input)
      : await createTransaction(input);

    if (!res.success) {
      setError(res.error || "Failed to save transaction");
      setSubmitting(false);
      return;
    }

    setPendingToast({
      title: successTitle ?? (isEdit ? "Transaction Updated" : "Transaction Created"),
      message: `Transaction for "${values.donorName}" was saved successfully!`,
      type: "success",
    });
    router.push(RETURN_URL);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(form);
  }

  // The receipt went out today: set the fulfillment date and save
  function markAsFinalized() {
    const next = { ...form, fulfillmentDate: form.fulfillmentDate || todayISO() };
    setForm(next);
    save(next, "Transaction Finalized");
  }

  if (loading || roleLoading) {
    return (
      <TransactionFormSkeleton mode={mode} canWrite={roleLoading || canWrite} />
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto w-[75%] max-w-full space-y-3 rounded-lg border border-[#e3dfdf] bg-white p-6">
        <p className="text-[0.8125rem] font-semibold text-[#1c1a1a]">
          Transaction not found
        </p>
        <Link
          href={RETURN_URL}
          className="inline-flex items-center gap-1 text-[0.6875rem] text-[#5c5757] hover:text-[#6b0f0f]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Transactions
        </Link>
      </div>
    );
  }

  const isCash = form.paymentMethod === "Cash";
  const paymentLabel =
    PAYMENT_METHOD_OPTIONS.find((o) => o.value === form.paymentMethod)?.label ?? "—";

  // Where the transaction stands right now (updates live as fields are filled in)
  const stage = stageOf(form);
  const stageIndex = CLEARANCE_STAGES.indexOf(stage);

  // Hint for donor fields that are still empty
  // (Add: an ellipsis, explained in the header. Edit: the donor really has no value.)
  const emptyText = isEdit ? "Not provided" : "…";

  // Issued numbers are locked once saved, so receipts and certificates stay traceable
  const receiptLocked =
    isEdit &&
    !canCorrectIssuedNumbers &&
    Boolean(stored.receiptNo) &&
    !isPendingReceiptNo(stored.receiptNo);
  const codNoLocked = isEdit && !canCorrectIssuedNumbers && Boolean(stored.codNo);

  // Edit-only fields, arranged per payment method in the sections below
  const amountCollectedField = (
    <Field label="Amount Collected">
      <input
        type="number"
        min="0"
        step="0.01"
        value={form.amountCollected}
        onChange={(e) => set("amountCollected", e.target.value)}
        placeholder="0.00"
        className={INPUT_CLS}
      />
    </Field>
  );
  // Cash never goes through a bank: the bank fields stay in place, but can't be typed in
  const depositBankField = (
    <Field label="Deposit Bank">
      <input
        type="text"
        value={isCash ? "" : form.depositBank}
        onChange={(e) => set("depositBank", e.target.value)}
        readOnly={isCash}
        placeholder={isCash ? "Not applicable for cash" : "Enter bank name"}
        className={isCash ? LOCKED_INPUT_CLS : INPUT_CLS}
      />
    </Field>
  );
  // Each date opens up only once its number is in (cash has no bank reference)
  const depositDateOpen = isCash || Boolean(form.bankReferenceNo.trim());
  const codDateOpen = form.codRequested && Boolean(form.taxCertificateNo.trim());
  const fulfillmentDateOpen = Boolean(form.officialReceiptNo.trim());

  const depositClearanceField = (
    <Field label="Deposit Clearance Date">
      <ProspectDatePicker
        value={form.depositClearanceDate}
        onChange={(v) => set("depositClearanceDate", v)}
        placeholder={depositDateOpen ? "Select date" : "Enter the bank reference no. first"}
        disabled={!depositDateOpen}
        direction="up"
        align="right"
      />
    </Field>
  );
  const bankReferenceField = (
    <Field label="Bank Reference No.">
      <input
        type="text"
        value={isCash ? "" : form.bankReferenceNo}
        onChange={(e) => {
          const value = e.target.value;
          // Removing the number also removes the date that depends on it
          setForm((prev) => ({
            ...prev,
            bankReferenceNo: value,
            depositClearanceDate: value.trim() ? prev.depositClearanceDate : "",
          }));
        }}
        readOnly={isCash}
        placeholder={isCash ? "Not applicable for cash" : "Enter bank reference number"}
        className={isCash ? LOCKED_INPUT_CLS : INPUT_CLS}
      />
    </Field>
  );
  // The donor's assigned officer, from the donor profile
  const officerField = (
    <Field label="c/o (Specialist)">
      <ReadOnly value={form.assignedOfficer} empty="Not provided" />
    </Field>
  );
  // Starts from the donor's profile; can be changed for this gift. Switching it
  // off removes the certificate details, since no certificate is needed. It can't
  // be switched off once a certificate number has been issued.
  const codToggleField = (
    <Field label="Tax Certificate (COD)">
      <CodToggle
        checked={form.codRequested}
        disabled={!canWrite || (!isEdit && !form.donorId) || codNoLocked}
        onToggle={() =>
          setForm((prev) =>
            prev.codRequested
              ? { ...prev, codRequested: false, taxCertificateNo: "", codIssuanceDate: "" }
              : { ...prev, codRequested: true },
          )
        }
      />
    </Field>
  );
  // These two look the same at every stage. A saved number (or a certificate
  // nobody asked for) just can't be typed in; the field itself doesn't change.
  const codNotApplicable = !form.codRequested;
  const receiptNoField = (
    <Field label="DR / OR No.">
      <input
        type="text"
        value={form.officialReceiptNo}
        onChange={(e) => {
          const value = e.target.value;
          setForm((prev) => ({
            ...prev,
            officialReceiptNo: value,
            fulfillmentDate: value.trim() ? prev.fulfillmentDate : "",
          }));
        }}
        readOnly={receiptLocked}
        title={receiptLocked ? "Issued receipt numbers can't be changed" : undefined}
        placeholder="Not issued yet"
        className={receiptLocked ? LOCKED_INPUT_CLS : INPUT_CLS}
      />
    </Field>
  );
  const codNoField = (
    <Field label="Tax Certificate (COD) No.">
      <input
        type="text"
        value={form.taxCertificateNo}
        onChange={(e) => {
          const value = e.target.value;
          setForm((prev) => ({
            ...prev,
            taxCertificateNo: value,
            codIssuanceDate: value.trim() ? prev.codIssuanceDate : "",
          }));
        }}
        readOnly={codNoLocked || codNotApplicable}
        title={
          codNoLocked
            ? "Issued certificate numbers can't be changed"
            : codNotApplicable
              ? "No tax certificate was requested for this gift"
              : undefined
        }
        placeholder={form.codRequested ? "Enter COD number" : "Not requested"}
        className={codNoLocked || codNotApplicable ? LOCKED_INPUT_CLS : INPUT_CLS}
      />
    </Field>
  );
  // Cash is received in full on the spot, so its amount is shown, not typed
  const cashReceivedField = (
    <Field label="Amount Received">
      <ReadOnly value={peso.format(Number(form.amountPledge || 0))} />
    </Field>
  );
  const fulfillmentField = (
    <Field label="Fulfillment Date">
      <ProspectDatePicker
        value={form.fulfillmentDate}
        onChange={(v) => set("fulfillmentDate", v)}
        placeholder={fulfillmentDateOpen ? "Select date" : "Enter the DR / OR no. first"}
        disabled={!fulfillmentDateOpen}
        direction="up"
      />
    </Field>
  );
  const codIssuanceField = (
    <Field label="COD Issuance Date">
      <ProspectDatePicker
        value={form.codIssuanceDate}
        onChange={(v) => set("codIssuanceDate", v)}
        placeholder={
          !form.codRequested
            ? "Not requested"
            : codDateOpen
              ? "Select date"
              : "Enter the COD no. first"
        }
        disabled={!codDateOpen}
        direction="up"
        align="right"
      />
    </Field>
  );

  return (
    <div
      className="mx-auto w-[75%] max-w-full min-w-0 space-y-2.5 overflow-visible pb-12"
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      <div className="flex items-center text-[0.6875rem] text-[#5c5757]">
        <Link
          href={RETURN_URL}
          className="flex items-center gap-1 text-[#5c5757] transition-colors hover:text-[#6b0f0f]"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Transactions</span>
        </Link>
      </div>

      {/* TOP RECORD SUMMARY CARD (edit only), same layout as Edit Donor / Edit Prospect */}
      {isEdit && (
        <div className="w-full min-w-0 space-y-2.5 rounded-lg border border-[#e3dfdf] bg-white p-3.5 shadow-xs">
          {/* Title row */}
          <div className="flex flex-col gap-2.5 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
            <div className="min-w-0">
              <div className="text-[0.625rem] text-[#5c5757]">Transaction</div>
              <h1 className="break-words text-[1rem] font-semibold leading-tight text-[#1c1a1a] sm:text-[1.125rem]">
                {form.donorName || "Unnamed Donor"}
              </h1>
            </div>

            <div className="flex w-full flex-row flex-nowrap items-center gap-1.5 sm:gap-2 min-[1100px]:w-auto">
              {canWrite ? (
                <>
                  {/* The letter quotes the DR/OR no. (and encloses the certificate),
                      so it opens at Dispatch Preparation, when both are in */}
                  {stageIndex >= 2 ? (
                    <Link
                      href={`/donor-care/receipts/send-receipt?transactionId=${idParam}`}
                      className={HEADER_BTN_CLS}
                    >
                      Generate thank-you letter
                    </Link>
                  ) : (
                    <span
                      title="Available once the DR / OR no. is in (and the certificate is issued, if requested)"
                      className={`${HEADER_BTN_CLS} cursor-not-allowed opacity-50`}
                    >
                      Generate thank-you letter
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={markAsFinalized}
                    disabled={stage !== "Dispatch Preparation" || submitting}
                    title={
                      stage === "Transaction Finalized"
                        ? "Already finalized"
                        : stage !== "Dispatch Preparation"
                          ? "Available once the DR / OR no. is in (and the certificate is issued, if requested)"
                          : "Set today as the fulfillment date and save"
                    }
                    className="inline-flex h-[26px] min-w-0 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-md border border-[#6b0f0f] bg-white px-2 text-[0.59375rem] font-medium text-[#6b0f0f] shadow-xs transition hover:bg-[#fdf1f1] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[30px] sm:px-3 sm:text-[0.6875rem] min-[1100px]:flex-initial"
                  >
                    Mark as finalized
                  </button>
                </>
              ) : (
                <span className="inline-flex h-[26px] select-none items-center justify-center rounded-md border border-gray-200 bg-gray-100 px-3 text-xs font-medium text-gray-500 sm:h-[30px]">
                  View only
                </span>
              )}
            </div>
          </div>

          {/* Highlights row */}
          <div className="grid grid-cols-1 gap-2.5 border-t border-[#f0eeee] pt-2 min-[1100px]:grid-cols-4">
            {[
              { label: "Target campaign", value: form.campaignName || "—" },
              { label: "Amount", value: peso.format(Number(form.amountPledge || 0)) },
              { label: "Payment method", value: paymentLabel },
              {
                label: "Handoff date",
                value: form.transactionDate ? formatDate(form.transactionDate) : "—",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[0.625rem] font-medium text-[#5c5757]">{item.label}</div>
                <div className="break-words text-[0.6875rem] font-medium text-[#1c1a1a]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Clearance stage path bar */}
          <div className="space-y-1.5 border-t border-[#f0eeee] pt-2">
            <div className="grid grid-cols-1 gap-1.5 min-[1100px]:grid-cols-4">
              {CLEARANCE_STAGES.map((s, idx) => {
                const isCurrent = idx === stageIndex;
                const isPast = idx < stageIndex;
                const skipped = s === "Certificate Creation" && !form.codRequested;
                return (
                  <div
                    key={s}
                    title={skipped ? "No tax certificate was requested" : undefined}
                    className={`pointer-events-none flex h-[28px] select-none items-center justify-center gap-1 rounded-md px-2 text-[0.65625rem] font-medium ${
                      isCurrent
                        ? "bg-[#1e40af] font-semibold text-white shadow-xs"
                        : isPast
                          ? "border border-[#bbf7d0]/60 bg-[#ebf7ef] text-[#166534]"
                          : "bg-[#f0eeee] text-[#5c5757]"
                    }`}
                  >
                    {isPast && <Check className="h-3 w-3 shrink-0 text-[#166534]" />}
                    <span className="whitespace-nowrap">
                      {skipped && !isCurrent ? "No Certificate Needed" : STAGE_LABELS[s]}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[0.625rem] text-[#5c5757]">{NEXT_STEP[stage]}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full min-w-0 max-w-full overflow-visible rounded-lg border border-[#e3dfdf] bg-white shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dfdf] bg-white px-5 py-2.5 sm:px-6">
          <h2 className="text-[0.8125rem] font-semibold text-[#1c1a1a]">
            {isEdit ? "Transaction Details" : "Add New Transaction"}
          </h2>
          <div className="flex flex-col items-end text-[0.625rem] text-[#5c5757]">
            <span>
              Fields marked with <span className="text-[#b42318]">*</span> are mandatory
            </span>
            {!isEdit && (
              <span>
                Fields marked with <span className="text-gray-400">…</span> are auto-filled
              </span>
            )}
          </div>
        </div>

        <div className="w-full min-w-0 space-y-4 p-5 sm:p-6">
          {/* SECTION 1: DONOR BASIC INFORMATION (same as Add Donor) */}
          <div className="w-full min-w-0">
            <h3 className={SECTION_TITLE_CLS}>Donor Basic Information</h3>
            <div className={GRID_CLS}>
              <Field label="Organization / Donor Name" required>
                {isEdit ? (
                  <ReadOnly value={form.donorName} empty={emptyText} />
                ) : (
                  <div ref={donorBoxRef} className="relative">
                    <input
                      type="text"
                      value={form.donorName}
                      onFocus={() => setDonorOpen(true)}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          ...DONOR_FIELDS_CLEARED,
                          donorName: e.target.value,
                        }));
                        setDonorOpen(true);
                      }}
                      placeholder="Search for a donor"
                      autoComplete="off"
                      className={INPUT_CLS}
                    />
                    {/* Suggestions only appear once staff start typing a name */}
                    {donorOpen && form.donorName.trim() && (
                      <ul className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-[#e3dfdf] bg-white py-1 shadow-lg">
                        {!donorsLoaded ? (
                          <li className="px-2.5 py-2 text-[0.6875rem] text-[#5c5757]">
                            Loading donors…
                          </li>
                        ) : donorMatches.length === 0 ? (
                          <li className="space-y-1 px-2.5 py-2 text-[0.6875rem] text-[#5c5757]">
                            <p>{`No donor found for "${form.donorName.trim()}".`}</p>
                            <Link
                              href="/donor-retn/donors/add-donor"
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-[#6b0f0f] hover:underline"
                            >
                              Add a new donor (opens in a new tab)
                            </Link>
                          </li>
                        ) : (
                          donorMatches.map((d) => (
                            <li key={d.id}>
                              <button
                                type="button"
                                onClick={() => pickDonor(d)}
                                className="w-full cursor-pointer px-2.5 py-1.5 text-left text-[0.6875rem] text-[#1c1a1a] hover:bg-[#f7f6f6]"
                              >
                                {d.donor_name}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                    {!donorOpen && form.donorName.trim() && !form.donorId && (
                      <p className="mt-0.5 text-[0.625rem] text-[#b42318]">
                        Pick a donor from the list, or{" "}
                        <Link
                          href="/donor-retn/donors/add-donor"
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline"
                        >
                          add a new donor
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                )}
              </Field>
              <Field label="Donor Type">
                <ReadOnly value={form.donorType} empty={emptyText} />
              </Field>
              <Field label="Tax Identification Number (TIN)">
                <ReadOnly value={form.donorTin} empty={emptyText} />
              </Field>
            </div>
          </div>

          {/* SECTION 2: PRIMARY CONTACT & ADDRESS DETAILS (same as Add Donor) */}
          <div className="w-full min-w-0 border-t border-[#e3dfdf] pt-3">
            <h3 className={SECTION_TITLE_CLS}>Primary Contact & Address Details</h3>
            <div className={GRID_CLS}>
              <Field label="Primary Contact Person">
                <ReadOnly value={form.contactPerson} empty={emptyText} />
              </Field>
              <Field label="Title / Designation">
                <ReadOnly value={form.titleDesignation} empty={emptyText} />
              </Field>
              <Field label="Email Address">
                <ReadOnly value={form.emailAddress} empty={emptyText} />
              </Field>
              <Field label="Mobile / Phone Number">
                <ReadOnly value={form.mobileNumber} empty={emptyText} />
              </Field>
              <Field label="Street Address">
                <ReadOnly value={form.streetAddress} empty={emptyText} />
              </Field>
              <Field label="City & Province">
                <ReadOnly value={form.cityProvince} empty={emptyText} />
              </Field>
            </div>
          </div>

          {/* SECTION 3: CONTRIBUTION DETAILS. Only what is known when a gift is logged. */}
          <div className="w-full min-w-0 border-t border-[#e3dfdf] pt-3">
            <h3 className={SECTION_TITLE_CLS}>Contribution Details</h3>
            <div className={GRID_CLS}>
              <Field label="Amount" required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.amountPledge}
                  onChange={(e) => set("amountPledge", e.target.value)}
                  placeholder="0.00"
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Payment Method" required>
                <ProspectSelectMenu
                  value={form.paymentMethod}
                  onChange={(v) => set("paymentMethod", v as PaymentMethodEnum)}
                  options={PAYMENT_METHOD_OPTIONS}
                  placeholder="Select payment method"
                />
              </Field>
              {/* Add: the COD request. Edit: the deposit bank (the COD request
                  moves down next to the COD no.) */}
              {isEdit ? depositBankField : codToggleField}
            </div>
          </div>

          {/* The edit-only sections below keep one meaning per column, so the
              rows line up: context | number | date. Each number sits right
              beside the date that depends on it. */}

          {/* SECTION 4: PAYMENT RECEIVED (edit only, once the money arrives).
              Same fields for every payment method; for cash the amount is shown,
              not typed, and the bank reference doesn't apply. */}
          {isEdit && (
            <div className="w-full min-w-0 border-t border-[#e3dfdf] pt-3">
              <h3 className={SECTION_TITLE_CLS}>Payment Received</h3>
              <div className={GRID_CLS}>
                {isCash ? cashReceivedField : amountCollectedField}
                {bankReferenceField}
                {depositClearanceField}
              </div>
            </div>
          )}

          {/* SECTION 5: RECEIPT, CERTIFICATE AND COMPLETION (edit only). One row
              for the certificate, then one for the receipt. The clearance stage
              is shown in the header card. */}
          {isEdit && (
            <div className="w-full min-w-0 border-t border-[#e3dfdf] pt-3">
              <h3 className={SECTION_TITLE_CLS}>Receipt, Certificate and Completion</h3>
              <div className={GRID_CLS}>
                {codToggleField}
                {codNoField}
                {codIssuanceField}
                {officerField}
                {receiptNoField}
                {fulfillmentField}
              </div>
            </div>
          )}

          {/* NOTES: full row at the end of the form */}
          <div className="w-full min-w-0">
            <label className={LABEL_CLS}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Enter notes about this transaction..."
              className="w-full h-[64px] px-2.5 py-1.5 text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] transition resize-none min-w-0"
            />
          </div>

          {error && (
            <div
              className="rounded-md border border-red-200 bg-red-50 p-3 text-[0.6875rem] font-medium text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e3dfdf] bg-white px-5 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={() => router.push(RETURN_URL)}
            disabled={submitting}
            className="h-[30px] cursor-pointer rounded-md border border-[#d1d5db] bg-white px-3.5 text-[0.6875rem] font-medium text-[#1c1a1a] shadow-xs transition hover:bg-[#f7f6f6] disabled:opacity-50"
          >
            Cancel
          </button>
          {canWrite ? (
            <button
              type="submit"
              disabled={submitting}
              className="h-[30px] cursor-pointer rounded-md bg-[#6b0f0f] px-4 text-[0.6875rem] font-medium text-white shadow-xs transition hover:bg-[#520b0b] disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Transaction"
                  : "Save Transaction"}
            </button>
          ) : (
            <span className="inline-flex h-[30px] select-none items-center rounded-md border border-gray-200 bg-gray-100 px-3.5 text-[0.6875rem] font-medium text-gray-500">
              View only
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
