import { Leads } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const mockReport: Leads.Report = {
  timestamp: undefined,
  year: undefined,
  donorType: undefined,
  targetCampaign: undefined,
  yearOptions: [],
  donorTypeOptions: [],
  targetCampaignOptions: [],
  quarterlySummary: {
    headers: ["Q1", "Q2", "Q3", "Q4", "All Years"],
    coreMonetaryValue: {
      totalEstimatedValuation: [0, 0, 0, 0, 0],
      probabilityAdjustedValue: [0, 0, 0, 0, 0],
      securedValue: [0, 0, 0, 0, 0],
      unsecuredBalance: [0, 0, 0, 0, 0],
    },
    conversionEfficiencyAndRatios: {
      donorConversionRate: [0, 0, 0, 0, 0],
      valueRealizationRate: [0, 0, 0, 0, 0],
    },
    leadOriginBreakdown: {
      referral: [0, 0, 0, 0, 0],
      research: [0, 0, 0, 0, 0],
      booths: [0, 0, 0, 0, 0],
      callOrText: [0, 0, 0, 0, 0],
      walkIn: [0, 0, 0, 0, 0],
      subtotalLeadIntake: [0, 0, 0, 0, 0],
    },
    pipelineStageBreakdown: {
      newLead: [0, 0, 0, 0, 0],
      underResearch: [0, 0, 0, 0, 0],
      outreachStarted: [0, 0, 0, 0, 0],
      proposalSent: [0, 0, 0, 0, 0],
      securedDonor: [0, 0, 0, 0, 0],
      subtotalProspectRecords: [0, 0, 0, 0, 0],
    },
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const year = searchParams.get("year") ?? undefined;
    const donorType = searchParams.get("donorType") ?? undefined;
    const targetCampaign = searchParams.get("targetCampaign") ?? undefined;

    console.log(
      `[GET] Lead pipeline report filters: ${year}, ${donorType}, ${targetCampaign}`,
    );

    /*
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase.rpc("conversion_report", {
      p_year: year ?? null,  
      p_donor_type: donorType ?? null,
      p_target_campaign: targetCampaign ?? null,
    });

    if (error) throw error;

    const report = data as Leads.Report;
    */

    const report = mockReport;

    report.year = report.yearOptions?.some((option) => option.key === year)
      ? year
      : undefined;

    report.donorType = report.donorTypeOptions?.some(
      (option) => option.key === donorType,
    )
      ? donorType
      : undefined;

    report.targetCampaign = report.targetCampaignOptions?.some(
      (option) => option.key === targetCampaign,
    )
      ? targetCampaign
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
