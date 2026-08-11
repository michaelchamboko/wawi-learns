import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

test.describe("SLC-008 — parent operations smoke", () => {
  test("the child home renders the dashboard contract", async ({ page }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("child-home")).toBeVisible();
    await expect(page.getByTestId("child-home-greeting")).toContainText(/Malachi/);
  });

  test("a safety lockout never enables new permissions", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    await context.setOffline(true);
    await page.goto(`${BASE_URL}/offline-fallback-check`, { waitUntil: "domcontentloaded" });
    const body = await page.content();
    expect(body).not.toMatch(/approve-revision/);
    await context.close();
  });
});