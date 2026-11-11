import type { OfficerContact, ProposalTemplate, Signatory } from "@/types/proposal";

// Prospects come from the team's shared sample leads (src/lib/mock-data/leads.ts).

// Sample officer profiles for the four officer names used by those sample
// leads. Only J. Reyes' details come from the real template; the rest are made up.
export const sampleOfficers: OfficerContact[] = [
  { id: 1, full_name: "Officer J. Reyes", job_title: "Senior Stewardship Officer", phone_number: null, email_address: "j.reyes@caritasmanila.org.ph", user_role: "Conversion Officer" },
  { id: 2, full_name: "Officer A. Tan", job_title: null, phone_number: null, email_address: "a.tan@caritasmanila.org.ph", user_role: "Conversion Officer" },
  { id: 3, full_name: "Officer M. Cruz", job_title: null, phone_number: null, email_address: "m.cruz@caritasmanila.org.ph", user_role: "Conversion Officer" },
  { id: 4, full_name: "Officer V. De Guzman", job_title: null, phone_number: null, email_address: "v.deguzman@caritasmanila.org.ph", user_role: "Conversion Officer" },
];

// Ignores case, extra spaces and a leading "Officer", so "officer  j. REYES"
// still matches "Officer J. Reyes".
function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").replace(/^officer\s+/i, "").toLowerCase();
}

// TODO: temporary match by name, because the sample leads have no
// assigned_officer_id. Once the database is available, look the officer up by
// lead_prospects.assigned_officer_id instead.
export function findSampleOfficer(assignedOfficer: string): OfficerContact | null {
  const wanted = normalizeName(assignedOfficer);
  return sampleOfficers.find((o) => normalizeName(o.full_name) === wanted) ?? null;
}

export const sampleTemplates: ProposalTemplate[] = [
  {
    id: "corporate-funding",
    name: "Corporate funding request",
    paragraphs: [
      "Greetings of Peace and Compassion from Caritas Manila!",
      "Caritas Manila serves as the principal social service arm of the Archdiocese of Manila, committed to empowering marginalized communities through sustainable human development and disaster response operations.",
      "We are humbly reaching out to present a formal funding request for our core campaign initiative, **{campaign}**.",
      "Through your generous allocation of **{amount}**, Caritas Manila will mobilize [what this contribution will deliver, e.g. number of packages and families helped].",
      "Our mission is anchored in faith and stewardship, ensuring that every financial contribution directly restores human dignity and fosters lasting community resilience.",
      "We warmly invite **{organization}** to partner with us as a lead corporate benefactor in advancing this effort.",
      "For inquiries and coordination, please contact {officer}, {officer_title}, at (02) 8562-0020 or +63 917 800 2274, or via email at {officer_email}.",
      "Thank you for your warm solidarity and dedication to transformative social stewardship.",
      "“Whatever you did for one of the least of these brothers and sisters of mine, you did for me.” — Matthew 25:40",
      "In opus interesti,",
    ],
  },
  {
    id: "standard",
    name: "Standard partnership proposal",
    paragraphs: [
      "We are writing to invite your organization to partner with us. Through our **{campaign}** program, we respectfully request a contribution of **{amount}** from {organization}.",
      "Sincerely,",
    ],
  },
];

export const sampleSignatories: Signatory[] = [
  { id: "sig-1", name: "Sample Signatory A", title: "Division Head, Donor Conversion" },
  { id: "sig-2", name: "Fr. Anton C.T. Pascual", title: "Executive Director" },
];
