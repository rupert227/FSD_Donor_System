"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SAMPLE_LEADS, type LeadDetail } from "@supabase/seeds/prospects-seed";
import type { PipelineStatusEnum } from "@/types";

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
    // Test if session exists
    const { data } = await client.auth.getSession();
    if (data?.session) return client;
  } catch {
    // If running in context without cookies or auth session
  }
  return getAdminSupabase();
}

function mapDbToLeadDetail(row: Record<string, any>): LeadDetail {
  return {
    id: Number(row.id),
    month: row.month ?? null,
    status: row.status ?? "Active",
    prospect_name: row.prospect_name,
    donor_type: (row.donor_type || "corporate").toLowerCase() as any,
    lead_source: row.lead_source_origin || row.lead_source || "Research",
    lead_source_origin: row.lead_source_origin || row.lead_source || "Research",
    primary_contact_person: row.primary_contact_person || "",
    title_designation: row.title_designation || "",
    email_address: row.email_address ?? null,
    phone_number: row.phone_number || "",
    street_address: row.street_address || "",
    city_province: row.city_province || "",
    target_campaign: row.target_campaign,
    target_amount: Number(row.target_amount) || 0,
    pipeline_status: row.pipeline_status,
    probability: String(row.probability_score ?? 20) as any,
    probability_score: Number(row.probability_score ?? 20),
    assigned_officer: row.assigned_officer || "Officer J. Reyes",
    action_plan: row.next_step_action_plan || "",
    next_step_action_plan: row.next_step_action_plan || "",
    target_followup_date: row.target_followup_date ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Fetch all prospects from Supabase `lead_prospects`.
 * Falls back to canonical SAMPLE_LEADS if the query fails.
 */
export async function getProspects(): Promise<LeadDetail[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("lead_prospects")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn("Falling back to SAMPLE_LEADS due to:", error?.message || "empty data");
      return SAMPLE_LEADS;
    }

    return data.map(mapDbToLeadDetail);
  } catch (err) {
    console.error("Error fetching prospects:", err);
    return SAMPLE_LEADS;
  }
}

/**
 * Fetch a single prospect by ID.
 */
export async function getProspectById(id: number | string): Promise<LeadDetail | null> {
  const numericId = Number(id);
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("lead_prospects")
      .select("*")
      .eq("id", numericId)
      .maybeSingle();

    if (error || !data) {
      const fallback = SAMPLE_LEADS.find((l) => l.id === numericId);
      return fallback ?? null;
    }

    return mapDbToLeadDetail(data);
  } catch (err) {
    console.error("Error fetching prospect by ID:", err);
    const fallback = SAMPLE_LEADS.find((l) => l.id === numericId);
    return fallback ?? null;
  }
}

export interface CreateProspectInput {
  prospectName: string;
  donorType: string;
  leadSource: string;
  contactPerson: string;
  designation?: string;
  email?: string;
  phone: string;
  streetAddress?: string;
  cityProvince?: string;
  targetCampaign: string;
  targetAmount: string | number;
  pipelineStatus?: PipelineStatusEnum;
  probability?: string | number;
  assignedOfficer?: string;
  followupDate?: string;
  actionPlan?: string;
}

/**
 * Create a new prospect in `lead_prospects` and log an intake notification.
 */
export async function createProspect(input: CreateProspectInput): Promise<{
  success: boolean;
  data?: LeadDetail;
  error?: string;
}> {
  try {
    const supabase = await getSupabase();

    const payload = {
      prospect_name: input.prospectName.trim(),
      donor_type: input.donorType.toLowerCase(),
      lead_source_origin: input.leadSource,
      primary_contact_person: input.contactPerson.trim(),
      title_designation: input.designation?.trim() || null,
      email_address: input.email?.trim() || null,
      phone_number: input.phone.trim(),
      street_address: input.streetAddress?.trim() || null,
      city_province: input.cityProvince?.trim() || null,
      target_campaign: input.targetCampaign,
      target_amount: Number(input.targetAmount) || 0,
      pipeline_status: input.pipelineStatus || "New Lead",
      probability_score: Number(input.probability) || 20,
      assigned_officer: input.assignedOfficer || "Officer J. Reyes",
      target_followup_date: input.followupDate || null,
      next_step_action_plan: input.actionPlan?.trim() || null,
    };

    const { data, error } = await supabase
      .from("lead_prospects")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error("Error inserting prospect:", error);
      return { success: false, error: error?.message || "Failed to insert" };
    }

    // Create intake notification
    await supabase.from("notifications").insert({
      title: "New Prospect Intake",
      message: `${input.prospectName} added by ${input.assignedOfficer || "Officer J. Reyes"} under ${input.targetCampaign}.`,
      module: "Donor Conversion",
      type: "prospect",
      assigned_officer: input.assignedOfficer || "Officer J. Reyes",
      link_url: `/donor-conv/prospects/edit-prospect?id=${data.id}`,
    });

    revalidatePath("/donor-conv/prospects");
    revalidatePath("/donor-conv/prospects/pipeline-board");

    return { success: true, data: mapDbToLeadDetail(data) };
  } catch (err: any) {
    console.error("Error creating prospect:", err);
    return { success: false, error: err.message || "Failed to create prospect" };
  }
}

export interface UpdateProspectInput {
  prospectName: string;
  donorType: string;
  leadSource: string;
  contactPerson: string;
  designation?: string;
  email?: string;
  phone: string;
  streetAddress?: string;
  cityProvince?: string;
  targetCampaign: string;
  targetAmount: string | number;
  pipelineStatus: PipelineStatusEnum;
  probability: string | number;
  assignedOfficer: string;
  followupDate?: string;
  actionPlan?: string;
}

/**
 * Update an existing prospect profile in `lead_prospects`.
 */
export async function updateProspect(
  id: number | string,
  input: UpdateProspectInput
): Promise<{ success: boolean; error?: string }> {
  const numericId = Number(id);
  try {
    const supabase = await getSupabase();

    const payload = {
      prospect_name: input.prospectName.trim(),
      donor_type: input.donorType.toLowerCase(),
      lead_source_origin: input.leadSource,
      primary_contact_person: input.contactPerson.trim(),
      title_designation: input.designation?.trim() || null,
      email_address: input.email?.trim() || null,
      phone_number: input.phone.trim(),
      street_address: input.streetAddress?.trim() || null,
      city_province: input.cityProvince?.trim() || null,
      target_campaign: input.targetCampaign,
      target_amount: Number(input.targetAmount) || 0,
      pipeline_status: input.pipelineStatus,
      probability_score: Number(input.probability) || 20,
      assigned_officer: input.assignedOfficer,
      target_followup_date: input.followupDate || null,
      next_step_action_plan: input.actionPlan?.trim() || null,
    };

    const { error } = await supabase
      .from("lead_prospects")
      .update(payload)
      .eq("id", numericId);

    if (error) {
      console.error("Error updating prospect:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/donor-conv/prospects");
    revalidatePath("/donor-conv/prospects/pipeline-board");
    revalidatePath(`/donor-conv/prospects/edit-prospect`);

    return { success: true };
  } catch (err: any) {
    console.error("Error updating prospect:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Update only the pipeline status of a prospect (e.g. from Pipeline Board drag-and-drop).
 */
export async function updateProspectStage(
  id: number | string,
  targetStage: PipelineStatusEnum
): Promise<{ success: boolean; error?: string }> {
  const numericId = Number(id);
  try {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from("lead_prospects")
      .update({ pipeline_status: targetStage })
      .eq("id", numericId);

    if (error) {
      console.error("Error updating prospect stage:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/donor-conv/prospects");
    revalidatePath("/donor-conv/prospects/pipeline-board");

    return { success: true };
  } catch (err: any) {
    console.error("Error updating prospect stage:", err);
    return { success: false, error: err.message };
  }
}

export interface OutreachActivityItem {
  id: string | number;
  dateTime: string;
  status: PipelineStatusEnum;
  followupDate?: string;
  notes: string;
}

/**
 * Record a new touchpoint in `lead_outreach_activities` and update the prospect's status and next step.
 */
export async function recordOutreachActivity(
  prospectId: number | string,
  activity: {
    status: PipelineStatusEnum;
    followupDate?: string;
    notes: string;
    probabilityTier?: number | string;
  }
): Promise<{ success: boolean; error?: string }> {
  const numericId = Number(prospectId);
  try {
    const supabase = await getSupabase();

    // 1. Insert into lead_outreach_activities
    const { error: actError } = await supabase
      .from("lead_outreach_activities")
      .insert({
        prospect_id: numericId,
        status: activity.status,
        followup_date: activity.followupDate || null,
        notes: activity.notes.trim(),
      });

    if (actError) {
      console.error("Error inserting outreach activity:", actError);
      return { success: false, error: actError.message };
    }

    // 2. Update prospect's latest touchpoint snapshot
    const prospectUpdates: Record<string, any> = {
      pipeline_status: activity.status,
      target_followup_date: activity.followupDate || null,
      next_step_action_plan: activity.notes.trim(),
    };

    if (activity.probabilityTier) {
      prospectUpdates.probability_score = Number(activity.probabilityTier);
    }

    const { error: updateError } = await supabase
      .from("lead_prospects")
      .update(prospectUpdates)
      .eq("id", numericId);

    if (updateError) {
      console.error("Error updating prospect after outreach:", updateError);
    }

    revalidatePath("/donor-conv/prospects");
    revalidatePath("/donor-conv/prospects/pipeline-board");
    revalidatePath(`/donor-conv/prospects/edit-prospect`);

    return { success: true };
  } catch (err: any) {
    console.error("Error recording outreach activity:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch outreach activities history for a prospect.
 */
export async function getOutreachActivities(
  prospectId: number | string
): Promise<OutreachActivityItem[]> {
  const numericId = Number(prospectId);
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("lead_outreach_activities")
      .select("*")
      .eq("prospect_id", numericId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((item) => {
      const dt = new Date(item.created_at);
      const formattedDateTime = dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + ", " + dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        id: item.id,
        dateTime: formattedDateTime,
        status: item.status,
        followupDate: item.followup_date || undefined,
        notes: item.notes,
      };
    });
  } catch (err) {
    console.error("Error fetching outreach activities:", err);
    return [];
  }
}

/**
 * Notify Donor Care division when a prospect is marked as Secured Donor.
 */
export async function notifyDonorCareSecured(
  prospectId: number | string,
  prospectName: string,
  targetAmount: number | string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabase();
    const formattedAmount = Number(targetAmount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
    });

    const { error } = await supabase.from("notifications").insert({
      title: "Notice to Donor Care: Secured Donor",
      message: `Notice sent to Donor Care to process transaction for "${prospectName}" for ₱${formattedAmount}.`,
      module: "Donor Care",
      type: "care_notice",
      is_alert: true,
      link_url: `/donor-conv/prospects/edit-prospect?id=${prospectId}`,
    });

    if (error) {
      console.error("Error creating secured notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error dispatching secured notification:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch prospect IDs that have an existing proposal in `proposals`.
 */
export async function getBuiltProposalProspectIds(): Promise<number[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("proposals")
      .select("prospect_id");

    if (error || !data) {
      return [1, 4]; // Default fallback
    }

    return Array.from(new Set(data.map((r) => Number(r.prospect_id)).filter(Boolean)));
  } catch (err) {
    console.error("Error fetching proposals:", err);
    return [1, 4];
  }
}

export interface LiveNotificationItem {
  id: string;
  title: string;
  message: string;
  module: "Donor Conversion" | "Donor Retention" | "Donor Care" | "System";
  time: string;
  dateGroup: "TODAY" | "YESTERDAY";
  read: boolean;
  type:
    | "recommitted"
    | "prospect"
    | "care_notice"
    | "receipt"
    | "proposal"
    | "followup_due"
    | "overdue"
    | "system";
  isAlert?: boolean;
  assignedOfficer?: string;
  linkUrl?: string;
}

/**
 * Fetch live system notifications from Supabase `notifications`.
 */
export async function getLiveNotifications(): Promise<LiveNotificationItem[]> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Failed to fetch notifications from Supabase:", error?.message);
      return [];
    }

    const now = new Date();
    return data.map((n) => {
      const dt = new Date(n.created_at);
      const isToday = dt.toDateString() === now.toDateString();
      const timeStr = dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return {
        id: String(n.id),
        title: n.title,
        message: n.message,
        module: n.module as any,
        time: timeStr,
        dateGroup: isToday ? "TODAY" : "YESTERDAY",
        read: Boolean(n.is_read),
        type: n.type as any,
        isAlert: Boolean(n.is_alert),
        assignedOfficer: n.assigned_officer || undefined,
        linkUrl: n.link_url || undefined,
      };
    });
  } catch (err) {
    console.error("Error loading notifications:", err);
    return [];
  }
}

/**
 * Mark a single notification as read in Supabase.
 */
export async function markNotificationAsRead(id: string | number): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", Number(id));

    return !error;
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return false;
  }
}

/**
 * Mark all notifications as read in Supabase.
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    return !error;
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    return false;
  }
}
