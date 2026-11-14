import { buildSalutation } from "./letter";

// The starting subject and message for the email that carries the proposal PDF.
// The officer can edit all of it or clear it and write their own.

export function buildEmailSubject(organization: string): string {
  return `Partnership proposal from Caritas Manila: ${organization}`;
}

export function buildEmailBody(details: {
  contact: string;
  organization: string;
  campaign: string;
  // The person sending the email (their name and title end the message).
  senderName: string;
  senderTitle: string | null;
}): string {
  return [
    buildSalutation(details.contact),
    "Greetings of Peace and Compassion from Caritas Manila!",
    `Attached is our formal partnership proposal for ${details.organization}, for our ${details.campaign} campaign. The letter (PDF) explains our request and how your support would help the communities we serve.`,
    "Please let us know if you have any questions or would like to discuss it further. We would be glad to arrange a meeting or a call.",
    "Thank you for your warm solidarity and dedication to transformative social stewardship.",
    [
      "In opus interesti,",
      details.senderName,
      details.senderTitle,
      "Caritas Manila",
    ]
      .filter(Boolean)
      .join("\n"),
  ].join("\n\n");
}
