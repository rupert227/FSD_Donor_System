"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isPendingReceiptNo } from "@/lib/transactions/constants";
import type {
  DonorTenureEnum,
  DonorTypeEnum,
  EngagementStatusEnum,
  TargetCampaignEnum,
} from "@/types";

export interface DonorDetail {
  id: number;
  donor_name: string;
  donor_type: DonorTypeEnum;
  primary_contact_person: string;
  title_designation?: string | null;
  email_address: string;
  mobile_number: string;
  tax_id?: string | null;
  delivery_address: string;
  target_campaign: TargetCampaignEnum;
  engagement_status: EngagementStatusEnum;
  donor_tenure: DonorTenureEnum;
  assigned_officer: string;
  converted_from_lead_id?: number | null;
  cod_requested?: boolean;
  last_contact_date: string | null;
  target_followup_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDonorInput {
  donorName: string;
  donorType: string;
  primaryContactPerson: string;
  titleDesignation?: string;
  emailAddress: string;
  mobileNumber: string;
  taxId?: string;
  deliveryAddress?: string;
  streetAddress?: string;
  cityProvince?: string;
  taxCertificateRequested?: boolean;
  targetCampaign: TargetCampaignEnum;
  engagementStatus?: EngagementStatusEnum;
  donorTenure?: DonorTenureEnum;
  assignedOfficer: string;
  lastContactDate?: string | null;
  targetFollowupDate?: string | null;
}

export interface UpdateDonorInput {
  donorName?: string;
  donorType?: string;
  primaryContactPerson?: string;
  titleDesignation?: string;
  emailAddress?: string;
  mobileNumber?: string;
  taxId?: string;
  deliveryAddress?: string;
  streetAddress?: string;
  cityProvince?: string;
  taxCertificateRequested?: boolean;
  targetCampaign?: TargetCampaignEnum;
  engagementStatus?: EngagementStatusEnum;
  donorTenure?: DonorTenureEnum;
  assignedOfficer?: string;
  lastContactDate?: string | null;
  targetFollowupDate?: string | null;
}

export interface DonorRenewalItem {
  id: number;
  officialReceiptNo: string;
  campaignName: string;
  amountPledged: number;
  amountCollected: number;
  transactionDate: string;
  paymentMethod: string;
  clearanceStatus: string;
}

export interface DonorOutreachItem {
  id: string;
  dateTime: string;
  status: EngagementStatusEnum;
  followupDate?: string;
  notes: string;
  authorOfficer?: string;
}

/**
 * Creates an admin Supabase client using the service role key for
 * reliable server-side persistence when session cookies are unavailable.
 */
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, serviceKey);
}

/**
 * Get Supabase client - uses authenticated server client first, falling back to admin client.
 */
async function getSupabase() {
  try {
    const client = await createServerSupabase();
    const { data } = await client.auth.getSession();
    if (data?.session) return client;
  } catch {
    // Session unavailable or running in cookie-less environment
  }
  return getAdminSupabase();
}

function mapDbToDonorDetail(row: Record<string, any>): DonorDetail {
  return {
    id: Number(row.id),
    donor_name: row.donor_name,
    donor_type: (row.donor_type || "corporate").toLowerCase() as DonorTypeEnum,
    primary_contact_person: row.primary_contact_person || "",
    title_designation: row.title_designation || "",
    email_address: row.email_address || "",
    mobile_number: row.mobile_number || "",
    tax_id: row.tax_id || "",
    delivery_address: row.delivery_address || "",
    target_campaign: row.target_campaign || "Health and Disaster Relief",
    engagement_status: row.engagement_status || "Uncontacted",
    donor_tenure: row.donor_tenure || "New Renewal",
    assigned_officer: row.assigned_officer || "Officer J. Reyes",
    cod_requested: Boolean(row.cod_requested || false),
    last_contact_date: row.last_contact_date ?? null,
    target_followup_date: row.target_followup_date ?? null,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

/**
 * Fetch all donors from Supabase `donor_profiles`.
 * Strictly returns database records or an empty array.
 */
export async function getDonors(): Promise<DonorDetail[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("donor_profiles")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data) {
      console.warn("Failed to fetch donor_profiles from Supabase:", error?.message);
      return [];
    }

    return data.map(mapDbToDonorDetail);
  } catch (err) {
    console.error("Error fetching donors from Supabase:", err);
    return [];
  }
}

/**
 * Fetch a single donor by ID from Supabase `donor_profiles`.
 * Strictly returns database record or null.
 */
export async function getDonorById(id: number | string): Promise<DonorDetail | null> {
  const numericId = Number(id);
  if (isNaN(numericId)) return null;

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("donor_profiles")
      .select("*")
      .eq("id", numericId)
      .maybeSingle();

    if (data && !error) {
      return mapDbToDonorDetail(data);
    }
    if (error) {
      console.warn("Error fetching donor by ID from Supabase:", error.message);
    }
  } catch (err) {
    console.error("Exception fetching donor by ID from Supabase:", err);
  }

  return null;
}

/**
 * Create a new donor profile.
 */
export async function createDonor(
  input: CreateDonorInput
): Promise<{ success: boolean; data?: DonorDetail; error?: string }> {
  try {
    if (!input.donorName?.trim()) {
      return { success: false, error: "Donor Name is required" };
    }
    if (!input.primaryContactPerson?.trim()) {
      return { success: false, error: "Primary Contact Person is required" };
    }

    const resolvedAddress =
      input.deliveryAddress?.trim() ||
      [input.streetAddress?.trim(), input.cityProvince?.trim()]
        .filter(Boolean)
        .join(", ") ||
      "";

    if (!resolvedAddress) {
      return { success: false, error: "Delivery address is required" };
    }

    const rawType = (input.donorType || "corporate").toLowerCase();
    const titleType = rawType.charAt(0).toUpperCase() + rawType.slice(1);

    const payload: Record<string, any> = {
      donor_name: input.donorName.trim(),
      donor_type: titleType,
      primary_contact_person: input.primaryContactPerson.trim(),
      title_designation: input.titleDesignation?.trim() || null,
      email_address: input.emailAddress.trim(),
      mobile_number: input.mobileNumber.trim(),
      tax_id: input.taxId?.trim() || null,
      delivery_address: resolvedAddress,
      target_campaign: input.targetCampaign,
      engagement_status: input.engagementStatus || "Uncontacted",
      donor_tenure: input.donorTenure || "New Renewal",
      assigned_officer: input.assignedOfficer || "Officer J. Reyes",
      last_contact_date: input.lastContactDate || null,
      target_followup_date: input.targetFollowupDate || null,
    };

    if (input.taxCertificateRequested !== undefined) {
      payload.cod_requested = input.taxCertificateRequested;
    }

    const supabase = await getSupabase();
    let insertRes = await supabase
      .from("donor_profiles")
      .insert(payload)
      .select()
      .single();

    if (insertRes.error && insertRes.error.message.includes("donor_type_enum")) {
      payload.donor_type = rawType;
      insertRes = await supabase
        .from("donor_profiles")
        .insert(payload)
        .select()
        .single();
    }

    if (insertRes.error && insertRes.error.message.includes("cod_requested")) {
      delete payload.cod_requested;
      insertRes = await supabase
        .from("donor_profiles")
        .insert(payload)
        .select()
        .single();
    }

    const { data, error } = insertRes;

    if (error) {
      console.error("Supabase insert error for donor_profiles:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/donor-retn/donors");
    return { success: true, data: mapDbToDonorDetail(data) };
  } catch (err: any) {
    console.error("createDonor exception:", err);
    return { success: false, error: err.message || "Failed to create donor profile" };
  }
}

/**
 * Update an existing donor profile.
 */
export async function updateDonor(
  id: number | string,
  input: UpdateDonorInput
): Promise<{ success: boolean; data?: DonorDetail; error?: string }> {
  const numericId = Number(id);
  if (isNaN(numericId)) {
    return { success: false, error: "Invalid donor ID" };
  }

  try {
    const payload: Record<string, any> = {};
    if (input.donorName !== undefined) payload.donor_name = input.donorName.trim();
    if (input.donorType !== undefined) {
      const rawType = input.donorType.toLowerCase();
      payload.donor_type = rawType.charAt(0).toUpperCase() + rawType.slice(1);
    }
    if (input.primaryContactPerson !== undefined)
      payload.primary_contact_person = input.primaryContactPerson.trim();
    if (input.titleDesignation !== undefined)
      payload.title_designation = input.titleDesignation.trim() || null;
    if (input.emailAddress !== undefined)
      payload.email_address = input.emailAddress.trim();
    if (input.mobileNumber !== undefined)
      payload.mobile_number = input.mobileNumber.trim();
    if (input.taxId !== undefined) payload.tax_id = input.taxId.trim() || null;
    if (input.deliveryAddress !== undefined || input.streetAddress !== undefined || input.cityProvince !== undefined) {
      const addr =
        input.deliveryAddress?.trim() ||
        [input.streetAddress?.trim(), input.cityProvince?.trim()]
          .filter(Boolean)
          .join(", ");
      if (addr) payload.delivery_address = addr;
    }
    if (input.taxCertificateRequested !== undefined) {
      payload.cod_requested = input.taxCertificateRequested;
    }
    if (input.targetCampaign !== undefined)
      payload.target_campaign = input.targetCampaign;
    if (input.engagementStatus !== undefined)
      payload.engagement_status = input.engagementStatus;
    if (input.donorTenure !== undefined)
      payload.donor_tenure = input.donorTenure;
    if (input.assignedOfficer !== undefined)
      payload.assigned_officer = input.assignedOfficer;
    if (input.lastContactDate !== undefined)
      payload.last_contact_date = input.lastContactDate || null;
    if (input.targetFollowupDate !== undefined)
      payload.target_followup_date = input.targetFollowupDate || null;

    const supabase = await getSupabase();
    let updateRes = await supabase
      .from("donor_profiles")
      .update(payload)
      .eq("id", numericId)
      .select()
      .maybeSingle();

    if (updateRes.error && updateRes.error.message.includes("donor_type_enum") && payload.donor_type) {
      payload.donor_type = payload.donor_type.toLowerCase();
      updateRes = await supabase
        .from("donor_profiles")
        .update(payload)
        .eq("id", numericId)
        .select()
        .maybeSingle();
    }

    if (updateRes.error && updateRes.error.message.includes("cod_requested")) {
      delete payload.cod_requested;
      updateRes = await supabase
        .from("donor_profiles")
        .update(payload)
        .eq("id", numericId)
        .select()
        .maybeSingle();
    }

    const { data, error } = updateRes;

    if (error) {
      console.error("Supabase update error for donor_profiles:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/donor-retn/donors");
    return {
      success: true,
      data: data ? mapDbToDonorDetail(data) : undefined,
    };
  } catch (err: any) {
    console.error("updateDonor exception:", err);
    return { success: false, error: err.message || "Failed to update donor profile" };
  }
}

/**
 * Fetch past giving and renewal transactions for a donor strictly from Supabase `transactions`.
 */
export async function getDonorRenewals(
  donorId: number | string
): Promise<DonorRenewalItem[]> {
  const numericId = Number(donorId);
  if (isNaN(numericId)) return [];

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("donor_id", numericId)
      .order("transaction_date", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((t: any) => ({
        id: Number(t.id),
        // Blank until Treasury issues the real number (never a made-up one)
        officialReceiptNo: isPendingReceiptNo(t.official_receipt_no)
          ? ""
          : (t.official_receipt_no ?? ""),
        campaignName: t.campaign_name || "General Fund",
        amountPledged: Number(t.amount_pledge) || 0,
        amountCollected: Number(t.amount_collected) || 0,
        transactionDate: t.transaction_date || "",
        paymentMethod: t.payment_method || "Bank Transfer",
        clearanceStatus: t.treasury_clearance_status || "Transaction Finalized",
      }));
    }
  } catch (err) {
    console.warn("Could not fetch transactions for donor from DB:", err);
  }

  return [];
}

/**
 * Fetch outreach touchpoints history for a donor strictly from Supabase `donor_outreach_activities`.
 */
export async function getDonorOutreachActivities(
  donorId: number | string
): Promise<DonorOutreachItem[]> {
  const numericId = Number(donorId);
  if (isNaN(numericId)) return [];

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("donor_outreach_activities")
      .select("*")
      .eq("donor_id", numericId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => {
        const dt = new Date(item.created_at);
        const formattedDateTime =
          dt.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          }) +
          ", " +
          dt.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

        return {
          id: String(item.id),
          dateTime: formattedDateTime,
          status: item.status,
          followupDate: item.followup_date || undefined,
          notes: item.notes || "",
          authorOfficer: item.author_officer || "System Admin",
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch outreach activities from DB:", err);
  }

  return [];
}

/**
 * Record a new outreach touchpoint for a donor.
 * Inserts a persistent record into `donor_outreach_activities` and updates `donor_profiles`.
 */
export async function recordDonorOutreach(
  donorId: number | string,
  data: {
    status: EngagementStatusEnum;
    followupDate?: string;
    notes: string;
    authorOfficer?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const numericId = Number(donorId);
  if (isNaN(numericId)) {
    return { success: false, error: "Invalid donor ID" };
  }

  try {
    const supabase = await getSupabase();
    const today = new Date().toISOString().split("T")[0];

    // 1. Insert into persistent donor_outreach_activities table
    try {
      await supabase.from("donor_outreach_activities").insert({
        donor_id: numericId,
        status: data.status,
        followup_date: data.followupDate || null,
        notes: data.notes || "",
        author_officer: data.authorOfficer || "System Admin",
      });
    } catch (insertErr) {
      console.warn("Failed to insert into donor_outreach_activities:", insertErr);
    }

    // 2. Update donor_profiles status and followup dates
    await updateDonor(numericId, {
      engagementStatus: data.status,
      targetFollowupDate: data.followupDate || null,
      lastContactDate: today,
    });

    revalidatePath("/donor-retn/donors");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to record outreach" };
  }
}
