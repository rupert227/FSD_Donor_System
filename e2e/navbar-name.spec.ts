import { test, expect } from "@playwright/test";

// Passwords are never written here. Run with: TEST_PASSWORD=<test account password> npx playwright test navbar-name
const PASSWORD = process.env.TEST_PASSWORD;

// The sample names inserted into officer_profiles for the test accounts.
const ACCOUNTS = [
  { email: "conversion.officer@example.test", fullName: "Maria Santos", role: "Conversion Officer" },
  { email: "retention.officer@example.test", fullName: "Paolo Reyes", role: "Retention Officer" },
  { email: "donorcare.officer@example.test", fullName: "Angela Cruz", role: "Donor Care Officer" },
  { email: "division.head@example.test", fullName: "Ramon Villanueva", role: "Division Head" },
  { email: "sys.admin@example.test", fullName: "Carla Mendoza", role: "System Administrator" },
];

test.skip(!PASSWORD, "Set TEST_PASSWORD to run the navbar name tests");

for (const { email, fullName, role } of ACCOUNTS) {
  test(`navbar shows the full name for ${role}`, async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", PASSWORD!);
    await page.getByRole("button", { name: /^Sign in$/ }).click();
    await expect(page).not.toHaveURL(/\/login/);

    // The profile button in the top-right of the navbar.
    const profileButton = page.locator("header button", { hasText: fullName });
    await expect(profileButton).toBeVisible();
    // Full name is the main line, email is the secondary line.
    await expect(profileButton).toContainText(fullName);
    await expect(profileButton).toContainText(email);
    // The email prefix fallback must not be what is shown as the name.
    await expect(profileButton).not.toContainText("Loading");

    // The dropdown footer lists name, email and role.
    await profileButton.click();
    const footer = page.locator("header").getByText(role, { exact: true });
    await expect(footer).toBeVisible();
  });
}
