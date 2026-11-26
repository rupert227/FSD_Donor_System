import { Dashboard } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const mockReport: Dashboard.RevenueReceipts = {
  timestamp: undefined,
  page: undefined,
  nameOrder: undefined,
  priceOrder: undefined,
  dateOrder: undefined,
  status: undefined,
  totalEntries: 300,
  receipts: [
    { name: "testa", timestamp: "time", amount: [10, 20, 0.5] },
    { name: "testb", timestamp: "time", amount: [10, 20, 0.5] },
    { name: "testc", timestamp: "time", amount: [10, 20, 0.5] },
    { name: "testd", timestamp: "time", amount: [10, 20, 0.5] },
    { name: "teste", timestamp: "time", amount: [10, 20, 0.5] },
  ],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page") ?? undefined;
    const year = searchParams.get("year") ?? undefined;
    const month = searchParams.get("month") ?? undefined;
    const nameOrder = searchParams.get("nameOrder") ?? undefined;
    const priceOrder = searchParams.get("priceOrder") ?? undefined;
    const dateOrder = searchParams.get("dateOrder") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    console.log(
      `[GET] Revenue receipts filters: ${page}, ${year}, ${month}, ${nameOrder}, ${priceOrder}, ${dateOrder}, ${status}`,
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
    */

    const report = mockReport; // data as Dashboard.RevenueReceipts;

    return Response.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return Response.json({ error: message }, { status: 500 });
  }
}
