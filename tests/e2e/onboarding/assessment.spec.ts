import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

test.describe("SLC-002-T004 — assessment onboarding", () => {
  test("fails closed for unauthenticated visitors", async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Parent sign-in required" })).toBeVisible();
    await expect(page.getByText(/no grades/i)).toHaveCount(0);
  });

  test("authenticated assessment journey requires an explicit storage state", async ({ browser }) => {
    test.skip(!process.env.WAWI_E2E_AUTH_STORAGE, "requires an approved parent storage state");
    const context = await browser.newContext({ storageState: process.env.WAWI_E2E_AUTH_STORAGE });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("assessment-start").or(page.getByTestId("assessment-session")).or(page.getByTestId("assessment-incomplete"))).toBeVisible();
    await context.close();
  });
});
