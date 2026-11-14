import type { UserRoleEnum } from "@/types";
import type {
  OfficerContact,
  Prospect,
  ProposalTemplate,
  Signatory,
} from "@/types/proposal";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

// Job title to use when an officer has no job_title of their own, taken from
// their account role.
const roleTitles: Partial<Record<UserRoleEnum, string>> = {
  "Conversion Officer": "Donor Conversion Officer",
  "Retention Officer": "Donor Retention Officer",
  "Donor Care Officer": "Donor Care Officer",
  "Division Head": "Division Head",
};

// Honorifics we recognise at the start of a contact name, and how to print them.
const honorifics: Record<string, string> = {
  mr: "Mr.", mrs: "Mrs.", ms: "Ms.", miss: "Miss", mx: "Mx.", dr: "Dr.",
  atty: "Atty.", engr: "Engr.", arch: "Arch.", fr: "Fr.", rev: "Rev.",
  sr: "Sr.", br: "Br.", hon: "Hon.", prof: "Prof.",
};
const nameSuffixes = ["jr", "sr", "ii", "iii", "iv"];
// Words that belong to the surname that follows them (Dela Cruz, De Guzman).
const surnameParticles = ["de", "del", "dela", "delos", "la", "los", "van", "von", "san"];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Writes the salutation the way a formal letter should:
// - With an honorific: "Dear Mr. Perfecto," (honorific plus surname only).
// - Without one: "Dear Maria Santos," (full name). We never guess Mr. or Ms.
//   from a first name.
export function buildSalutation(contactName: string): string {
  const fullName = contactName.trim();
  // Ignore anything after a comma (like ", CPA") and split into words.
  const words = fullName.split(",")[0].trim().split(/\s+/).filter(Boolean);
  const honorific = honorifics[(words[0] ?? "").replace(/\.$/, "").toLowerCase()];
  if (!honorific) return `Dear ${fullName},`;

  // Drop endings like "Jr." or "III".
  const rest = words.slice(1);
  while (rest.length > 0 && nameSuffixes.includes(rest[rest.length - 1].replace(/\.$/, "").toLowerCase())) {
    rest.pop();
  }
  if (rest.length === 0) return `Dear ${fullName},`;

  // The surname is the last word, plus any particles right before it.
  let start = rest.length - 1;
  while (start > 0 && surnameParticles.includes(rest[start - 1].toLowerCase())) start--;
  const surname = rest
    .slice(start)
    // "PERFECTO" and "santos" become "Perfecto" and "Santos"; mixed case is kept.
    .map((word) =>
      word === word.toUpperCase() || word === word.toLowerCase() ? capitalize(word) : word,
    )
    .join(" ");

  return `Dear ${honorific} ${surname},`;
}

export function formatPeso(amount: number): string {
  return peso.format(amount);
}

// Today's date on the user's own clock, as "2026-11-10" (the format a date
// input uses). Call this in the browser, not on the server, so it follows the
// user's timezone.
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// "2026-11-10" -> "November 10, 2026". Returns "" if the text is not a date.
export function formatLetterDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// A file name for the proposal, like "Proposal_Ayala_Foundation_2026.pdf".
// Accents and symbols are dropped so the name is safe on any system.
export function proposalFileName(prospectName: string, isoDate: string): string {
  const name = prospectName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const year = isoDate.slice(0, 4);
  return (
    ["Proposal", name, /^\d{4}$/.test(year) ? year : ""]
      .filter(Boolean)
      .join("_") + ".pdf"
  );
}

// Lists the [prompts] and {placeholders} still in the letter text, each once,
// in the order they appear. The preview highlights the same two patterns.
export function findLeftoverPrompts(text: string): string[] {
  const found = text.match(/\[[^\]\n]+\]|\{\w+\}/g) ?? [];
  return Array.from(new Set(found));
}

// Builds the whole letter as plain text. Paragraphs are separated by a blank
// line; lines inside one paragraph (like the address) are separated by a
// single line break.
export function buildLetterText(
  prospect: Prospect,
  template: ProposalTemplate,
  signatory: Signatory,
  officer: OfficerContact | null,
  date: string,
): string {
  // Join the address parts, skipping any that are empty.
  const address = [prospect.street_address, prospect.city_province]
    .filter(Boolean)
    .join(", ");

  // Skip empty lines (like a missing title) so no blank gaps appear.
  const recipientBlock = [
    `**${prospect.primary_contact_person}**`,
    prospect.title_designation,
    prospect.prospect_name,
    address,
  ]
    .filter(Boolean)
    .join("\n");

  // Officer details try each source in turn and only fall back to a [prompt]
  // when none has a value, so the officer knows what to fill in.
  const officerTitle =
    officer?.job_title ||
    (officer?.user_role ? roleTitles[officer.user_role] : undefined);

  // Values that replace {placeholders} in the template.
  const values: Record<string, string> = {
    contact: prospect.primary_contact_person,
    organization: prospect.prospect_name,
    campaign: prospect.target_campaign,
    amount: peso.format(prospect.target_amount),
    officer: officer?.full_name || prospect.assigned_officer,
    officer_title: officerTitle ? `**${officerTitle}**` : "[officer title]",
    officer_email: officer?.email_address || "[officer email]",
  };

  // Unknown placeholders are left as they are, so mistakes stay visible.
  const body = template.paragraphs.map((paragraph) =>
    paragraph.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match),
  );

  return [
    date,
    recipientBlock,
    buildSalutation(prospect.primary_contact_person),
    ...body,
    `**${signatory.name}**\n${signatory.title}`,
  ].join("\n\n");
}
