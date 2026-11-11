import { Leads, none } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

type SummaryRow = {
  type: "header" | "row" | "section";
  label: string;
  values: (number | none)[] | none;
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
      values: report.quarterlySummary?.pipelineValue.totalEstimatedValue,
    },
    {
      type: "row",
      label: "Probability-adjusted value",
      values: report.quarterlySummary?.pipelineValue.probabilityAdjustedValue,
    },
    {
      type: "row",
      label: "Secured value",
      values: report.quarterlySummary?.pipelineValue.securedValue,
    },
    {
      type: "row",
      label: "Unsecured balance",
      values: report.quarterlySummary?.pipelineValue.unsecuredBalance,
    },
    { type: "section", label: "Conversion", values: [0, 0, 0, 0, 0] },
    {
      type: "row",
      label: "Lead conversion rate",
      values: report.quarterlySummary?.conversion.leadConversionRate,
    },
    {
      type: "row",
      label: "Value realization rate",
      values: report.quarterlySummary?.conversion.valueRealizationRate,
    },
    { type: "section", label: "Leads Origin", values: [0, 0, 0, 0, 0] },
    {
      type: "row",
      label: "Referral",
      values: report.quarterlySummary?.leadsOrigin.referral,
    },
    {
      type: "row",
      label: "Research",
      values: report.quarterlySummary?.leadsOrigin.research,
    },
    {
      type: "row",
      label: "Booths",
      values: report.quarterlySummary?.leadsOrigin.booths,
    },
    {
      type: "row",
      label: "Direct Call",
      values: report.quarterlySummary?.leadsOrigin.directCall,
    },
    {
      type: "row",
      label: "Walk-in",
      values: report.quarterlySummary?.leadsOrigin.walkIn,
    },
    {
      type: "row",
      label: "Total new leads",
      values: report.quarterlySummary?.totalNewLeads,
    },
  ];
}

export function renderSummaryValue(
  row: SummaryRow,
  value: number | null | undefined,
): string {
  if (row.type === "section") return "";

  if (
    row.label === "Lead conversion rate" ||
    row.label === "Value realization rate"
  ) {
    return formatPercent(value);
  }

  return formatNumber(value);
}
