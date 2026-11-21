import { Retention, none } from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

export interface SummaryRow {
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
      tooltip: (
        <p>
          The total pledged renewal amount from transactions within the selected
          period.
        </p>
      ),
      values:
        report.quarterlySummary?.renewalValue?.totalEstimatedRenewalAmount,
    },
    {
      type: "row",
      valType: "currency",
      label: "Realized Renewal Amount",
      tooltip: (
        <p>
          The total amount collected from{" "}
          <span className="font-semibold">Renewal Transactions</span> within the
          selected period.
        </p>
      ),
      values: report.quarterlySummary?.renewalValue?.realizedRenewalAmount,
    },
    {
      type: "row",
      valType: "currency",
      label: "Uncollected Renewal Amount",
      tooltip: (
        <p>
          The remaining unpaid balance, calculated by subtracting{" "}
          <span className="font-semibold">Collected Amounts</span> from{" "}
          <span className="font-semibold">Pledged Amounts</span>.
        </p>
      ),
      values: report.quarterlySummary?.renewalValue?.uncollectedRenewalAmount,
    },
    {
      type: "row",
      valType: "currency",
      label: "Mean Renewal Value",
      tooltip: (
        <p>
          The average pledged amount per transaction within the selected period.
        </p>
      ),
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
      tooltip: (
        <p>
          The number of donors marked as{" "}
          <span className="font-semibold">Recommitted</span>,{" "}
          <span className="font-semibold">Renewal Started</span>, or{" "}
          <span className="font-semibold">Followed-up</span>.
        </p>
      ),
      values: report.quarterlySummary?.portfolio?.activeRetainedDonors,
    },
    {
      type: "row",
      valType: "percent",
      label: "Donor Retention Rate",
      tooltip: (
        <p>
          {" "}
          The percentage of matching donor profiles, classified as{" "}
          <span className="font-semibold">Actively Retained</span> divided by
          the{" "}
          <span className="font-semibold">Total Matching Donor Profiles</span>.
        </p>
      ),
      values: report.quarterlySummary?.portfolio?.donorRetentionRate,
    },
    {
      type: "row",
      valType: "percent",
      label: "Realized Renewal Value Rate",
      tooltip: (
        <p>
          The percentage of pledged renewal value that has been collected,
          calculated as <span className="font-semibold">Collected Amount</span>{" "}
          divided by <span className="font-semibold">Total Pledged Amount</span>.
        </p>
      ),
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
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "number":
    default:
      return formatNumber(value);
  }
}
