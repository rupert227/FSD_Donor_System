import { Leads } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

type SummaryRow = {
  type: "header" | "row" | "section";
  label: string;
  values: number[];
};

export function generateSummaryRows(report: Leads.Report): SummaryRow[] {
  return [
    {
      type: "section",
      label: "Pipeline value (₱)",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      label: "Total estimated value",
      values: report.quarterlySummary.totalEstimatedValue,
    },
    {
      type: "row",
      label: "Probability-adjusted value",
      values: report.quarterlySummary.probabilityAdjustedValue,
    },
    {
      type: "row",
      label: "Secured value",
      values: report.quarterlySummary.securedValue,
    },
    {
      type: "row",
      label: "Unsecured balance",
      values: report.quarterlySummary.unsecuredBalance,
    },
    { type: "section", label: "Conversion", values: [0, 0, 0, 0, 0] },
    {
      type: "row",
      label: "Lead conversion rate",
      values: report.conversion.leadConversionRate,
    },
    {
      type: "row",
      label: "Value realization rate",
      values: report.conversion.valueRealizationRate,
    },
    { type: "section", label: "Leads Origin", values: [0, 0, 0, 0, 0] },
    {
      type: "row",
      label: "Referral",
      values: report.leadsOrigin.referral,
    },
    {
      type: "row",
      label: "Research",
      values: report.leadsOrigin.research,
    },
    {
      type: "row",
      label: "Booths",
      values: report.leadsOrigin.booths,
    },
    {
      type: "row",
      label: "Direct Call",
      values: report.leadsOrigin.directCall,
    },
    {
      type: "row",
      label: "Walk-in",
      values: report.leadsOrigin.walkIn,
    },
    {
      type: "row",
      label: "Total new leads",
      values: report.totalNewLeads,
    },
  ];
}

export function renderSummaryValue(row: SummaryRow, value: number): string {
  if (row.type === "section") return "";

  if (
    row.label === "Lead conversion rate" ||
    row.label === "Value realization rate"
  ) {
    return formatPercent(value);
  }

  return formatNumber(value);
}
