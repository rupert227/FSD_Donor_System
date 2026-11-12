"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Paperclip, Send, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LetterPreview } from "@/components/proposals/LetterPreview";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { proposalFileName } from "@/lib/letter";
import { isValidEmail } from "@/lib/proposals-data";
import { buildEmailBody, buildEmailSubject } from "@/lib/proposal-email";
import type { DeliveryPreferenceEnum } from "@/types";
import { getMailModeForScreen, sendProposal } from "./actions";
import SendProposalSkeleton from "./skeleton";

const pageName = "Send Proposal";

const DELIVERY_OPTIONS: DeliveryPreferenceEnum[] = [
  "Email PDF (Softcopy)",
  "Postal Mail",
  "Hand Delivered",
];

const fieldClass =
  "border-dropdown-stroke rounded-dropdown bg-surface-white w-full border px-3 text-sm";
const secondaryButton =
  "border-border-strong hover:bg-surface-soft-hover inline-flex h-8 cursor-pointer items-center rounded-[6px] border bg-white px-3 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50";

type LoadedProposal = {
  id: number;
  status: "Generated" | "Sent";
  letter_text: string;
  letter_date: string;
  delivery_preference: DeliveryPreferenceEnum | null;
  dispatched_at: string | null;
  email_subject: string | null;
  email_body: string | null;
  lead_prospects: {
    prospect_name: string;
    primary_contact_person: string;
    email_address: string | null;
    target_campaign: string;
  };
};

type Sender = { name: string | null; title: string | null };

function SendProposalContent() {
  const router = useRouter();
  const idParam = useSearchParams().get("proposalId");

  const [load, setLoad] = useState<
    | { status: "loading" }
    | { status: "missing" }
    | { status: "error"; message: string }
    | { status: "ready"; proposal: LoadedProposal; sender: Sender }
  >({ status: "loading" });

  // Which mode the server is in (nothing is delivered unless it is "send").
  const [mailMode, setMailMode] = useState<string | null>(null);

  const [delivery, setDelivery] = useState<DeliveryPreferenceEnum>(
    "Email PDF (Softcopy)",
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [template, setTemplate] = useState({ subject: "", body: "" });
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProposal() {
      if (!idParam || !/^\d+$/.test(idParam)) {
        setLoad({ status: "missing" });
        return;
      }
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      const [proposalResult, accountResult] = await Promise.all([
        supabase
          .from("proposals")
          .select(
            `id, status, letter_text, letter_date, delivery_preference, dispatched_at,
             email_subject, email_body,
             lead_prospects ( prospect_name, primary_contact_person, email_address, target_campaign )`,
          )
          .eq("id", idParam)
          .maybeSingle(),
        supabase
          .from("user_accounts")
          .select("officer_profiles ( full_name, job_title )")
          .eq("auth_user_id", auth.user?.id ?? "")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (proposalResult.error) {
        setLoad({ status: "error", message: proposalResult.error.message });
        return;
      }
      if (!proposalResult.data) {
        setLoad({ status: "missing" });
        return;
      }
      const proposal = proposalResult.data as unknown as LoadedProposal;
      const profile = (
        accountResult.data as {
          officer_profiles: {
            full_name: string;
            job_title: string | null;
          } | null;
        } | null
      )?.officer_profiles;
      const sender: Sender = {
        name: profile?.full_name ?? null,
        title: profile?.job_title ?? null,
      };

      // The starting message; the officer can change all of it.
      const start = {
        subject: buildEmailSubject(proposal.lead_prospects.prospect_name),
        body: buildEmailBody({
          contact: proposal.lead_prospects.primary_contact_person,
          organization: proposal.lead_prospects.prospect_name,
          campaign: proposal.lead_prospects.target_campaign,
          senderName: sender.name ?? "[your name]",
          senderTitle: sender.title,
        }),
      };
      setTemplate(start);
      setSubject(start.subject);
      setBody(start.body);
      setLoad({ status: "ready", proposal, sender });
    }
    loadProposal();
    getMailModeForScreen().then((mode) => {
      if (!cancelled) setMailMode(mode);
    });
    return () => {
      cancelled = true;
    };
  }, [idParam]);

  if (load.status === "loading") {
    return <p className="mt-5 text-sm">Loading the proposal...</p>;
  }
  if (load.status !== "ready") {
    return (
      <div role="alert" className="mt-5 space-y-3 text-sm">
        <p>
          {load.status === "error"
            ? `Could not load the proposal: ${load.message}`
            : "That proposal was not found. Generate one from the proposal builder first."}
        </p>
        <Link
          href="/donor-conv/proposals"
          className="text-brand-primary cursor-pointer underline"
        >
          Back to the proposal builder
        </Link>
      </div>
    );
  }

  const { proposal } = load;
  const prospect = proposal.lead_prospects;
  const alreadySent = proposal.status === "Sent";
  const isEmail = delivery === "Email PDF (Softcopy)";
  const fileName = proposalFileName(
    prospect.prospect_name,
    proposal.letter_date,
  );
  // Same check the server runs before sending, so the screen never offers a send that will fail.
  const hasEmail = isValidEmail(prospect.email_address);
  const realDelivery = mailMode === "send";

  async function handleSend() {
    setSending(true);
    setError(null);
    const result = await sendProposal({
      proposalId: proposal.id,
      delivery,
      subject,
      body,
    });
    setSending(false);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToast(
      result.mailMode && result.mailMode !== "send"
        ? "Proposal marked as sent (test mode: no email reached the prospect)."
        : "Proposal sent.",
    );
    setTimeout(() => router.push("/donor-conv/proposals"), 1200);
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)]">
      {/* Left card: recipient, delivery and email */}
      <div className="border-border-soft bg-surface-white flex flex-col self-start overflow-hidden rounded-lg border">
        <div className="space-y-4 px-5 py-4">
          <dl className="grid grid-cols-1 gap-y-3">
            <div>
              <dt className="text-text-secondary text-[13px] font-medium">
                Prospect
              </dt>
              <dd className="text-sm break-words">{prospect.prospect_name}</dd>
            </div>
            <div>
              <dt className="text-text-secondary text-[13px] font-medium">
                Contact
              </dt>
              <dd className="text-sm break-words">
                {prospect.primary_contact_person}
              </dd>
            </div>
            <div>
              <dt className="text-text-secondary text-[13px] font-medium">
                Email
              </dt>
              <dd className="text-sm break-words">
                {prospect.email_address || "No email on record"}
              </dd>
            </div>
          </dl>

          {alreadySent ? (
            <div
              role="status"
              className="border-border-soft rounded-[6px] border bg-white px-3 py-2.5 text-sm"
            >
              <p className="font-medium">This proposal has been sent.</p>
              <p className="text-text-secondary mt-1 text-[13px]">
                {proposal.delivery_preference}
                {proposal.dispatched_at
                  ? `, ${new Date(proposal.dispatched_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`
                  : ""}
              </p>
              {proposal.email_subject && (
                <p className="mt-2 text-[13px]">
                  <span className="font-medium">Subject:</span>{" "}
                  {proposal.email_subject}
                </p>
              )}
              {proposal.email_body && (
                <p className="mt-1 text-[13px] whitespace-pre-line">
                  {proposal.email_body}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="delivery" className="text-[13px] font-medium">
                  Delivery
                </label>
                <select
                  id="delivery"
                  value={delivery}
                  onChange={(e) =>
                    setDelivery(e.target.value as DeliveryPreferenceEnum)
                  }
                  className={`${fieldClass} h-9 cursor-pointer`}
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {isEmail ? (
                <>
                  {!hasEmail && (
                    <p
                      role="alert"
                      className="border-border-warning bg-surface-amber text-text-warning flex gap-2 rounded-[6px] border px-3 py-2 text-[13px]"
                    >
                      <TriangleAlert
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      This prospect has no valid email address. Add one with Edit
                      on record, or choose another delivery option.
                    </p>
                  )}
                  {mailMode && !realDelivery && (
                    <p
                      role="note"
                      className="border-border-soft bg-surface-soft rounded-[6px] border px-3 py-2 text-[13px]"
                    >
                      Test mode: the email is built but not delivered to the
                      prospect.
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="subject"
                      className="text-[13px] font-medium"
                    >
                      Subject
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      maxLength={200}
                      onChange={(e) => setSubject(e.target.value)}
                      className={`${fieldClass} h-9`}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="message"
                      className="text-[13px] font-medium"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={12}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className={`${fieldClass} resize-y py-2 leading-relaxed`}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSubject(template.subject);
                          setBody(template.body);
                        }}
                        className={secondaryButton}
                      >
                        Reset to template
                      </button>
                      <button
                        type="button"
                        onClick={() => setBody("")}
                        className={secondaryButton}
                      >
                        Clear message
                      </button>
                    </div>
                  </div>
                  <p className="text-text-secondary flex items-center gap-2 text-[13px]">
                    <Paperclip className="size-4 shrink-0" aria-hidden="true" />
                    <span>
                      Attached: <span className="font-medium">{fileName}</span>
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-text-secondary text-[13px]">
                  Nothing is emailed. This records the proposal as sent by{" "}
                  {delivery.toLowerCase()}.
                </p>
              )}
            </>
          )}
        </div>

        {!alreadySent && (
          <div className="border-border-soft flex flex-col gap-3 border-t px-5 py-3">
            {error && (
              <p role="alert" className="text-brand-danger text-[13px]">
                {error}
              </p>
            )}
            {confirming && (
              <p role="alert" className="text-[13px]">
                {isEmail
                  ? `Send this email with the PDF to ${prospect.email_address}? This cannot be undone.`
                  : `Mark this proposal as sent by ${delivery.toLowerCase()}? This cannot be undone.`}
              </p>
            )}
            <div className="flex justify-end gap-2">
              {confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={sending}
                  className={secondaryButton}
                >
                  Back
                </button>
              ) : (
                <Link
                  href="/donor-conv/proposals"
                  className="border-border-strong hover:bg-surface-soft-hover inline-flex h-8 cursor-pointer items-center rounded-[6px] border bg-white px-3 text-[13px] font-medium"
                >
                  Cancel
                </Link>
              )}
              <button
                type="button"
                disabled={sending || (isEmail && !hasEmail)}
                onClick={() =>
                  confirming ? handleSend() : setConfirming(true)
                }
                className="bg-brand-primary text-surface-white inline-flex h-8 cursor-pointer items-center gap-2 rounded-[6px] px-3 text-[13px] font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden="true" />
                {sending
                  ? "Sending..."
                  : confirming
                    ? "Confirm and send"
                    : "Send proposal"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right card: the saved letter, as it was generated */}
      <div className="border-border-soft bg-surface-white min-w-0 self-start overflow-hidden rounded-lg border">
        <LetterPreview text={proposal.letter_text} />
      </div>

      {toast && (
        <div
          role="status"
          className="bg-surface-white border-border-strong fixed right-6 bottom-6 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function SendProposalPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(1);
  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-surface-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
            <FileText className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-[1.375rem] leading-7 font-semibold">Send proposal</h1>
        </div>

        <Suspense fallback={<SendProposalSkeleton />}>
          <SendProposalContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
