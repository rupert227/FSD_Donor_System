import type { UserAccount } from "@/types";
import type { BuilderProspect } from "@/types/proposal";

// A proposal can be made once outreach has started, so earlier stages are left out.
export const PROPOSAL_STAGES = [
  "Outreach Started",
  "Proposal Sent",
  "Secured Donor",
];

// The prospect columns a letter needs, plus the officer linked through
// assigned_officer_id (and that officer's email and role from their account).
// Shared by the builder page (server) and the builder's refresh (browser).
export const PROSPECT_SELECT = `id, prospect_name, primary_contact_person, title_designation,
  street_address, city_province, target_campaign, target_amount,
  assigned_officer,
  officer_profiles ( id, full_name, job_title, phone_number,
    user_accounts ( email_address, user_role ) )`;

// The shape PostgREST returns for the officer joined onto a prospect.
type OfficerRow = {
  id: number;
  full_name: string;
  job_title: string | null;
  phone_number: string | null;
  user_accounts: { email_address: string; user_role: string } | null;
} | null;

// Turns one row from PROSPECT_SELECT into the builder's prospect.
export function toBuilderProspect(raw: unknown): BuilderProspect {
  const { officer_profiles, ...row } = raw as Record<string, unknown> & {
    officer_profiles: unknown;
  };
  const o = officer_profiles as OfficerRow;
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
}
