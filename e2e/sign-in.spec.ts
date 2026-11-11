import { test, expect, type Page } from "@playwright/test";

// Passwords are never written here. Run with: TEST_PASSWORD=<test account password> npm run test:e2e
const PASSWORD = process.env.TEST_PASSWORD;
const needsPassword = !PASSWORD;

const ALL = ["Dashboard", "Donor Conversion", "Donor Retention", "Donor Care"];
const ROLES = [
  { email: "conversion.officer@example.test", role: "Conversion Officer", landing: "/donor-conv/prospects", modules: ["Donor Conversion"], blocked: ["/donor-retn/donors", "/donor-care/transactions", "/dashboard"] },
  { email: "retention.officer@example.test", role: "Retention Officer", landing: "/donor-retn/donors", modules: ["Donor Retention"], blocked: ["/donor-conv/prospects", "/donor-care/transactions", "/dashboard"] },
  { email: "donorcare.officer@example.test", role: "Donor Care Officer", landing: "/donor-care/transactions", modules: ["Donor Care"], blocked: ["/donor-conv/prospects", "/donor-retn/donors", "/dashboard"] },
  { email: "division.head@example.test", role: "Division Head", landing: "/dashboard", modules: ALL, blocked: [] },
  { email: "sys.admin@example.test", role: "System Administrator", landing: "/dashboard", modules: ALL, blocked: [] },
];

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
}

test.describe("AC1 email and password required", () => {
  test("both fields are required and empty submit is rejected", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toHaveAttribute("required", "");
    await expect(page.locator("#password")).toHaveAttribute("required", "");
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page.locator("form [role=alert]")).toContainText("Enter your email address and password");
    await expect(page).toHaveURL(/\/login/);
  });
  test("email only is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "someone@example.test");
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page.locator("form [role=alert]")).toContainText("Enter your email address and password");
  });
});

test.describe("AC2 password masked with toggle", () => {
  test("masked by default, toggle shows then hides", async ({ page }) => {
    await page.goto("/login");
    const pw = page.locator("#password");
    await expect(pw).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(pw).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(pw).toHaveAttribute("type", "password");
  });
});

test.describe("AC3 wrong credentials", () => {
  test("same generic error for wrong password and unknown email, shown above the form", async ({ page }) => {
    const messages: string[] = [];
    for (const email of ["division.head@example.test", "nobody.here@example.test"]) {
      await signIn(page, email, "definitely-wrong-password-123");
      const alert = page.locator("form [role=alert]");
      await expect(alert).toBeVisible();
      messages.push((await alert.innerText()).trim());
      const a = await alert.boundingBox();
      const f = await page.locator("#email").boundingBox();
      expect(a!.y).toBeLessThan(f!.y); // above the fields
      await expect(page).toHaveURL(/\/login/);
    }
    expect(messages[0]).toBe(messages[1]);
    expect(messages[0]).toMatch(/incorrect email or password/i);
    expect(messages[0]).not.toMatch(/^(email|password)\b.*(wrong|invalid)/i);
  });
});

test.describe("AC4 suspended account", () => {
  test("suspended user cannot sign in and is told to contact the admin", async ({ page }) => {
    test.skip(needsPassword, "TEST_PASSWORD not set");
    await signIn(page, "suspended.officer@example.test", PASSWORD!);
    await expect(page.locator("form [role=alert]")).toContainText(/suspended.*System Administrator/i);
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/donor-conv/prospects"); // no session was kept
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("AC5 landing page and role-limited modules", () => {
  for (const r of ROLES) {
    test(`${r.role}: lands correctly, sees only allowed modules, blocked elsewhere`, async ({ page }) => {
      test.skip(needsPassword, "TEST_PASSWORD not set");
      await signIn(page, r.email, PASSWORD!);
      await expect(page).toHaveURL(new RegExp(`${r.landing}$`), { timeout: 15000 });

      await page.locator("button", { hasText: /^(Dashboard|Donor Conversion|Donor Retention|Donor Care)$/ }).first().click();
      const PREFIX = ["/dashboard", "/donor-conv", "/donor-retn", "/donor-care"];
      const wanted = ALL.filter((l) => r.modules.includes(l));
      // The navbar loads the role in the browser, so wait for the list to settle.
      await expect.poll(async () => {
        const hrefs = await page.locator('a[href^="/dashboard"], a[href^="/donor-"]').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
        return ALL.filter((_, i) => hrefs.some((h) => h.startsWith(PREFIX[i]))).sort();
      }, { timeout: 10000 }).toEqual([...wanted].sort());

      for (const path of r.blocked) {
        await page.goto(path);
        await expect(page).not.toHaveURL(new RegExp(`${path}$`));
      }
      if (r.role !== "Division Head" && r.role !== "System Administrator") {
        const res = await page.request.get("/api/lead-pipeline-report", { maxRedirects: 0 });
        if (r.role === "Conversion Officer") expect(res.status()).toBe(200);
        else expect([302, 307, 401, 403]).toContain(res.status());
      }
    });
  }
});

test.describe("Signed-out visitors", () => {
  for (const path of ["/dashboard", "/donor-conv/prospects", "/donor-retn/donors", "/donor-care/transactions", "/notifications"]) {
    test(`${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
  test("module API route is not public", async ({ request }) => {
    const res = await request.get("/api/lead-pipeline-report", { maxRedirects: 0 });
    expect([302, 307, 401, 403]).toContain(res.status());
  });
});

test.describe("AC6 forgot password", () => {
  test("link starts the reset flow", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    const form = page.locator("form", { hasText: "Reset your password" });
    await expect(form.locator("#email")).toBeVisible();
    await expect(form.getByRole("button", { name: "Send reset link" })).toBeVisible();
  });
});

test.describe("Logout", () => {
  test("logout ends the session", async ({ page }) => {
    test.skip(needsPassword, "TEST_PASSWORD not set");
    await signIn(page, "division.head@example.test", PASSWORD!);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15000 });
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });
    await page.locator("button", { hasText: "division.head" }).click();
    await page.getByText("Logout", { exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
