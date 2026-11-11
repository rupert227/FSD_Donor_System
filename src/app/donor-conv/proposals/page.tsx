import { Suspense } from "react";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProposalBuilder } from "@/components/proposals/ProposalBuilder";
import { navbarPreset } from "@/app/donor-conv/struct";
import { createClient } from "@/lib/supabase/server";
import type { BuilderProspect, Signatory } from "@/types/proposal";
import {
  PROPOSAL_STAGES,
  PROSPECT_SELECT,
  toBuilderProspect,
} from "@/lib/proposals-data";

type SearchParams = Promise<{ prospectId?: string; prospect?: string }>;

// Reads the data at request time. It sits inside <Suspense> on the page below,
// because this app uses cacheComponents: anything that reads cookies or the URL
// must not block the static page shell.
async function ProposalBuilderLoader({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { prospectId, prospect: prospectName } = await searchParams;
  const supabase = await createClient();

  const [prospectsResult, signatoriesResult] = await Promise.all([
    supabase
      .from("lead_prospects")
      .select(PROSPECT_SELECT)
      .in("pipeline_status", PROPOSAL_STAGES)
      .order("prospect_name"),
    supabase
      .from("officer_profiles")
      .select("id, full_name, job_title")
      .eq("is_signatory", true)
      .order("full_name"),
  ]);

  const loadError = prospectsResult.error ?? signatoriesResult.error;

  const prospects: BuilderProspect[] = (prospectsResult.data ?? []).map(
    toBuilderProspect,
  );

  const signatories: Signatory[] = (signatoriesResult.data ?? []).map((s) => ({
    id: String(s.id),
    name: s.full_name,
    title: s.job_title ?? "",
  }));

  // Pre-select from ?prospectId= (pipeline board) or ?prospect=<name> (edit page).
  const initialProspectId =
    prospects.find((p) => String(p.id) === prospectId)?.id ??
    prospects.find((p) => p.prospect_name === prospectName)?.id;

  if (loadError) {
    return (
      <p role="alert" className="text-brand-danger mt-5 text-sm">
        Could not load prospects or signatories: {loadError.message}
      </p>
    );
  }

  return (
    <ProposalBuilder
      prospects={prospects}
      signatories={signatories}
      initialProspectId={initialProspectId}
    />
  );
}

export default function ProposalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    // Copy the shared preset and highlight the "Proposals" tab (index 1).
    <AppShell navbarPreset={{ ...navbarPreset, selectedTabIndex: 1 }}>
      {/* Page header (not printed): the page title. */}
      <div className="no-print flex items-center gap-3">
        <div className="bg-surface-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-[22px] leading-7 font-semibold">New proposal</h1>
      </div>

      <Suspense fallback={<p className="mt-5 text-sm">Loading prospects...</p>}>
        <ProposalBuilderLoader searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
