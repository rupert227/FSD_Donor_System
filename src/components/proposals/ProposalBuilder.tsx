"use client";

import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  Minus,
  RotateCcw,
  Send,
  TriangleAlert,
} from "lucide-react";
import { cn } from "cn";
import { sampleTemplates } from "@/lib/sample-data";
import { createClient } from "@/lib/supabase/client";
import {
  isValidEmail,
  PROSPECT_SELECT,
  toBuilderProspect,
} from "@/lib/proposals-data";
import type { BuilderProspect, Signatory } from "@/types/proposal";
import { showToast } from "@/lib/toast";
import {
  buildLetterText,
  findLeftoverPrompts,
  formatLetterDate,
  formatPeso,
  proposalFileName,
  todayIso,
} from "@/lib/letter";
import { LetterPreview } from "./LetterPreview";
import { ProspectSearchBar } from "./ProspectSearchBar";
import {
  ProspectDatePicker,
  ProspectSelectMenu,
} from "@/app/donor-conv/prospects/_components";

// Nothing to subscribe to: today's date only needs reading once in the browser.
const subscribeToNothing = () => () => {};

// Saved data, shown as a label above a value with no box so it never looks editable.
type ChecklistStatus = "ok" | "warn" | "unknown";

// One row of the "Before you generate" checklist: a status icon, a label, the
// value on the right, and optional extra content (like the prompts) below.
function ChecklistRow({
  status,
  label,
  value,
  children,
}: {
  status: ChecklistStatus;
  label: string;
  value: string;
  children?: ReactNode;
}) {
  const Icon =
    status === "ok" ? Check : status === "warn" ? TriangleAlert : Minus;
  return (
    <li className="py-2">
      <div className="flex items-start gap-2 text-[13px]">
        <Icon
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-4 shrink-0",
            status === "warn" ? "text-icon-warning" : "text-text-secondary",
          )}
        />
        <span className="text-text-secondary w-20 shrink-0">{label}</span>
        <span
          className={cn(
            "min-w-0 flex-1 break-words",
            status === "warn" && "font-medium",
          )}
        >
          {value}
        </span>
      </div>
      {children && <div className="pl-6">{children}</div>}
    </li>
  );
}


function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-secondary text-[13px] font-medium">{label}</dt>
      <dd className="text-sm break-words">{value || "—"}</dd>
    </div>
  );
}

const toggleClass =
  "border-border-strong hover:bg-surface-soft-hover inline-flex h-8 cursor-pointer items-center rounded-[6px] border px-3 text-[13px] font-medium";

type ProposalBuilderProps = {
  // Prospects at "Outreach Started" or later, each with its linked officer.
  prospects: BuilderProspect[];
  // Profiles marked is_signatory.
  signatories: Signatory[];
  // Prospect to select first (from ?prospectId= or ?prospect=), if any.
  initialProspectId?: number;
};

const DEFAULT_SIGNATORY: Signatory = {
  id: "anton-pascual",
  name: "Fr. Anton C.T. Pascual",
  title: "Executive Director",
};

// Without prospects there is nothing to build a letter from,
// so say that instead of showing an empty form.
export function ProposalBuilder(props: ProposalBuilderProps) {
  if (props.prospects.length === 0) {
    return (
      <p className="border-border-soft bg-surface-white mt-5 rounded-lg border px-5 py-4 text-sm">
        No prospects are ready for a proposal yet. A prospect needs to be at Outreach Started or later.
      </p>
    );
  }
  return <ProposalBuilderForm {...props} />;
}

function ProposalBuilderForm({
  prospects: initialProspects,
  signatories,
  initialProspectId,
}: ProposalBuilderProps) {
  // The prospect list from the server. The selected prospect is re-read when the
  // officer comes back to this tab, so a fix made through "Edit on record" shows up.
  const [prospects, setProspects] = useState(initialProspects);
  const [prospectId, setProspectId] = useState<number | null>(
    initialProspectId && prospects.some((p) => p.id === initialProspectId)
      ? initialProspectId
      : null,
  );
  const [templateId, setTemplateId] = useState(sampleTemplates[0].id);
  // Saving state for Generate: whether a save is running, the last error, and the saved id.
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedProposalId, setSavedProposalId] = useState<number | null>(null);
  // Existing proposal in database for the currently selected prospect
  const [existingProposal, setExistingProposal] = useState<{
    id: number;
    status: string;
    letter_date: string;
    letter_text?: string;
    template_id?: string;
    created_at: string;
  } | null>(null);

  // Sync prospectId if initialProspectId changes
  useEffect(() => {
    if (initialProspectId && prospects.some((p) => p.id === initialProspectId)) {
      setProspectId(initialProspectId);
    }
  }, [initialProspectId, prospects]);

  // Load existing proposal for the active prospect
  useEffect(() => {
    if (!prospectId) {
      setExistingProposal(null);
      setEditedText(null);
      return;
    }
    let isCancelled = false;
    async function loadExistingProposal() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("proposals")
          .select("id, status, letter_date, letter_text, template_id, created_at")
          .eq("prospect_id", prospectId)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!isCancelled) {
          if (data) {
            setExistingProposal(data);
            if (data.letter_text) {
              setEditedText(data.letter_text);
            }
            if (data.letter_date) {
              setPickedDate(data.letter_date);
            }
            if (
              data.template_id &&
              sampleTemplates.some((t) => t.id === data.template_id)
            ) {
              setTemplateId(data.template_id);
            }
          } else {
            setExistingProposal(null);
            setEditedText(null);
          }
        }
      } catch (err) {
        console.error("Error loading existing proposal for prospect:", err);
      }
    }
    loadExistingProposal();
    return () => {
      isCancelled = true;
    };
  }, [prospectId, savedProposalId]);
  // The date the officer picked. null means "use today's date".
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  // Today's date on the user's clock. The server has no way to know it, so the
  // server render uses "" and the browser fills it in right after loading.
  const today = useSyncExternalStore(subscribeToNothing, todayIso, () => "");
  const date = pickedDate ?? today;

  // "preview" shows the letter; "edit" shows a text box to change its wording.
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  // What the officer typed. null means "no edits, use the generated text".
  const [editedText, setEditedText] = useState<string | null>(null);
  // Reported by LetterPreview; only known while the preview is on screen.
  const [runsPastOnePage, setRunsPastOnePage] = useState(false);
  // Whether the "check before generating" warning is open.
  const [showWarning, setShowWarning] = useState(false);
  // An in-page question shown instead of the browser's confirm dialog: either
  // "replace my edits" (a choice was changed) or "leave" (Cancel was pressed).
  const [confirmAsk, setConfirmAsk] = useState<
    { kind: "replace"; apply: () => void } | { kind: "leave" } | null
  >(null);
  // Whether the less important record fields (title, address, prepared by) show.
  const [showAllRecord, setShowAllRecord] = useState(false);
  // A prompt the officer clicked in the checklist; the text box selects it.
  const [promptToSelect, setPromptToSelect] = useState<string | null>(null);

  useEffect(() => {
    if (!prospectId) return;
    async function refreshSelectedProspect() {
      if (document.visibilityState !== "visible") return;
      const { data } = await createClient()
        .from("lead_prospects")
        .select(PROSPECT_SELECT)
        .eq("id", prospectId)
        .maybeSingle();
      if (!data) return;
      const fresh = toBuilderProspect(data);
      setProspects((list) =>
        list.map((p) =>
          p.id === fresh.id && JSON.stringify(p) !== JSON.stringify(fresh)
            ? fresh
            : p,
        ),
      );
    }
    window.addEventListener("focus", refreshSelectedProspect);
    document.addEventListener("visibilitychange", refreshSelectedProspect);
    return () => {
      window.removeEventListener("focus", refreshSelectedProspect);
      document.removeEventListener("visibilitychange", refreshSelectedProspect);
    };
  }, [prospectId]);

  // Look up the full records from the chosen ids.
  const prospect = prospectId ? prospects.find((p) => p.id === prospectId) : undefined;
  const template =
    sampleTemplates.find((t) => t.id === templateId) ?? sampleTemplates[0];
  const signatory =
    signatories.find(
      (s) =>
        s.name.toLowerCase().includes("anton") ||
        s.name.toLowerCase().includes("pascual"),
    ) ??
    signatories[0] ??
    DEFAULT_SIGNATORY;

  // The officer assigned to this prospect (their title and email go in the letter).
  const officer = prospect?.officer;

  // Derived from the choices above on every render (not stored in state).
  const generatedText = prospect && officer
    ? buildLetterText(
        prospect,
        template,
        signatory,
        officer,
        // An empty date (cleared by the officer) shows as a prompt to fill in.
        (date && formatLetterDate(date)) || "[date]",
      )
    : "";
  // Shown in the preview toolbar, like "Proposal_Ayala_Foundation_2026.pdf".
  const fileName = prospect
    ? proposalFileName(prospect.prospect_name, date)
    : "Proposal.pdf";

  // The browser suggests the page title as the name when saving a PDF, so use
  // the proposal's file name while printing (also for Ctrl+P), then put the
  // original title back. Chrome adds ".pdf" itself.
  useEffect(() => {
    let originalTitle = document.title;
    const useFileName = () => {
      originalTitle = document.title;
      document.title = fileName.replace(/\.pdf$/, "");
    };
    const restoreTitle = () => {
      document.title = originalTitle;
    };
    window.addEventListener("beforeprint", useFileName);
    window.addEventListener("afterprint", restoreTitle);
    return () => {
      window.removeEventListener("beforeprint", useFileName);
      window.removeEventListener("afterprint", restoreTitle);
    };
  }, [fileName]);

  // The officer's edits win; otherwise show the generated text.
  const letterText = editedText ?? generatedText;
  const hasEdits = editedText !== null && editedText !== generatedText;

  // Things to warn about before generating. The length is only known in Preview.
  const leftoverPrompts = findLeftoverPrompts(letterText);
  const tooLong = mode === "preview" && runsPastOnePage;
  const hasWarnings = leftoverPrompts.length > 0 || tooLong;

  // The checklist above Generate. Computed on every render from the current
  // letter, never stored, so it can't go stale after another edit.
  const lengthStatus: ChecklistStatus =
    mode === "edit" ? "unknown" : tooLong ? "warn" : "ok";
  const lengthValue =
    mode === "edit" ? "Checked in Preview" : tooLong ? "Over 1 page" : "1 page";
  const promptStatus: ChecklistStatus =
    leftoverPrompts.length === 0 ? "ok" : "warn";
  const promptValue =
    leftoverPrompts.length === 0
      ? "None left"
      : `${leftoverPrompts.length} left to fill`;

  // A prospect without a usable email cannot receive the PDF by email. This only
  // flags it: Postal Mail and Hand Delivered still work, so Generate stays enabled.
  const hasEmail = prospect ? isValidEmail(prospect.email_address) : false;

  // Saves the letter as a new "Generated" proposal. The pipeline status does
  // not change here: it moves to "Proposal Sent" when the letter is sent.
  async function generate() {
    if (!prospect) return;
    setShowWarning(false);
    setSaveError(null);
    setSavedProposalId(null);
    if (!date) {
      setSaveError("Pick a letter date before generating.");
      return;
    }
    setSaving(true);
    const { data, error } = await createClient()
      .from("proposals")
      .insert({
        prospect_id: prospect.id,
        template_id: template.id,
        letter_date: date,
        signatory_name: signatory.name,
        signatory_title: signatory.title,
        letter_text: letterText,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setSaveError(`The proposal was not saved: ${error.message}`);
      showToast({
        title: "Save Failed",
        message: error.message || "Could not save proposal document.",
        type: "error",
      });
      return;
    }
    setSavedProposalId(data.id);
    showToast({
      title: "Proposal Generated",
      message: `Proposal saved with status 'Generated' for ${prospect.prospect_name}.`,
      type: "success",
    });
  }

  // With warnings, show them first and let the officer decide.
  function handleGenerate() {
    if (hasWarnings) {
      setShowWarning(true);
      return;
    }
    generate();
  }

  // Applies a dropdown change. If the officer has edited the letter, ask first
  // (in the page), because the letter is rebuilt and their edits would be lost.
  function applyChoice(apply: () => void) {
    apply();
    setEditedText(null);
    setShowWarning(false);
    setConfirmAsk(null);
  }

  function changeChoice(apply: () => void) {
    if (hasEdits) {
      setConfirmAsk({ kind: "replace", apply });
      return;
    }
    applyChoice(apply);
  }

  const activeProposalId = savedProposalId ?? existingProposal?.id ?? null;
  const proposalStatus = savedProposalId
    ? "Generated"
    : existingProposal?.status ?? null;

  return (
    <div className="focus-scope ui-motion mt-5 space-y-4 print:mt-0 print:block">
      {/* Top Banner when a Proposal already exists in database or was just generated */}
      {activeProposalId && (
        <div className="no-print flex items-center justify-between gap-4 rounded-lg border border-[#e3dfdf] bg-white px-4 py-3 shadow-xs">
          <div>
            <h2 className="text-xs font-semibold text-[#1c1a1a]">
              {proposalStatus === "Sent" ? "Proposal Sent" : "Proposal Ready"}
            </h2>
            <p className="text-[11px] text-[#5c5757] mt-0.5">
              {proposalStatus === "Sent"
                ? `A proposal was previously dispatched to ${prospect?.prospect_name || "this prospect"}.`
                : `A proposal document has been generated for ${prospect?.prospect_name || "this prospect"}. You can proceed to send it.`}
            </p>
          </div>
          <Link
            href={`/donor-conv/proposals/send-proposal?proposalId=${activeProposalId}`}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[#6b0f0f] px-3.5 text-xs font-medium text-white hover:bg-[#520b0b] transition shadow-xs cursor-pointer"
          >
            <Send className="size-3.5" aria-hidden="true" />
            <span>Send Proposal</span>
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[440px_minmax(0,1fr)] xl:grid-cols-[460px_minmax(0,1fr)] print:mt-0 print:block">
        {/* Left card: inputs and actions (not printed) */}
        <div className="no-print border-border-soft bg-surface-white flex flex-col self-start overflow-hidden rounded-lg border">
          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prospect" className="text-[13px] font-medium text-[#1c1a1a]">
                Prospect{" "}
                <span aria-hidden="true" className="text-brand-danger">
                  *
                </span>
              </label>
              <ProspectSearchBar
                prospects={prospects}
                selectedProspectId={prospectId}
                onSelect={(id) => changeChoice(() => setProspectId(id))}
                onClear={() => changeChoice(() => setProspectId(null))}
                placeholder="Search prospect by name or campaign..."
                inputClassName="h-9"
              />
              <p id="prospect-help" className="text-text-secondary text-xs">
                Select any active prospect to build or review their proposal letter.
              </p>
            </div>

          {/* Template and date share a row to keep the form short. The date
              starts as today and can be changed (for example when the letter
              will go out on another day). */}
          <div className="grid grid-cols-[minmax(0,1fr)_148px] gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="template" className="text-[13px] font-medium">
                Template{" "}
                <span aria-hidden="true" className="text-brand-danger">
                  *
                </span>
              </label>
              <ProspectSelectMenu
                value={templateId}
                onChange={(val) => {
                  changeChoice(() => setTemplateId(val));
                }}
                options={sampleTemplates.map((t) => ({
                  label: t.name,
                  value: t.id,
                }))}
                direction="down"
                triggerClassName="h-9 text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="proposal-date"
                className="text-[13px] font-medium"
              >
                Proposal date
              </label>
              <ProspectDatePicker
                value={date}
                onChange={(val) => {
                  changeChoice(() => setPickedDate(val || null));
                }}
                placeholder="Select date"
                direction="down"
                align="right"
                triggerClassName="h-9 text-[13px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                From the prospect record
              </h2>
              {/* Opens the team's edit page in a new tab so the builder keeps its state.
                  When the officer returns, the prospect is re-read (see the effect above).
                  A letter the officer already edited keeps its text; "Reset to template" rebuilds it. */}
              {prospect && (
                <Link
                  href={`/donor-conv/prospects/edit-prospect?id=${prospect.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary -my-1.5 ml-auto inline-flex h-8 items-center text-sm font-medium hover:underline"
                >
                  Edit on record
                </Link>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
              <ReadOnlyField
                label="Recipient"
                value={prospect?.primary_contact_person || "—"}
              />
              <ReadOnlyField
                label="Organization"
                value={prospect?.prospect_name || "—"}
              />
              <ReadOnlyField
                label="Campaign"
                value={prospect?.target_campaign || "—"}
              />
              <ReadOnlyField
                label="Requested amount"
                value={prospect ? formatPeso(prospect.target_amount) : "—"}
              />
            </dl>
            {/* Slides open: a grid row animating from 0fr to 1fr is the way to
                animate to "auto" height. inert keeps the hidden fields out of
                the tab order and away from screen readers while closed. */}
            <div
              inert={!showAllRecord}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                showAllRecord
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <dl className="grid min-h-0 grid-cols-2 gap-x-5 gap-y-4 overflow-hidden">
                <ReadOnlyField
                  label="Title"
                  value={prospect?.title_designation || "—"}
                />
                <ReadOnlyField
                  label="Address"
                  value={
                    prospect
                      ? [prospect.street_address, prospect.city_province]
                          .filter(Boolean)
                          .join(", ") || "—"
                      : "—"
                  }
                />
                <ReadOnlyField
                  label="Prepared by"
                  value={officer?.full_name || prospect?.assigned_officer || "—"}
                />
              </dl>
            </div>
            <button
              type="button"
              aria-expanded={showAllRecord}
              onClick={() => setShowAllRecord((open) => !open)}
              className="text-brand-primary -my-1.5 inline-flex h-8 cursor-pointer items-center gap-1 self-start text-sm font-medium hover:underline"
            >
              {showAllRecord ? "Show less" : "Show all"}
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  showAllRecord && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
          </div>


          {/* Readiness: what the letter looks like right now, before Generate. */}
          <div className="border-border-soft rounded-[6px] border bg-white px-3 py-2.5">
            <h2 className="text-text-secondary mb-0.5 text-xs font-semibold">
              Before you generate
            </h2>
            <ul className="divide-border-soft divide-y">
              <ChecklistRow
                status={lengthStatus}
                label="Length"
                value={lengthValue}
              />
              <ChecklistRow
                status={prospect ? (hasEmail ? "ok" : "warn") : "unknown"}
                label="Email"
                value={
                  prospect
                    ? hasEmail
                      ? prospect.email_address!
                      : "None on file"
                    : "—"
                }
              >
                {prospect && !hasEmail && (
                  <p className="mt-1 text-xs leading-relaxed">
                    The PDF cannot be emailed to this prospect.{" "}
                    <Link
                      href={`/donor-conv/prospects/edit-prospect?id=${prospect.id}`}
                      className="cursor-pointer underline"
                    >
                      Add an email on the record
                    </Link>{" "}
                    or send it by post or by hand.
                  </p>
                )}
              </ChecklistRow>
              <ChecklistRow
                status={promptStatus}
                label="Prompts"
                value={promptValue}
              >
                {leftoverPrompts.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {leftoverPrompts.map((prompt) => (
                      <li key={prompt}>
                        <button
                          type="button"
                          title="Fill this in the letter"
                          onClick={() => {
                            setMode("edit");
                            setPromptToSelect(prompt);
                          }}
                          className="border-border-warning bg-surface-amber hover:bg-surface-warning-strong block w-full cursor-pointer rounded-[4px] border px-2.5 py-1.5 text-left text-xs leading-relaxed break-words"
                        >
                          {prompt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </ChecklistRow>
            </ul>
          </div>

          {confirmAsk && (
            <div
              role="alertdialog"
              aria-label="Confirm"
              aria-describedby="confirm-message"
              onKeyDown={(e) => {
                if (e.key === "Escape") setConfirmAsk(null);
              }}
              className="animate-in fade-in-0 slide-in-from-top-1 border-border-warning bg-surface-amber text-text-warning rounded-[6px] border p-3 text-sm break-words duration-200"
            >
              <p id="confirm-message" className="font-medium">
                {confirmAsk.kind === "replace"
                  ? "Changing this will replace your edits to the letter."
                  : "Leave without generating? Your edits to the letter will be lost."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {/* The safe choice gets focus first, so Enter never discards work. */}
                <button
                  type="button"
                  autoFocus
                  onClick={() => setConfirmAsk(null)}
                  className={toggleClass}
                >
                  {confirmAsk.kind === "replace"
                    ? "Keep my edits"
                    : "Keep editing"}
                </button>
                {confirmAsk.kind === "replace" ? (
                  <button
                    type="button"
                    onClick={() => applyChoice(confirmAsk.apply)}
                    className={toggleClass}
                  >
                    Replace my edits
                  </button>
                ) : (
                  <Link href="/donor-conv/prospects" className={toggleClass}>
                    Discard and leave
                  </Link>
                )}
              </div>
            </div>
          )}

          {showWarning && hasWarnings && (
            <div
              role="alert"
              className="animate-in fade-in-0 slide-in-from-top-1 border-border-warning bg-surface-amber text-text-warning rounded-[6px] border p-3 text-sm break-words duration-200"
            >
              {leftoverPrompts.length > 0 && (
                <p className="font-medium">
                  {leftoverPrompts.length === 1
                    ? "1 prompt still needs to be filled in."
                    : `${leftoverPrompts.length} prompts still need to be filled in.`}
                </p>
              )}
              {tooLong && (
                <p className={leftoverPrompts.length > 0 ? "mt-2" : undefined}>
                  {leftoverPrompts.length > 0
                    ? "It also runs past one page."
                    : "This letter runs past one page."}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWarning(false);
                    setMode("edit");
                    // Same as the checklist chip: land on the first thing to fix.
                    if (leftoverPrompts.length > 0) {
                      setPromptToSelect(leftoverPrompts[0]);
                    }
                  }}
                  className={toggleClass}
                >
                  Go back and edit
                </button>
                <button
                  type="button"
                  onClick={generate}
                  className={toggleClass}
                >
                  Continue anyway
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card footer */}
        <div className="border-border-soft flex flex-col gap-3 border-t px-5 py-3">
          {/* The rule sits above the buttons, so it is read before pressing Generate. */}
          <p className="text-text-secondary text-xs leading-relaxed">
            Generating saves the final letter.
            <br />
            The stage moves to Proposal sent when you send it.
          </p>
          {saveError && (
            <p role="alert" className="text-brand-danger text-[13px]">
              {saveError}
            </p>
          )}
          {savedProposalId !== null && (
            <p role="status" className="text-[13px] font-medium">
              Proposal saved (no. {savedProposalId}).{" "}
              {/* The next step: the Send screen (DTI0-35) opens this saved proposal. */}
              <Link
                href={`/donor-conv/proposals/send-proposal?proposalId=${savedProposalId}`}
                className="text-brand-primary cursor-pointer underline"
              >
                Send proposal
              </Link>
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Link
              href="/donor-conv/prospects"
              onClick={(e) => {
                // Leaving drops the draft, so ask first if the letter was edited.
                if (hasEdits) {
                  e.preventDefault();
                  setConfirmAsk({ kind: "leave" });
                }
              }}
              className="border-border-strong hover:bg-surface-soft-hover inline-flex h-8 items-center rounded-[6px] border bg-white px-3 text-[13px] font-medium"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={saving || !prospect}
              title={!prospect ? "Select a prospect first to generate proposal" : undefined}
              className="bg-brand-primary text-surface-white inline-flex h-8 cursor-pointer items-center gap-2 rounded-[6px] px-3 text-[13px] font-medium hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText className="size-4" aria-hidden="true" />
              {saving ? "Saving..." : "Generate proposal"}
            </button>
          </div>
        </div>
      </div>

      {/* Right card: preview or edit */}
      <div className="border-border-soft bg-surface-white min-w-0 self-start overflow-hidden rounded-lg border print:overflow-visible print:rounded-none print:border-0 print:bg-transparent">
        {/* Tabs to switch between reading the letter and editing its text. */}
        <div
          role="tablist"
          aria-label="Letter view"
          onKeyDown={(e) => {
            // Arrow keys move between the two tabs, like a standard tab strip.
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            const next = mode === "preview" ? "edit" : "preview";
            setMode(next);
            document.getElementById(`letter-tab-${next}`)?.focus();
          }}
          className="no-print border-border-soft flex gap-1 border-b px-4"
        >
          {(
            [
              ["preview", "Preview"],
              ["edit", "Edit letter"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              id={`letter-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={mode === value}
              aria-controls="letter-panel"
              tabIndex={mode === value ? 0 : -1}
              onClick={() => setMode(value)}
              className={cn(
                "-mb-px h-10 cursor-pointer border-b-2 px-3 text-[13px] font-medium",
                mode === value
                  ? "border-brand-primary text-brand-primary"
                  : "text-text-secondary hover:text-text-primary border-transparent",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* One sheet for both modes; in Edit mode its body becomes a text box.
            The toolbar above it is filled in here, with the zoom controls
            added between the two parts by LetterPreview. */}
        <div
          id="letter-panel"
          role="tabpanel"
          aria-labelledby={`letter-tab-${mode}`}
        >
          <LetterPreview
            toolbarLeading={
              <>
                <FileText
                  className="text-text-secondary size-4 shrink-0"
                  aria-hidden="true"
                />
                <span
                  className="max-w-[16rem] min-w-0 truncate text-[13px] font-medium"
                  title={fileName}
                >
                  {fileName}
                </span>
                <span className="border-border-soft bg-surface-soft text-text-secondary hidden h-[22px] shrink-0 items-center gap-1.5 rounded-[4px] border px-2 text-xs font-medium xl:inline-flex">
                  <span
                    aria-hidden="true"
                    className="bg-text-secondary size-1.5 rounded-full"
                  />
                  {mode === "edit" ? "Editing draft" : "Draft preview"}
                </span>
              </>
            }
            toolbarTrailing={
              <>
                {mode === "preview" && (
                  // The browser's print dialog has a "Save as PDF" destination.
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={cn(toggleClass, "shrink-0 gap-2 bg-white")}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download PDF
                  </button>
                )}
                {mode === "edit" && (
                  <button
                    type="button"
                    onClick={() => setEditedText(null)}
                    disabled={!hasEdits}
                    className={cn(
                      toggleClass,
                      "shrink-0 gap-2 bg-white whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white",
                    )}
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Reset to template
                  </button>
                )}
              </>
            }
            text={letterText}
            selectText={promptToSelect}
            onTextSelected={() => setPromptToSelect(null)}
            onOverflowChange={setRunsPastOnePage}
            onTextChange={
              mode === "edit"
                ? (text) => {
                    setEditedText(text);
                    setShowWarning(false);
                  }
                : undefined
            }
          />
        </div>
        {mode === "edit" && (
          <p className="no-print text-text-secondary border-border-soft border-t px-4 py-2 text-xs">
            A blank line starts a new paragraph. Text between ** ** prints bold.
          </p>
        )}
      </div>
    </div>
    </div>
  );
}
