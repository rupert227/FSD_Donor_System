import { Leads, none } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface SummaryRow {
  type: "header" | "row" | "section" | "total";
  valType?: "currency" | "number" | "percent";
  label: string;
  tooltip?: React.ReactNode;
  values: (number | none)[] | none;
}

export function generateSummaryRows(report: Leads.Report): SummaryRow[] {
  return [
    {
      type: "section",
      label: "CORE MONETARY VALUATION",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      valType: "currency",
      label: "Total Estimated Valuation",
      tooltip: (
        <>
          The sum of the target donation amounts of all matching prospect
          records.
        </>
      ),
      values:
        report.quarterlySummary?.coreMonetaryValue?.totalEstimatedValuation,
    },
    {
      type: "row",
      valType: "currency",
      label: "Probability-Adjusted Value",
      tooltip: (
        <>
          The estimated donation value adjusted by each prospect&apos;s
          probability score. Only prospects with a probability score of{" "}
          <span className="font-semibold">60% or higher</span> are included.
        </>
      ),
      values:
        report.quarterlySummary?.coreMonetaryValue?.probabilityAdjustedValue,
    },
    {
      type: "row",
      valType: "currency",
      label: "Secured Value",
      tooltip: (
        <>
          The sum of the target donation amounts of prospects currently in the{" "}
          <span className="font-semibold">Secured Donor</span> stage.
        </>
      ),
      values: report.quarterlySummary?.coreMonetaryValue?.securedValue,
    },
    {
      type: "row",
      valType: "currency",
      label: "Unsecured Balance",
      tooltip: (
        <>
          The remaining estimated donation value that has not been secured,
          calculated by subtracting the{" "}
          <span className="font-semibold">Secured Value</span> from the{" "}
          <span className="font-semibold">Total Estimated Valuation</span>.
        </>
      ),
      values: report.quarterlySummary?.coreMonetaryValue?.unsecuredBalance,
    },
    {
      type: "section",
      label: "CONVERSION EFFICIENCY & RATIOS",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      valType: "percent",
      label: "Donor Conversion Rate",
      tooltip: (
        <>
          The proportion of prospect records currently in the{" "}
          <span className="font-semibold">Secured Donor</span> stage relative to
          the total number of prospect records.
        </>
      ),
      values:
        report.quarterlySummary?.conversionEfficiencyAndRatios
          ?.donorConversionRate,
    },
    {
      type: "row",
      valType: "percent",
      label: "Value Realization Rate",
      tooltip: (
        <>
          The proportion of the{" "}
          <span className="font-semibold">Total Estimated Valuation</span> that
          has been secured, calculated by dividing the{" "}
          <span className="font-semibold">Secured Value</span> by the{" "}
          <span className="font-semibold">Total Estimated Valuation</span>.
        </>
      ),
      values:
        report.quarterlySummary?.conversionEfficiencyAndRatios
          ?.valueRealizationRate,
    },
    {
      type: "section",
      label: "LEAD ORIGIN BREAKDOWN",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      label: "Referral",
      values: report.quarterlySummary?.leadOriginBreakdown?.referral,
    },
    {
      type: "row",
      label: "Research",
      values: report.quarterlySummary?.leadOriginBreakdown?.research,
    },
    {
      type: "row",
      label: "Booths",
      values: report.quarterlySummary?.leadOriginBreakdown?.booths,
    },
    {
      type: "row",
      label: "Call / Text",
      values: report.quarterlySummary?.leadOriginBreakdown?.callOrText,
    },
    {
      type: "row",
      label: "Walk-in",
      values: report.quarterlySummary?.leadOriginBreakdown?.walkIn,
    },
    {
      type: "total",
      label: "Sub-Total Lead Intake",
      values: report.quarterlySummary?.leadOriginBreakdown?.subTotalLeadIntake,
    },
    {
      type: "section",
      label: "PIPELINE STAGE BREAKDOWN",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      label: "New Lead",
      values: report.quarterlySummary?.pipelineStageBreakdown?.newLead,
    },
    {
      type: "row",
      label: "Under Research",
      values: report.quarterlySummary?.pipelineStageBreakdown?.underResearch,
    },
    {
      type: "row",
      label: "Outreach Started",
      values: report.quarterlySummary?.pipelineStageBreakdown?.outreachStarted,
    },
    {
      type: "row",
      label: "Proposal Sent",
      values: report.quarterlySummary?.pipelineStageBreakdown?.proposalSent,
    },
    {
      type: "row",
      label: "Secured Donor",
      values: report.quarterlySummary?.pipelineStageBreakdown?.securedDonor,
    },
    {
      type: "total",
      label: "Sub-Total Prospect Records",
      values:
        report.quarterlySummary?.pipelineStageBreakdown
          ?.subTotalProspectRecords,
    },
  ];
}

export function renderSummaryValue(
  row: SummaryRow,
  value: number | null | undefined,
): string {
  if (row.type === "section") return "";

  switch (row.valType) {
    case "percent":
      return formatPercent(value);
    case "currency":
      return formatCurrency(value);
    case "number":
    default:
      return formatNumber(value);
  }
}
