import type { LeadProspect, OfficerProfile, UserAccount } from "@/types";

// The prospect fields a letter needs, taken straight from the database type
// so this can never drift from the schema.
export type Prospect = Pick<
  LeadProspect,
  | "id"
  | "prospect_name"
  | "primary_contact_person"
  | "title_designation"
  | "street_address"
  | "city_province"
  | "target_campaign"
  | "target_amount"
  | "assigned_officer"
>;

// A template is a list of paragraphs. Inside a paragraph, {contact},
// {organization}, {campaign}, {amount} and {officer} are filled in from the
// prospect, **text** is bold, and [text in brackets] is a prompt for the
// officer to replace in Edit letter.
export type ProposalTemplate = { id: string; name: string; paragraphs: string[] };
export type Signatory = { id: string; name: string; title: string };

// What a letter needs about the officer. The email and role are not in
// officer_profiles; they come from the linked user account.
export type OfficerContact = Pick<
  OfficerProfile,
  "id" | "full_name" | "job_title" | "phone_number"
> &
  Pick<UserAccount, "email_address" | "user_role">;
