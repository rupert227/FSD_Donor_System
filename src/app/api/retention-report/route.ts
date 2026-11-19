import { Retention } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const mockReport: Retention.Report = {
  timestamp: undefined,
  year: undefined,
  targetCampaign: undefined,
  engagementStatus: undefined,
  yearOptions: [],
  targetCampaignOptions: [],
  engagementStatusOptions: [],
  quarterlySummary: {
    headers: ["Q1", "Q2", "Q3", "Q4", "All Years"],
    renewalValue: {
      totalEstimatedRenewalAmount: [0, 0, 0, 0, 0],
      realizedRenewalAmount: [0, 0, 0, 0, 0],
      uncollectedRenewalAmount: [0, 0, 0, 0, 0],
      meanRenewalValue: [0, 0, 0, 0, 0],
    },
    portfolio: {
      activeRetainedDonors: [0, 0, 0, 0, 0],
      donorRetentionRate: [0, 0, 0, 0, 0],
      realizedRenewalValueRate: [0, 0, 0, 0, 0],
    },
    engagementStatus: {
      recommitted: [0, 0, 0, 0, 0],
      renewalStarted: [0, 0, 0, 0, 0],
      followedUp: [0, 0, 0, 0, 0],
      uncontacted: [0, 0, 0, 0, 0],
      lapsedDonor: [0, 0, 0, 0, 0],
      subtotalRetentionAccounts: [0, 0, 0, 0, 0],
    },
    donorTenure: {
      threePlusYearsLoyal: [0, 0, 0, 0, 0],
      twoYearsRetained: [0, 0, 0, 0, 0],
      oneYearRetained: [0, 0, 0, 0, 0],
      newRenewal: [0, 0, 0, 0, 0],
      subtotalLoyaltyAccounts: [0, 0, 0, 0, 0],
    },
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const year = searchParams.get("year") ?? undefined;
    const targetCampaign = searchParams.get("targetCampaign") ?? undefined;
    const engagementStatus = searchParams.get("engagementStatus") ?? undefined;

    console.log(
      `[GET] Retention report filters: ${year}, ${targetCampaign}, ${engagementStatus}`,
    );

    /*
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.rpc("retention_report", {
      p_year: year ?? null,
      p_target_campaign: targetCampaign ?? null,
      p_engagement_status: engagementStatus ?? null,
    });

    if (error) throw error;

    const report = data as Retention.Report;
    */

    const report = mockReport;

    report.year = report.yearOptions?.some((option) => option.key === year)
      ? year
      : undefined;

    report.targetCampaign = report.targetCampaignOptions?.some(
      (option) => option.key === targetCampaign,
    )
      ? targetCampaign
      : undefined;

    report.engagementStatus = report.engagementStatusOptions?.some(
      (option) => option.key === engagementStatus,
    )
      ? engagementStatus
      : undefined;

    if (report.quarterlySummary?.headers) {
      report.quarterlySummary.headers[
        report.quarterlySummary.headers.length - 1
      ] =
        report.yearOptions?.find((option) => option.key === report.year)
          ?.label ?? "All Years";
    }

    report.timestamp = new Date().toISOString();

    return Response.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}
