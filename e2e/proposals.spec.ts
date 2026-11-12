import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

// DTI0-20 backend tests. They run against the LIVE Supabase project, so they clean up after
// themselves where the app allows it (they restore the prospect stage they change).
// Saved proposals cannot be deleted from the app (no DELETE policy), so the rows these
// tests create are removed by hand afterwards; every test row is marked "E2E TEST".
//
// Nothing secret is written here. Run with:
//   TEST_PASSWORD=... E2E_SUPABASE_URL=... E2E_SUPABASE_KEY=... npm run test:e2e -- e2e/proposals.spec.ts
// (the key is the public publishable key, the same one the browser uses).
const PASSWORD = process.env.TEST_PASSWORD;
const URL = process.env.E2E_SUPABASE_URL;
const KEY = process.env.E2E_SUPABASE_KEY;
const skip = !PASSWORD || !URL || !KEY;

const CONVERSION = "conversion.officer@example.test";
const RETENTION = "retention.officer@example.test";

async function accessToken(request: APIRequestContext, email: string) {
  const res = await request.post(`${URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: KEY! },
    data: { email, password: PASSWORD },
  });
  expect(res.ok(), `sign-in as ${email}`).toBeTruthy();
  return (await res.json()).access_token as string;
}

// A tiny REST helper that acts as one signed-in user (so row level security applies).
function asUser(request: APIRequestContext, token: string) {
  const headers = { apikey: KEY!, Authorization: `Bearer ${token}` };
  return {
    get: (path: string) => request.get(`${URL}/rest/v1/${path}`, { headers }),
    post: (path: string, data: unknown) =>
      request.post(`${URL}/rest/v1/${path}`, {
        headers: { ...headers, Prefer: "return=representation" },
        data,
      }),
    patch: (path: string, data: unknown) =>
      request.patch(`${URL}/rest/v1/${path}`, { headers, data }),
  };
}

async function signInUi(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD!);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await expect(page).toHaveURL(/\/donor-conv\/prospects$/, { timeout: 15000 });
}

test.describe.configure({ mode: "serial" });

test.describe("DTI0-20 proposal backend", () => {
  test.skip(skip, "TEST_PASSWORD, E2E_SUPABASE_URL or E2E_SUPABASE_KEY not set");

  let prospect: { id: number; pipeline_status: string; prospect_name: string };
  let uiProposalId: number;
  let apiProposalId: number;

  test("data: prospects are linked to officers, signatories exist", async ({ request }) => {
    const api = asUser(request, await accessToken(request, CONVERSION));
    const prospects = await (await api.get("lead_prospects?select=id,assigned_officer_id")).json();
    expect(prospects.length).toBeGreaterThan(0);
    expect(prospects.every((p: { assigned_officer_id: number | null }) => p.assigned_officer_id)).toBe(true);

    const signatories = await (
      await api.get("officer_profiles?select=full_name,job_title&is_signatory=eq.true")
    ).json();
    const names = signatories.map((s: { full_name: string }) => s.full_name);
    expect(names).toContain("Rupert Tabilin");
    expect(names).toContain("Fr. Anton C.T. Pascual");

    // The prospect the later tests will use (and restore): one that is at Outreach Started.
    const eligible = await (
      await api.get("lead_prospects?select=id,pipeline_status,prospect_name&pipeline_status=eq.Outreach Started&order=id&limit=1")
    ).json();
    expect(eligible.length).toBe(1);
    prospect = eligible[0];
  });

  test("builder page lists real prospects and signatories (no sample data)", async ({ page }) => {
    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals?prospectId=${prospect.id}`);
    // The prospect picker is a search box. Opening it lists the real prospects.
    const box = page.getByPlaceholder("Search prospect by name or campaign...");
    await expect(box).toHaveValue(prospect.prospect_name, { timeout: 15000 });
    await box.click();
    await expect(page.locator("div.absolute.z-50 button").nth(1)).toBeVisible();

    // No sample data. (The signatory is no longer a dropdown: the builder picks it from the
    // real signatory profiles, which the first test checks.)
    await expect(page.getByText("Sample Signatory A")).toHaveCount(0);
  });

  test("?prospectId= preselects that prospect", async ({ page }) => {
    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals?prospectId=${prospect.id}`);
    await expect(page.getByPlaceholder("Search prospect by name or campaign...")).toHaveValue(prospect.prospect_name, { timeout: 15000 });
  });

  test("Generate saves a proposal and does not change the pipeline stage", async ({ page, request }) => {
    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals?prospectId=${prospect.id}`);
    await expect(page.getByPlaceholder("Search prospect by name or campaign...")).toHaveValue(prospect.prospect_name, { timeout: 15000 });

    // The builder loads the prospect's latest saved letter (if any) after the page appears.
    // Wait for that to finish, or the letter changes under the click.
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Generate proposal" }).click();
    // A letter with a [prompt] left shows a warning first. One loaded from an earlier
    // proposal usually has none and saves straight away, so wait for whichever comes.
    const proceed = page.getByRole("button", { name: "Continue anyway" });
    const saved = page.getByText(/Proposal saved \(no\. \d+\)/);
    await expect(saved.or(proceed)).toBeVisible({ timeout: 15000 });
    if (await proceed.isVisible()) await proceed.click();
    await expect(saved).toBeVisible({ timeout: 15000 });
    uiProposalId = Number(/no\. (\d+)/.exec(await saved.innerText())![1]);

    // The next step is offered: a link to the Send screen carrying the saved proposal's id.
    await expect(page.getByRole("link", { name: "Send proposal" }).first()).toHaveAttribute(
      "href",
      `/donor-conv/proposals/send-proposal?proposalId=${uiProposalId}`,
    );

    const api = asUser(request, await accessToken(request, CONVERSION));
    const rows = await (await api.get(`proposals?id=eq.${uiProposalId}&select=*`)).json();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("Generated");
    expect(rows[0].prospect_id).toBe(prospect.id);
    expect(rows[0].letter_text.length).toBeGreaterThan(50);
    expect(rows[0].dispatched_at).toBeNull();
    expect(rows[0].created_by, "set by the database from the signed-in user").not.toBeNull();

    const after = await (await api.get(`lead_prospects?id=eq.${prospect.id}&select=pipeline_status`)).json();
    expect(after[0].pipeline_status).toBe(prospect.pipeline_status);
  });

  test("created_by cannot be faked and a proposal cannot be created as Sent", async ({ request }) => {
    const api = asUser(request, await accessToken(request, CONVERSION));
    const base = {
      prospect_id: prospect.id,
      template_id: "standard",
      letter_date: "2026-11-12",
      signatory_name: "E2E TEST",
      letter_text: "E2E TEST letter",
    };
    const asSent = await api.post("proposals", { ...base, status: "Sent" });
    expect(asSent.ok(), "inserting status Sent must be refused").toBe(false);

    const faked = await api.post("proposals", { ...base, created_by: 2 }); // 2 = another account, not the Conversion Officer;
    expect(faked.ok()).toBe(true);
    const row = (await faked.json())[0];
    apiProposalId = row.id;
    expect(row.created_by, "the trigger overrides a faked created_by").not.toBe(2);
  });

  test("Retention Officer cannot read, create, update or send proposals", async ({ request }) => {
    const api = asUser(request, await accessToken(request, RETENTION));
    const read = await api.get("proposals?select=id");
    expect(await read.json()).toEqual([]); // rows are hidden, not just blocked

    const create = await api.post("proposals", {
      prospect_id: prospect.id,
      template_id: "standard",
      letter_date: "2026-11-12",
      signatory_name: "E2E TEST",
      letter_text: "E2E TEST letter",
    });
    expect(create.ok()).toBe(false);

    const send = await request.post(`${URL}/rest/v1/rpc/send_proposal`, {
      headers: { apikey: KEY!, Authorization: `Bearer ${await accessToken(request, RETENTION)}` },
      data: { p_proposal_id: apiProposalId, p_delivery: "Postal Mail" },
    });
    expect(send.ok(), "send_proposal is refused for a Retention Officer").toBe(false);

    const still = await (await asUser(request, await accessToken(request, CONVERSION)).get(`proposals?id=eq.${apiProposalId}&select=status`)).json();
    expect(still[0].status).toBe("Generated");
  });

  test("signed-out visitors (anon key) get nothing", async ({ request }) => {
    const read = await request.get(`${URL}/rest/v1/proposals?select=id`, { headers: { apikey: KEY! } });
    expect(read.ok() ? await read.json() : []).toEqual([]);
    const send = await request.post(`${URL}/rest/v1/rpc/send_proposal`, {
      headers: { apikey: KEY! },
      data: { p_proposal_id: apiProposalId, p_delivery: "Postal Mail" },
    });
    expect(send.ok()).toBe(false);
  });

  test("send_proposal marks Sent, moves the stage once, and cannot run twice", async ({ request }) => {
    const token = await accessToken(request, CONVERSION);
    const api = asUser(request, token);
    const rpc = () =>
      request.post(`${URL}/rest/v1/rpc/send_proposal`, {
        headers: { apikey: KEY!, Authorization: `Bearer ${token}` },
        data: { p_proposal_id: uiProposalId, p_delivery: "Email PDF (Softcopy)" },
      });
    try {
      const first = await rpc();
      expect(first.ok(), await first.text()).toBe(true);
      const sent = await first.json();
      expect(sent.status).toBe("Sent");
      expect(sent.delivery_preference).toBe("Email PDF (Softcopy)");
      expect(sent.dispatched_at).not.toBeNull();

      const stage = await (await api.get(`lead_prospects?id=eq.${prospect.id}&select=pipeline_status`)).json();
      expect(stage[0].pipeline_status).toBe("Proposal Sent");

      const second = await rpc();
      expect(second.ok(), "a Sent proposal cannot be sent again").toBe(false);
    } finally {
      // Put the prospect back where it was so the live pipeline is unchanged.
      await api.patch(`lead_prospects?id=eq.${prospect.id}`, { pipeline_status: prospect.pipeline_status });
    }
    const restored = await (await api.get(`lead_prospects?id=eq.${prospect.id}&select=pipeline_status`)).json();
    expect(restored[0].pipeline_status).toBe(prospect.pipeline_status);
  });

  // The prospect row as it was, so the tests below can put it back exactly.
  async function originalRow(request: APIRequestContext) {
    const api = asUser(request, await accessToken(request, CONVERSION));
    const rows = await (await api.get(`lead_prospects?id=eq.${prospect.id}&select=*`)).json();
    const { id, created_at, updated_at, ...editable } = rows[0];
    void id; void created_at; void updated_at;
    return { api, editable };
  }

  test("Edit on record: the edit page loads the real prospect and Update Profile saves it", async ({ page, request }) => {
    const { api, editable } = await originalRow(request);
    const newTitle = `E2E title ${Date.now()}`;
    try {
      await signInUi(page, CONVERSION);
      await page.goto(`/donor-conv/prospects/edit-prospect?id=${prospect.id}`);
      const title = page.locator('input[name="designation"]');
      await expect(title).toHaveValue(editable.title_designation ?? "", { timeout: 15000 });
      await expect(page.locator('input[name="prospectName"]')).toHaveValue(prospect.prospect_name);

      await title.fill(newTitle);
      await page.getByRole("button", { name: "Update Profile" }).click();
      await expect(page).toHaveURL(/\/donor-conv\/prospects$/, { timeout: 15000 });

      const saved = await (await api.get(`lead_prospects?id=eq.${prospect.id}&select=title_designation`)).json();
      expect(saved[0].title_designation).toBe(newTitle);
    } finally {
      await api.patch(`lead_prospects?id=eq.${prospect.id}`, editable);
    }
    const back = await (await api.get(`lead_prospects?id=eq.${prospect.id}&select=title_designation`)).json();
    expect(back[0].title_designation).toBe(editable.title_designation);
  });

  test("Edit on record: an unknown prospect id shows a message, not another prospect", async ({ page }) => {
    await signInUi(page, CONVERSION);
    await page.goto("/donor-conv/prospects/edit-prospect?id=999999");
    await expect(page.getByText(/prospect was not found/i)).toBeVisible({ timeout: 15000 });
  });

  test("the builder shows a fix made on the record when the officer returns to it", async ({ page, request }) => {
    const { api, editable } = await originalRow(request);
    const newTitle = `E2E refreshed ${Date.now()}`;
    try {
      await signInUi(page, CONVERSION);
      await page.goto(`/donor-conv/proposals?prospectId=${prospect.id}`);
      await expect(page.getByPlaceholder("Search prospect by name or campaign...")).toHaveValue(prospect.prospect_name, { timeout: 15000 });

      // Fix the record somewhere else (like the edit page in another tab), then come back.
      await api.patch(`lead_prospects?id=eq.${prospect.id}`, { title_designation: newTitle });
      // Retry the event: the page may not have attached its listener yet right after loading.
      await expect(async () => {
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await expect(page.getByText(newTitle).first()).toBeAttached({ timeout: 1500 });
      }).toPass({ timeout: 20000 });
    } finally {
      await api.patch(`lead_prospects?id=eq.${prospect.id}`, editable);
    }
  });
});
