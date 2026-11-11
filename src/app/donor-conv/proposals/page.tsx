import { Suspense } from "react";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProposalBuilder } from "@/components/proposals/ProposalBuilder";
import { navbarPreset } from "@/app/donor-conv/struct";
import { createClient } from "@/lib/supabase/server";
import type { BuilderProspect, Signatory } from "@/types/proposal";
import type { UserAccount } from "@/types";

// A proposal can be made once outreach has started, so earlier stages are left out.
const PROPOSAL_STAGES = ["Outreach Started", "Proposal Sent", "Secured Donor"];

// The shape PostgREST returns for the officer joined onto a prospect.
type OfficerRow = {
  id: number;
  full_name: string;
  job_title: string | null;
  phone_number: string | null;
  user_accounts: { email_address: string; user_role: string } | null;
} | null;

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
      .select(
        `id, prospect_name, primary_contact_person, title_designation,
         street_address, city_province, target_campaign, target_amount,
         assigned_officer,
         officer_profiles ( id, full_name, job_title, phone_number,
           user_accounts ( email_address, user_role ) )`,
      )
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
    ({ officer_profiles, ...row }) => {
      const o = officer_profiles as unknown as OfficerRow;
      return {
        ...(row as Omit<BuilderProspect, "officer">),
        officer: o && {
          id: o.id,
          full_name: o.full_name,
          job_title: o.job_title,
          phone_number: o.phone_number,
          email_address: o.user_accounts?.email_address ?? null,
          user_role:
            (o.user_accounts?.user_role as UserAccount["user_role"]) ?? null,
        },
      };
    },
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
