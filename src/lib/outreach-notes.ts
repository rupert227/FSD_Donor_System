// An outreach entry's header is stored as the first line of its existing
// `notes` column, followed by a blank line and the full notes, so no schema
// change is needed:
//
//   Sent renewal letter
//
//   Sent the FY2027 renewal letter together with the impact summary...

export const OUTREACH_HEADER_MAX = 40;

export function encodeOutreachNotes(header: string, body: string): string {
  const h = header.trim();
  const b = body.trim();
  return h ? `${h}\n\n${b}` : b;
}

// Notes saved before headers existed have no header line, so they come back
// with an empty header and their whole text as the body.
export function parseOutreachNotes(notes: string | null | undefined): {
  header: string;
  body: string;
} {
  const text = (notes ?? "").trim();
  const match = text.match(/^([^\n]+)\n\s*\n([\s\S]+)$/);
  if (match && match[1].trim().length <= OUTREACH_HEADER_MAX) {
    return { header: match[1].trim(), body: match[2].trim() };
  }
  return { header: "", body: text };
}
