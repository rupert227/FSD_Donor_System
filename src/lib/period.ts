/**
 * Shared year / quarter period filtering and sorting helpers used by the
 * prospects table, the pipeline board and the donors table.
 *
 * Year and quarter are read from a record's "date added" (created_at), the same
 * field the Conversion and Retention reports use, so list counts line up with
 * the reports.
 */

export interface Period {
  /** "all" or a four-digit year such as "2026". */
  year: string;
  /** "all" or "1" to "4". */
  quarter: string;
}

export const ALL_PERIODS: Period = { year: "all", quarter: "all" };

export const QUARTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "1", label: "Q1", hint: "Jan – Mar" },
  { value: "2", label: "Q2", hint: "Apr – Jun" },
  { value: "3", label: "Q3", hint: "Jul – Sep" },
  { value: "4", label: "Q4", hint: "Oct – Dec" },
] as const;

/** The current year and quarter for an ISO date ("YYYY-MM-DD"); all periods before the date is known. */
export function currentPeriod(today: string): Period {
  const match = /^(\d{4})-(\d{2})/.exec(today);
  if (!match) return ALL_PERIODS;
  return {
    year: match[1],
    quarter: String(Math.ceil(Number(match[2]) / 3)),
  };
}

export function samePeriod(a: Period, b: Period) {
  return a.year === b.year && a.quarter === b.quarter;
}

export function isAllPeriods(p: Period) {
  return p.year === "all" && p.quarter === "all";
}

export function periodLabel(p: Period) {
  if (isAllPeriods(p)) return "All periods";
  const quarter = p.quarter === "all" ? "All quarters" : `Q${p.quarter}`;
  if (p.year === "all") return `${quarter}, all years`;
  return `${p.year} · ${quarter}`;
}

/** True when the date (ISO date or timestamp) falls inside the period. */
export function matchesPeriod(
  date: string | null | undefined,
  p: Period,
): boolean {
  if (isAllPeriods(p)) return true;
  const match = date ? /^(\d{4})-(\d{2})/.exec(date) : null;
  if (!match) return false;
  if (p.year !== "all" && match[1] !== p.year) return false;
  if (p.quarter !== "all" && String(Math.ceil(Number(match[2]) / 3)) !== p.quarter) {
    return false;
  }
  return true;
}

/** Years found in the data plus the current year, newest first. */
export function periodYears(
  dates: (string | null | undefined)[],
  today: string,
): string[] {
  const years = new Set<string>();
  for (const date of dates) {
    const match = date ? /^(\d{4})/.exec(date) : null;
    if (match) years.add(match[1]);
  }
  const current = /^(\d{4})/.exec(today);
  if (current) years.add(current[1]);
  return [...years].sort((a, b) => b.localeCompare(a));
}
