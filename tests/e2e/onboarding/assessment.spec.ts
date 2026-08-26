import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

test.describe("SLC-002-T004 — assessment onboarding", () => {
  test("fails closed for unauthenticated visitors", async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("parent-setup-required").or(page.getByRole("heading", { name: "Parent sign-in required" }))).toBeVisible();
    await expect(page.getByText(/no grades/i)).toHaveCount(0);
  });

  test("harness proves estimate, pause, history, adaptive completion, and no grade", async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding/assessment-harness`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("estimate-some").click();
    await expect(page.getByText(/step 1 of 20/i)).toBeVisible();
    await page.getByTestId("assessment-pause").click();
    await expect(page.getByText(/your place is saved/i)).toBeVisible();
    await page.getByTestId("assessment-resume").click();
    for (let index = 0; index < 4; index += 1) await page.getByTestId("assessment-attempt").click();
    await expect(page.getByText(/a starting point is ready/i)).toBeVisible();
    await expect(page.getByText(/grade|pass|fail/i)).toHaveCount(0);
    await page.getByTestId("assessment-restart").click();
    await expect(page.getByText(/assessment version 2/i)).toBeVisible();
    await page.getByTestId("assessment-pause").click();
    await page.getByTestId("assessment-skip").click();
    await expect(page.getByText(/continue when you are ready/i)).toBeVisible();
  });
});
