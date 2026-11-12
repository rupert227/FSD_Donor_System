"use server";

import { createClient } from "@/lib/supabase/server";
import { proposalFileName } from "@/lib/letter";
import { getMailMode, sendMail, type MailMode } from "@/lib/mail";
import { buildProposalPdf } from "@/lib/proposal-pdf";
import type { DeliveryPreferenceEnum } from "@/types";

const DELIVERY_OPTIONS: DeliveryPreferenceEnum[] = [
  "Email PDF (Softcopy)",
  "Postal Mail",
  "Hand Delivered",
];

export type SendProposalInput = {
  proposalId: number;
  delivery: DeliveryPreferenceEnum;
  // Only used for Email PDF (Softcopy).
  subject: string;
  body: string;
};

export type SendProposalResult =
  | {
      ok: true;
      delivery: DeliveryPreferenceEnum;
      // For email: how it was handled (see MAIL_MODE in src/lib/mail.ts) and where it went.
      mailMode: MailMode | null;
      deliveredTo: string | null;
    }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Dispatches a saved proposal. For email it attaches the PDF and sends the message, and only
// when that works does it mark the proposal Sent (and move the prospect to Proposal Sent)
// through the send_proposal function. Row level security decides who may do any of this.
export async function sendProposal(
  input: SendProposalInput,
): Promise<SendProposalResult> {
  if (
    !Number.isInteger(input.proposalId) ||
    !DELIVERY_OPTIONS.includes(input.delivery)
  ) {
    return { ok: false, error: "That request was not valid." };
  }
  const isEmail = input.delivery === "Email PDF (Softcopy)";
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (isEmail && (!subject || !body)) {
    return { ok: false, error: "Enter a subject and a message for the email." };
  }
  if (isEmail && subject.length > 200) {
    return {
      ok: false,
      error: "The subject is too long (200 characters at most).",
    };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user)
    return { ok: false, error: "You are signed out. Sign in again." };

  // Hidden by row level security for roles that may not use proposals.
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, prospect_id, status, letter_text, letter_date")
    .eq("id", input.proposalId)
    .maybeSingle();
  if (!proposal) return { ok: false, error: "That proposal was not found." };
  if (proposal.status !== "Generated") {
    return { ok: false, error: "That proposal has already been sent." };
  }

  let mailMode: MailMode | null = null;
  let deliveredTo: string | null = null;

  if (isEmail) {
    const { data: prospect } = await supabase
      .from("lead_prospects")
      .select("prospect_name, email_address")
      .eq("id", proposal.prospect_id)
      .maybeSingle();
    const recipient = prospect?.email_address?.trim() ?? "";
    if (!EMAIL_PATTERN.test(recipient)) {
      return {
        ok: false,
        error:
          "This prospect has no valid email address. Add one with Edit on record, or choose another delivery option.",
      };
    }

    // Replies go to the officer who sends, not to the shared sending account.
    const { data: account } = await supabase
      .from("user_accounts")
      .select("email_address")
      .eq("auth_user_id", auth.user.id)
      .maybeSingle();

    try {
      const pdf = await buildProposalPdf(proposal.letter_text);
      const result = await sendMail({
        to: recipient,
        subject,
        text: body,
        replyTo: account?.email_address ?? undefined,
        attachments: [
          {
            filename: proposalFileName(
              prospect!.prospect_name,
              proposal.letter_date,
            ),
            content: pdf,
            contentType: "application/pdf",
          },
        ],
      });
      mailMode = result.mode;
      deliveredTo = result.deliveredTo;
    } catch (error) {
      console.error("Sending the proposal email failed:", error);
      return {
        ok: false,
        error:
          "The email could not be sent, so the proposal was not marked as sent. Try again.",
      };
    }
  }

  const { error } = await supabase.rpc("send_proposal", {
    p_proposal_id: input.proposalId,
    p_delivery: input.delivery,
    p_email_subject: isEmail ? subject : null,
    p_email_body: isEmail ? body : null,
  });
  if (error) {
    console.error("send_proposal failed:", error);
    return {
      ok: false,
      error: isEmail
        ? "The email was sent, but the proposal could not be marked as sent. Tell the team before trying again."
        : "The proposal could not be marked as sent.",
    };
  }

  return { ok: true, delivery: input.delivery, mailMode, deliveredTo };
}

// Which mode the server is in, so the Send screen can say when nothing will really be delivered.
export async function getMailModeForScreen(): Promise<MailMode> {
  return getMailMode();
}
