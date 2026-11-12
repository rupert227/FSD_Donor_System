import {
  test,
  expect,
  request as pwRequest,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

// DTI0-35 Send screen tests. They run against the LIVE Supabase project and the running app,
// which must be in the default test mode (MAIL_MODE unset): the email is built with its PDF
// but nothing is delivered. Sent proposals cannot be deleted from the app, so the rows these
// tests create are removed by hand afterwards (the letter text starts with "E2E SEND TEST").
//
// Run with: TEST_PASSWORD=... E2E_SUPABASE_URL=... E2E_SUPABASE_KEY=... npm run test:e2e -- e2e/send-proposal.spec.ts
const PASSWORD = process.env.TEST_PASSWORD;
const URL = process.env.E2E_SUPABASE_URL;
const KEY = process.env.E2E_SUPABASE_KEY;
const skip = !PASSWORD || !URL || !KEY;
const CONVERSION = "conversion.officer@example.test";

async function accessToken(request: APIRequestContext, email: string) {
  const res = await request.post(`${URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: KEY! },
    data: { email, password: PASSWORD },
  });
  expect(res.ok(), `sign-in as ${email}`).toBeTruthy();
  return (await res.json()).access_token as string;
}

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

test.describe("DTI0-35 send proposal", () => {
  test.skip(
    skip,
    "TEST_PASSWORD, E2E_SUPABASE_URL or E2E_SUPABASE_KEY not set",
  );

  type Prospect = {
    id: number;
    prospect_name: string;
    pipeline_status: string;
    email_address: string | null;
  };
  // Our own request context (the per-test one cannot be used across tests).
  let ctx: APIRequestContext;
  let api: ReturnType<typeof asUser>;
  let prospect: Prospect;
  let spare: Prospect;
  // Put back at the end, so the live pipeline and records are unchanged.
  const restore: (() => Promise<unknown>)[] = [];

  test.beforeAll(async () => {
    ctx = await pwRequest.newContext();
    api = asUser(ctx, await accessToken(ctx, CONVERSION));
    const rows: Prospect[] = await (
      await api.get(
        "lead_prospects?select=id,prospect_name,pipeline_status,email_address&pipeline_status=eq.Outreach Started&email_address=not.is.null&order=id&limit=2",
      )
    ).json();
    expect(rows.length).toBe(2);
    [prospect, spare] = rows;
  });

  test.afterAll(async () => {
    for (const undo of restore) await undo();
    await ctx.dispose();
  });

  async function newProposal(forProspect: Prospect) {
    const res = await api.post("proposals", {
      prospect_id: forProspect.id,
      template_id: "standard",
      letter_date: "2026-11-12",
      signatory_name: "Rupert Tabilin",
      signatory_title: "Division Head",
      letter_text: `E2E SEND TEST\n\nDear Sir or Madam,\n\nPlease consider this proposal from Caritas Manila.`,
    });
    expect(res.ok(), await res.text()).toBe(true);
    const id = (await res.json())[0].id as number;
    // Sending moves the prospect forward; put it back afterwards.
    restore.push(() =>
      api.patch(`lead_prospects?id=eq.${forProspect.id}`, {
        pipeline_status: forProspect.pipeline_status,
      }),
    );
    return id;
  }

  test("the screen shows the saved letter, a template message and the PDF to attach", async ({
    page,
    request,
  }) => {
    const id = await newProposal(prospect);
    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals/send-proposal?proposalId=${id}`);

    await expect(
      page.getByText("Please consider this proposal from Caritas Manila."),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#subject")).toHaveValue(
      /Partnership proposal from Caritas Manila/,
    );
    await expect(page.locator("#message")).toHaveValue(
      /Greetings of Peace and Compassion/,
    );
    await expect(
      page.getByText(/Attached:\s*Proposal_.*_2026\.pdf/),
    ).toBeVisible();
    await expect(page.getByText(/Test mode/)).toBeVisible();
    void request;
  });

  test("Reset to template and Clear message", async ({ page }) => {
    const id = await newProposal(prospect);
    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals/send-proposal?proposalId=${id}`);
    const message = page.locator("#message");
    await expect(message).toHaveValue(/Greetings of Peace/, { timeout: 15000 });

    await page.getByRole("button", { name: "Clear message" }).click();
    await expect(message).toHaveValue("");
    await page.getByRole("button", { name: "Reset to template" }).click();
    await expect(message).toHaveValue(/Greetings of Peace/);
  });

  test("Email: confirm, send in test mode, and the proposal and stage are updated", async ({
    page,
  }) => {
    const id = await newProposal(prospect);
    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals/send-proposal?proposalId=${id}`);
    await expect(page.locator("#subject")).toHaveValue(/Partnership proposal/, {
      timeout: 15000,
    });

    await page.locator("#subject").fill("E2E custom subject");
    await page
      .locator("#message")
      .fill("E2E custom message written from scratch.");
    await page.getByRole("button", { name: "Send proposal" }).click();
    // It asks first, and nothing is sent yet.
    await expect(
      page.getByText(
        /Send this email with the PDF to .* This cannot be undone/,
      ),
    ).toBeVisible();
    const before = await (
      await api.get(`proposals?id=eq.${id}&select=status`)
    ).json();
    expect(before[0].status).toBe("Generated");

    await page.getByRole("button", { name: "Confirm and send" }).click();
    await expect(
      page.getByText(/test mode: no email reached the prospect/i),
    ).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/donor-conv\/proposals$/, {
      timeout: 15000,
    });

    const sent = (
      await (await api.get(`proposals?id=eq.${id}&select=*`)).json()
    )[0];
    expect(sent.status).toBe("Sent");
    expect(sent.delivery_preference).toBe("Email PDF (Softcopy)");
    expect(sent.dispatched_at).not.toBeNull();
    expect(sent.email_subject).toBe("E2E custom subject");
    expect(sent.email_body).toBe("E2E custom message written from scratch.");
    const stage = await (
      await api.get(
        `lead_prospects?id=eq.${prospect.id}&select=pipeline_status`,
      )
    ).json();
    expect(stage[0].pipeline_status).toBe("Proposal Sent");
  });

  test("Postal Mail: nothing is emailed, the proposal is recorded as sent", async ({
    page,
  }) => {
    const id = await newProposal(spare);
    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals/send-proposal?proposalId=${id}`);
    await expect(page.locator("#delivery")).toBeVisible({ timeout: 15000 });

    await page.locator("#delivery").selectOption("Postal Mail");
    await expect(page.getByText(/Nothing is emailed/)).toBeVisible();
    await expect(page.locator("#subject")).toHaveCount(0);
    await page.getByRole("button", { name: "Send proposal" }).click();
    await page.getByRole("button", { name: "Confirm and send" }).click();
    await expect(page).toHaveURL(/\/donor-conv\/proposals$/, {
      timeout: 20000,
    });

    const sent = (
      await (await api.get(`proposals?id=eq.${id}&select=*`)).json()
    )[0];
    expect(sent.status).toBe("Sent");
    expect(sent.delivery_preference).toBe("Postal Mail");
    expect(sent.email_subject).toBeNull();
    expect(sent.email_body).toBeNull();
  });

  test("a prospect without an email cannot be sent by email", async ({
    page,
  }) => {
    const id = await newProposal(spare);
    // Take the email off the record for this test, and put it back after.
    await api.patch(`lead_prospects?id=eq.${spare.id}`, {
      email_address: null,
    });
    restore.push(() =>
      api.patch(`lead_prospects?id=eq.${spare.id}`, {
        email_address: spare.email_address,
      }),
    );

    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals/send-proposal?proposalId=${id}`);
    await expect(page.getByText(/no valid email address/)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: "Send proposal" }),
    ).toBeDisabled();

    // Another delivery option still works.
    await page.locator("#delivery").selectOption("Hand Delivered");
    await expect(
      page.getByRole("button", { name: "Send proposal" }),
    ).toBeEnabled();
  });

  test("a badly formed email is refused on screen and by the database", async ({
    page,
  }) => {
    const id = await newProposal(spare);
    await api.patch(`lead_prospects?id=eq.${spare.id}`, {
      email_address: "a@b",
    });
    restore.push(() =>
      api.patch(`lead_prospects?id=eq.${spare.id}`, {
        email_address: spare.email_address,
      }),
    );

    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals/send-proposal?proposalId=${id}`);
    await expect(page.getByText(/no valid email address/)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: "Send proposal" }),
    ).toBeDisabled();

    // Calling send_proposal directly (skipping the screen) is refused too, and
    // nothing changes: the proposal is still Generated.
    const direct = await api.post("rpc/send_proposal", {
      p_proposal_id: id,
      p_delivery: "Email PDF (Softcopy)",
    });
    expect(direct.status()).toBe(400);
    expect(await direct.text()).toMatch(/no valid email address/);
    const [row] = await (
      await api.get(`proposals?select=status&id=eq.${id}`)
    ).json();
    expect(row.status).toBe("Generated");

    // Postal Mail does not need an email, so the database allows it.
    const post = await api.post("rpc/send_proposal", {
      p_proposal_id: id,
      p_delivery: "Postal Mail",
    });
    expect(post.ok(), await post.text()).toBe(true);
  });

  test("a proposal that was already sent is shown read-only, with what was sent", async ({
    page,
  }) => {
    const id = await newProposal(prospect);
    const send = await (async () => {
      const token = await accessToken(page.request, CONVERSION);
      return page.request.post(`${URL}/rest/v1/rpc/send_proposal`, {
        headers: { apikey: KEY!, Authorization: `Bearer ${token}` },
        data: {
          p_proposal_id: id,
          p_delivery: "Email PDF (Softcopy)",
          p_email_subject: "E2E earlier subject",
          p_email_body: "E2E earlier body",
        },
      });
    })();
    expect(send.ok(), await send.text()).toBe(true);

    await signInUi(page, CONVERSION);
    await page.goto(`/donor-conv/proposals/send-proposal?proposalId=${id}`);
    await expect(page.getByText("This proposal has been sent.")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("E2E earlier subject")).toBeVisible();
    await expect(page.getByText("E2E earlier body")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send proposal" }),
    ).toHaveCount(0);
  });

  test("an unknown proposal id shows a message", async ({ page }) => {
    await signInUi(page, CONVERSION);
    await page.goto("/donor-conv/proposals/send-proposal?proposalId=999999");
    await expect(page.getByText(/proposal was not found/i)).toBeVisible({
      timeout: 15000,
    });
    await page.goto("/donor-conv/proposals/send-proposal");
    await expect(page.getByText(/proposal was not found/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
