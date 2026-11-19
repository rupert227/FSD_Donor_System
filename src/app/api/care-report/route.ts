import { Care } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const mockReport: Care.Report = {
  timestamp: undefined,
  baseYear: undefined,
  compareYear: undefined,
  sourceOfFunds: undefined,
  baseYearOptions: [],
  compareYearOptions: [],
  sourceOfFundsOptions: [],
  donationVariance: {
    headers: ["Base Year", "Compare Year", "Net Difference", "Growth Rate"],
    coreMonetaryMetrics: {
      totalCollectedDonations: [0, 0, 0, 0],
      totalCommittedDonations: [0, 0, 0, 0],
      uncollectedDonationBalance: [0, 0, 0, 0],
      meanDonationPerTransaction: [0, 0, 0, 0],
    },
    campaignAllocations: {
      healthAndDisasterRelief: [0, 0, 0, 0],
      youthServiceLeadership: [0, 0, 0, 0],
      inKindSocialEnterprise: [0, 0, 0, 0],
      instituteForStewardship: [0, 0, 0, 0],
      atRiskRestorativeJustice: [0, 0, 0, 0],
      subtotalCampaignDonations: [0, 0, 0, 0],
    },
    transactionAuditAndCertificates: {
      completedTransactionsEncoded: [0, 0, 0, 0],
      donationReceiptsDispatched: [0, 0, 0, 0],
      taxCertificatesIssued: [0, 0, 0, 0],
      meanDispatchTurnaround: [0, 0, 0, 0],
    },
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const baseYear = searchParams.get("baseYear") ?? undefined;
    const compareYear = searchParams.get("compareYear") ?? undefined;
    const sourceOfFunds = searchParams.get("sourceOfFunds") ?? undefined;

    console.log(
      `[GET] Care report filters: ${baseYear}, ${compareYear}, ${sourceOfFunds}`,
    );

    /*
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.rpc("care_report", {
      p_base_year: baseYear ?? null,
      p_compare_year: compareYear ?? null,
      p_source_of_funds: sourceOfFunds ?? null,
    });

    if (error) throw error;

    const report = data as Care.Report;
    */

    const report = mockReport;

    report.baseYear = report.baseYearOptions?.some(
      (option) => option.key === baseYear,
    )
      ? baseYear
      : undefined;

    report.compareYear = report.compareYearOptions?.some(
      (option) => option.key === compareYear,
    )
      ? compareYear
      : undefined;

    report.sourceOfFunds = report.sourceOfFundsOptions?.some(
      (option) => option.key === sourceOfFunds,
    )
      ? sourceOfFunds
      : undefined;

    if (report.donationVariance?.headers) {
      report.donationVariance.headers[0] =
        report.baseYearOptions?.find((option) => option.key === report.baseYear)
          ?.label ?? "Base Year";
    }

    if (report.donationVariance?.headers) {
      report.donationVariance.headers[1] =
        report.compareYearOptions?.find(
          (option) => option.key === report.compareYear,
        )?.label ?? "Compare Year";
    }

    report.timestamp = new Date().toISOString();

    return Response.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}
