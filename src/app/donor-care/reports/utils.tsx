import { Care, none } from "@/lib/types";

import {
  formatCurrencyWhole,
  formatNumber,
  formatNumberWhole,
  formatPercent,
} from "@/lib/utils";

interface SummaryRow {
  type: "header" | "row" | "section" | "total";
  valType?: (
    | "currency"
    | "netCurrency"
    | "netDifference"
    | "netDifferenceWhole"
    | "number"
    | "numberWhole"
    | "percent"
  )[];
  label: string;
  tooltip?: React.ReactNode;
  values: (number | none)[] | none;
}

export function generateSummaryRows(report: Care.Report): SummaryRow[] {
  return [
    {
      type: "section",
      label: "CORE MONETARY METRICS",
      values: [0, 0, 0, 0],
    },
    {
      type: "row",
      valType: ["currency", "currency", "currency", "percent"],
      label: "Total Collected Donations",
      tooltip: <p>?</p>,
      values:
        report.donationVariance?.coreMonetaryMetrics?.totalCollectedDonations,
    },
    {
      type: "row",
      valType: ["currency", "currency", "currency", "percent"],
      label: "Total Committed Donations",
      tooltip: <p>?</p>,
      values:
        report.donationVariance?.coreMonetaryMetrics?.totalCommittedDonations,
    },
    {
      type: "row",
      valType: ["currency", "currency", "currency", "percent"],
      label: "Uncollected Donation Balance",
      tooltip: <p>?</p>,
      values:
        report.donationVariance?.coreMonetaryMetrics
          ?.uncollectedDonationBalance,
    },
    {
      type: "row",
      valType: ["currency", "currency", "currency", "percent"],
      label: "Mean Donation per Transaction",
      tooltip: <p>?</p>,
      values:
        report.donationVariance?.coreMonetaryMetrics
          ?.meanDonationPerTransaction,
    },
    {
      type: "section",
      label: "CAMPAIGN ALLOCATIONS",
      values: [0, 0, 0, 0],
    },
    {
      type: "row",
      valType: ["currency", "currency", "netCurrency", "percent"],
      label: "Health and Disaster Relief",
      values:
        report.donationVariance?.campaignAllocations?.healthAndDisasterRelief,
    },
    {
      type: "row",
      valType: ["currency", "currency", "netCurrency", "percent"],
      label: "Youth Service Leadership",
      values:
        report.donationVariance?.campaignAllocations?.youthServiceLeadership,
    },
    {
      type: "row",
      valType: ["currency", "currency", "netCurrency", "percent"],
      label: "In-Kind Social Enterprise",
      values:
        report.donationVariance?.campaignAllocations?.inKindSocialEnterprise,
    },
    {
      type: "row",
      valType: ["currency", "currency", "netCurrency", "percent"],
      label: "Institute for Stewardship",
      values:
        report.donationVariance?.campaignAllocations?.instituteForStewardship,
    },
    {
      type: "row",
      valType: ["currency", "currency", "netCurrency", "percent"],
      label: "At-Risk Restorative Justice",
      values:
        report.donationVariance?.campaignAllocations?.atRiskRestorativeJustice,
    },
    {
      type: "total",
      valType: ["currency", "currency", "netCurrency", "percent"],
      label: "Subtotal Campaign Donations",
      values:
        report.donationVariance?.campaignAllocations?.subtotalCampaignDonations,
    },
    {
      type: "section",
      label: "TRANSACTION AUDIT & CERTIFICATES",
      values: [0, 0, 0, 0],
    },
    {
      type: "row",
      valType: ["numberWhole", "numberWhole", "netDifferenceWhole", "percent"],
      label: "Completed Transactions Encoded",
      values:
        report.donationVariance?.transactionAuditAndCertificates
          ?.completedTransactionsEncoded,
    },
    {
      type: "row",
      valType: ["numberWhole", "numberWhole", "netDifferenceWhole", "percent"],
      label: "Donation Receipts Dispatched",
      values:
        report.donationVariance?.transactionAuditAndCertificates
          ?.donationReceiptsDispatched,
    },
    {
      type: "row",
      valType: ["numberWhole", "numberWhole", "netDifferenceWhole", "percent"],
      label: "Tax Certificates Issued",
      values:
        report.donationVariance?.transactionAuditAndCertificates
          ?.taxCertificatesIssued,
    },
    {
      type: "row",
      valType: ["number", "number", "netDifference", "percent"],
      label: "Mean Dispatch Turnaround (Days)",
      values:
        report.donationVariance?.transactionAuditAndCertificates
          ?.meanDispatchTurnaround,
    },
  ];
}

export function renderSummaryValue(
  row: SummaryRow,
  value: number | null | undefined,
  index: number,
): React.ReactNode {
  if (row.type === "section") return "";

  const color = (() => {
    if (!value) return "";
    else if (value > 0) return "text-text-numeric-positive";
    else if (value < 0) return "text-text-numeric-negative";
    else return "";
  })();

  const symbol = (() => {
    if (!value) return "";
    else if (value > 0) return "+";
    else return "";
  })();

  const valType = row.valType?.[index];

  switch (valType) {
    case "currency":
      return formatCurrencyWhole(value);

    case "netCurrency":
      return (
        <p className={color}>
          {symbol}
          {formatCurrencyWhole(value)}
        </p>
      );

    case "netDifference":
      return (
        <p className={color}>
          {symbol}
          {formatNumber(value)}
        </p>
      );

    case "netDifferenceWhole":
      return (
        <p className={color}>
          {symbol}
          {formatNumberWhole(value)}
        </p>
      );

    case "number":
      return formatNumber(value);

    case "percent":
      return (
        <p className={color}>
          {symbol}
          {formatPercent(value)}
        </p>
      );

    case "numberWhole":
    default:
      return formatNumberWhole(value);
  }
}
