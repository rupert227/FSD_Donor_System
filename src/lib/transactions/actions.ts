"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { PENDING_RECEIPT_PREFIX } from "./constants";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  PaymentMethodEnum,
  SourceOfFundsEnum,
  TargetCampaignEnum,
  TreasuryClearanceStatusEnum,
} from "@/types";

/** A transaction row plus the donor fields the form shows read-only. */
export interface TransactionDetail {
  id: number;
  donor_id: number;
  donor_name: string;
  donor_type: string;
  donor_tin: string;
  donor_contact_person: string;
  donor_title: string;
  donor_address: string;
  donor_contact_number: string;
  donor_email: string;
  assigned_officer: string;
  source_of_funds: SourceOfFundsEnum;
  campaign_name: TargetCampaignEnum;
  amount_pledge: number;
  amount_collected: number;
  transaction_date: string;
  payment_method: PaymentMethodEnum;
  deposit_bank: string;
  bank_reference_no: string;
  official_receipt_no: string;
  tax_certificate_no: string | null;
  cod_requested: boolean;
  /** From the certificate_of_donation row for this transaction, if one exists. */
  cod_issuance_date: string | null;
  treasury_clearance_status: TreasuryClearanceStatusEnum;
  deposit_clearance_date: string | null;
  fulfillment_date: string | null;
}

export interface TransactionInput {
  donorId: number;
  sourceOfFunds: SourceOfFundsEnum;
  campaignName: TargetCampaignEnum;
  /** Leave out to keep the stored pledge (edit); on add the form sends the collected amount. */
  amountPledge?: number;
  amountCollected: number;
  transactionDate: string;
  paymentMethod: PaymentMethodEnum;
  depositBank: string;
  bankReferenceNo: string;
  /** Leave blank when Treasury hasn't issued it yet: a PENDING placeholder is saved. */
  officialReceiptNo: string;
  taxCertificateNo?: string | null;
  /** Saved on the certificate_of_donation row, together with the COD no. */
  codIssuanceDate?: string | null;
  codRequested: boolean;
  treasuryClearanceStatus?: TreasuryClearanceStatusEnum;
  depositClearanceDate?: string | null;
  fulfillmentDate?: string | null;
}

type Result<T = undefined> = { success: boolean; data?: T; error?: string };

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key);
}

/** Authenticated server client first, admin client as the fallback. */
async function getSupabase() {
  try {
    const client = await createServerSupabase();
    const { data } = await client.auth.getSession();
    if (data?.session) return client;
  } catch {
    // Session unavailable or running in a cookie-less environment
  }
  return getAdminSupabase();
}

const DONOR_JOIN =
  "donor_profiles(donor_name, donor_type, tax_id, primary_contact_person, title_designation, delivery_address, mobile_number, email_address, assigned_officer)";

interface DbDonor {
  donor_name: string | null;
  donor_type: string | null;
  tax_id: string | null;
  primary_contact_person: string | null;
  title_designation: string | null;
  delivery_address: string | null;
  mobile_number: string | null;
  email_address: string | null;
  assigned_officer: string | null;
}

interface DbRow {
  id: number | string;
  donor_id: number | string;
  donor_profiles: DbDonor | DbDonor[] | null;
  source_of_funds: SourceOfFundsEnum;
  campaign_name: TargetCampaignEnum;
  amount_pledge: number | string | null;
  amount_collected: number | string | null;
  transaction_date: string;
  payment_method: PaymentMethodEnum;
  deposit_bank: string | null;
  bank_reference_no: string | null;
  official_receipt_no: string | null;
  tax_certificate_no: string | null;
  cod_requested: boolean | null;
  treasury_clearance_status: TreasuryClearanceStatusEnum;
  deposit_clearance_date: string | null;
  fulfillment_date: string | null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function mapRow(row: DbRow): TransactionDetail {
  const donor = Array.isArray(row.donor_profiles)
    ? row.donor_profiles[0]
    : row.donor_profiles;
  return {
    id: Number(row.id),
    donor_id: Number(row.donor_id),
    donor_name: donor?.donor_name ?? "",
    donor_type: donor?.donor_type ?? "",
    donor_tin: donor?.tax_id ?? "",
    donor_contact_person: donor?.primary_contact_person ?? "",
    donor_title: donor?.title_designation ?? "",
    donor_address: donor?.delivery_address ?? "",
    donor_contact_number: donor?.mobile_number ?? "",
    donor_email: donor?.email_address ?? "",
    assigned_officer: donor?.assigned_officer ?? "",
    source_of_funds: row.source_of_funds,
    campaign_name: row.campaign_name,
    amount_pledge: Number(row.amount_pledge ?? 0),
    amount_collected: Number(row.amount_collected ?? 0),
    transaction_date: row.transaction_date,
    payment_method: row.payment_method,
    deposit_bank: row.deposit_bank ?? "",
    bank_reference_no: row.bank_reference_no ?? "",
    official_receipt_no: row.official_receipt_no ?? "",
    tax_certificate_no: row.tax_certificate_no ?? null,
    cod_requested: Boolean(row.cod_requested),
    cod_issuance_date: null,
    treasury_clearance_status: row.treasury_clearance_status,
    deposit_clearance_date: row.deposit_clearance_date ?? null,
    fulfillment_date: row.fulfillment_date ?? null,
  };
}

function validate(input: TransactionInput): string | null {
  if (!input.donorId) return "Select a donor from the list";
  if (!input.sourceOfFunds) return "Source of funds is required";
  if (!input.campaignName) return "Campaign is required";
  if (!input.transactionDate) return "Date is required";
  if (!input.paymentMethod) return "Payment method is required";
  if (!(input.amountCollected >= 0)) return "Amount collected must be 0 or more";
  if (input.amountPledge !== undefined && !(input.amountPledge >= 0)) {
    return "Amount pledged must be 0 or more";
  }
  // A requested certificate without a COD no. yet is fine: the transaction
  // simply stays at the Certificate Creation stage until one is entered.

  // Each date needs its number first (cash has no bank reference)
  const cash = input.paymentMethod === "Cash";
  if (input.depositClearanceDate && !cash && !input.bankReferenceNo.trim()) {
    return "Enter the bank reference no. before the deposit clearance date";
  }
  if (input.codIssuanceDate && !input.taxCertificateNo?.trim()) {
    return "Enter the COD no. before the COD issuance date";
  }
  const receiptIssued =
    input.officialReceiptNo.trim() !== "" &&
    !input.officialReceiptNo.startsWith(PENDING_RECEIPT_PREFIX);
  if (input.fulfillmentDate && !receiptIssued) {
    return "Enter the DR / OR no. before the fulfillment date";
  }
  return null;
}

function toPayload(input: TransactionInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    donor_id: input.donorId,
    source_of_funds: input.sourceOfFunds,
    campaign_name: input.campaignName,
    amount_collected: input.amountCollected,
    transaction_date: input.transactionDate,
    payment_method: input.paymentMethod,
    // Not every gift goes through a bank, so these can be blank
    deposit_bank: input.depositBank.trim(),
    bank_reference_no: input.bankReferenceNo.trim(),
    official_receipt_no:
      input.officialReceiptNo.trim() ||
      `${PENDING_RECEIPT_PREFIX}${randomUUID().slice(0, 8).toUpperCase()}`,
    cod_requested: input.codRequested,
  };
  if (input.amountPledge !== undefined) {
    payload.amount_pledge = input.amountPledge;
  }
  // No certificate requested means no certificate number
  if (!input.codRequested) {
    payload.tax_certificate_no = null;
  } else if (input.taxCertificateNo !== undefined) {
    payload.tax_certificate_no = input.taxCertificateNo?.trim() || null;
  }
  if (input.treasuryClearanceStatus !== undefined) {
    payload.treasury_clearance_status = input.treasuryClearanceStatus;
  }
  if (input.depositClearanceDate !== undefined) {
    payload.deposit_clearance_date = input.depositClearanceDate || null;
  }
  if (input.fulfillmentDate !== undefined) {
    payload.fulfillment_date = input.fulfillmentDate || null;
  }
  return payload;
}

/** One row of the Transactions list. */
export interface TransactionListRow {
  id: number;
  donor_id: number;
  donor_name: string;
  /** Lowercase: "corporate", "individual", "community" or "international". */
  donor_type: string;
  campaign_name: TargetCampaignEnum;
  amount_pledge: number;
  amount_collected: number;
  payment_method: PaymentMethodEnum;
  transaction_date: string; // YYYY-MM-DD, shown as the handoff date
  cod_requested: boolean;
  treasury_clearance_status: TreasuryClearanceStatusEnum;
  official_receipt_no: string;
  tax_certificate_no: string | null;
}

interface DbListRow {
  id: number | string;
  donor_id: number | string;
  donor_profiles:
    | { donor_name: string | null; donor_type: string | null }
    | { donor_name: string | null; donor_type: string | null }[]
    | null;
  campaign_name: TargetCampaignEnum;
  amount_pledge: number | string | null;
  amount_collected: number | string | null;
  payment_method: PaymentMethodEnum;
  transaction_date: string;
  cod_requested: boolean | null;
  treasury_clearance_status: TreasuryClearanceStatusEnum;
  official_receipt_no: string | null;
  tax_certificate_no: string | null;
}

/**
 * Every transaction for the list page. Supabase returns at most 1,000 rows per
 * request, so this reads in pages. Returns null if the read fails.
 */
export async function getTransactionList(): Promise<TransactionListRow[] | null> {
  const PAGE = 1000;
  try {
    const supabase = await getSupabase();
    const rows: TransactionListRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, donor_id, campaign_name, amount_pledge, amount_collected, payment_method, transaction_date, cod_requested, treasury_clearance_status, official_receipt_no, tax_certificate_no, donor_profiles(donor_name, donor_type)",
        )
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);

      if (error) {
        console.warn("Error fetching transactions:", error.message);
        return null;
      }
      for (const r of (data ?? []) as unknown as DbListRow[]) {
        const donor = Array.isArray(r.donor_profiles) ? r.donor_profiles[0] : r.donor_profiles;
        rows.push({
          id: Number(r.id),
          donor_id: Number(r.donor_id),
          donor_name: donor?.donor_name ?? "",
          donor_type: (donor?.donor_type ?? "").toLowerCase(),
          campaign_name: r.campaign_name,
          amount_pledge: Number(r.amount_pledge ?? 0),
          amount_collected: Number(r.amount_collected ?? 0),
          payment_method: r.payment_method,
          transaction_date: r.transaction_date,
          cod_requested: Boolean(r.cod_requested),
          treasury_clearance_status: r.treasury_clearance_status,
          official_receipt_no: r.official_receipt_no ?? "",
          tax_certificate_no: r.tax_certificate_no,
        });
      }
      if (!data || data.length < PAGE) break;
    }
    return rows;
  } catch (err) {
    console.error("Exception fetching transactions:", err);
    return null;
  }
}

export async function getTransactionById(
  id: number | string,
): Promise<TransactionDetail | null> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return null;

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select(`*, ${DONOR_JOIN}`)
      .eq("id", numericId)
      .maybeSingle();

    if (error) {
      console.warn("Error fetching transaction:", error.message);
      return null;
    }
    if (!data) return null;

    const tx = mapRow(data as unknown as DbRow);
    const { data: cert } = await supabase
      .from("certificate_of_donation")
      .select("issuance_date")
      .eq("transaction_id", numericId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    tx.cod_issuance_date = cert?.issuance_date ?? null;
    return tx;
  } catch (err) {
    console.error("Exception fetching transaction:", err);
    return null;
  }
}

export async function createTransaction(
  input: TransactionInput,
): Promise<Result<TransactionDetail>> {
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .insert(toPayload(input))
      .select(`*, ${DONOR_JOIN}`)
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "That official receipt no. is already used." };
      }
      console.error("Supabase insert error for transactions:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/donor-care/transactions");
    return { success: true, data: mapRow(data as unknown as DbRow) };
  } catch (err) {
    console.error("createTransaction exception:", err);
    return { success: false, error: errorMessage(err, "Failed to save transaction") };
  }
}

export async function updateTransaction(
  id: number | string,
  input: TransactionInput,
): Promise<Result<TransactionDetail>> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { success: false, error: "Invalid transaction ID" };
  }
  const invalid = validate(input);
  if (invalid) return { success: false, error: invalid };

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .update({ ...toPayload(input), updated_at: new Date().toISOString() })
      .eq("id", numericId)
      .select(`*, ${DONOR_JOIN}`)
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "That official receipt no. is already used." };
      }
      console.error("Supabase update error for transactions:", error.message);
      return { success: false, error: error.message };
    }

    const tx = mapRow(data as unknown as DbRow);

    // Once a COD no. is entered, record the certificate itself so its
    // issuance date is kept (the transactions table has no column for it).
    const certificateNo = input.taxCertificateNo?.trim();
    if (input.codRequested && certificateNo) {
      const certificate = {
        certificate_no: certificateNo,
        transaction_id: numericId,
        donor_id: tx.donor_id,
        certified_amount: tx.amount_collected,
        issuance_date:
          input.codIssuanceDate || new Date().toISOString().slice(0, 10),
      };
      const { data: existing } = await supabase
        .from("certificate_of_donation")
        .select("id")
        .eq("transaction_id", numericId)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error: certError } = existing
        ? await supabase
            .from("certificate_of_donation")
            .update(certificate)
            .eq("id", existing.id)
        : await supabase.from("certificate_of_donation").insert(certificate);

      if (certError) {
        console.error("Supabase certificate_of_donation error:", certError.message);
        return {
          success: false,
          error: `The transaction was saved, but the certificate record wasn't: ${certError.message}`,
        };
      }
      tx.cod_issuance_date = certificate.issuance_date;
    }

    revalidatePath("/donor-care/transactions");
    return { success: true, data: tx };
  } catch (err) {
    console.error("updateTransaction exception:", err);
    return { success: false, error: errorMessage(err, "Failed to update transaction") };
  }
}
