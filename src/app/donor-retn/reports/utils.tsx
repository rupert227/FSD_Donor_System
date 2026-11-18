import { Retention, none } from "@/lib/types";
import { formatCurrencyWhole, formatNumber, formatPercent } from "@/lib/utils";

interface SummaryRow {
  type: "header" | "row" | "section" | "total";
  valType?: "currency" | "number" | "percent";
  label: string;
  tooltip?: React.ReactNode;
  values: (number | none)[] | none;
}

export function generateSummaryRows(report: Retention.Report): SummaryRow[] {
  return [
    {
      type: "section",
      label: "RENEWAL VALUE",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      valType: "currency",
      label: "Total Estimated Renewal Amount",
      tooltip: <>?</>,
      values:
        report.quarterlySummary?.renewalValue?.totalEstimatedRenewalAmount,
    },
    {
      type: "row",
      valType: "currency",
      label: "Realized Renewal Amount",
      tooltip: <>?</>,
      values: report.quarterlySummary?.renewalValue?.realizedRenewalAmount,
    },
    {
      type: "row",
      valType: "currency",
      label: "Uncollected Renewal Amount",
      tooltip: <>?</>,
      values: report.quarterlySummary?.renewalValue?.uncollectedRenewalAmount,
    },
    {
      type: "row",
      valType: "currency",
      label: "Mean Renewal Value",
      tooltip: <>?</>,
      values: report.quarterlySummary?.renewalValue?.meanRenewalValue,
    },
    {
      type: "section",
      label: "PORTFOLIO",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      label: "Active Retained Donors",
      tooltip: <>?</>,
      values: report.quarterlySummary?.portfolio?.activeRetainedDonors,
    },
    {
      type: "row",
      valType: "percent",
      label: "Donor Retention Rate",
      tooltip: <>?</>,
      values: report.quarterlySummary?.portfolio?.donorRetentionRate,
    },
    {
      type: "row",
      valType: "percent",
      label: "Realized Renewal Value Rate",
      tooltip: <>?</>,
      values: report.quarterlySummary?.portfolio?.realizedRenewalValueRate,
    },
    {
      type: "section",
      label: "ENGAGEMENT STATUS",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      label: "Recommitted",
      values: report.quarterlySummary?.engagementStatus?.recommitted,
    },
    {
      type: "row",
      label: "Renewal Started",
      values: report.quarterlySummary?.engagementStatus?.renewalStarted,
    },
    {
      type: "row",
      label: "Followed-up",
      values: report.quarterlySummary?.engagementStatus?.followedUp,
    },
    {
      type: "row",
      label: "Uncontacted",
      values: report.quarterlySummary?.engagementStatus?.uncontacted,
    },
    {
      type: "row",
      label: "Lapsed Donor",
      values: report.quarterlySummary?.engagementStatus?.lapsedDonor,
    },
    {
      type: "total",
      label: "Subtotal Retention Accounts",
      values:
        report.quarterlySummary?.engagementStatus?.subtotalRetentionAccounts,
    },
    {
      type: "section",
      label: "DONOR TENURE",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      label: "3+ Years Loyal",
      values: report.quarterlySummary?.donorTenure?.threePlusYearsLoyal,
    },
    {
      type: "row",
      label: "2 Years Retained",
      values: report.quarterlySummary?.donorTenure?.twoYearsRetained,
    },
    {
      type: "row",
      label: "1 Year Retained",
      values: report.quarterlySummary?.donorTenure?.oneYearRetained,
    },
    {
      type: "row",
      label: "New Renewal",
      values: report.quarterlySummary?.donorTenure?.newRenewal,
    },
    {
      type: "total",
      label: "Subtotal Loyalty Accounts",
      values: report.quarterlySummary?.donorTenure?.subtotalLoyaltyAccounts,
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
      return formatCurrencyWhole(value);
    case "number":
    default:
      return formatNumber(value);
  }
}
