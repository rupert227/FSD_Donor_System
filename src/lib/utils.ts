const percentFormat = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const phCurrencyFormat = Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

export const reportDateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "long",
});

export const usFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | null | undefined): string {
  if (!Number.isFinite(value) || value == null) return "—";

  return phCurrencyFormat.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (!Number.isFinite(value) || value == null) return "—";

  return usFormat.format(Math.round(value));
}

export function formatPercent(value: number | null | undefined): string {
  if (!Number.isFinite(value) || value == null) return "—";

  return percentFormat.format(value);
}

export function formatReportDate(isoDate: string | null | undefined): string {
  if (isoDate == null) return "—";

  return reportDateFormat.format(new Date(isoDate)) ?? "—";
}

export function getFiscalYearFromDate(
  dateValue: string | null | undefined,
): number {
  if (!dateValue) return 0;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 0;

  return parsed.getFullYear();
}

export function getQuarterFromDate(
  dateValue: string | null | undefined,
): number {
  if (!dateValue) return 0;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 0;

  return Math.floor(parsed.getMonth() / 3);
}

export function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
