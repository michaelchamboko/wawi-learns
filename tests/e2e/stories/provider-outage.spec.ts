import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

test.describe("SLC-006-T005 — provider outage controls", () => {
  test("shows the fallback path when the provider circuit is open", async ({ page }) => {
    await page.goto(`${BASE_URL}/safety/provider-outage`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("provider-status")).toHaveText(/available/i);
    await page.getByTestId("simulate-outage").click();
    await expect(page.getByTestId("provider-status")).toHaveText(/circuit-open/i);
    await expect(page.getByTestId("provider-fallback")).toHaveText(/fallback/i);
  });

  test("blocks repeated provider work after a duplicate request", async ({ page }) => {
    await page.goto(`${BASE_URL}/safety/provider-outage`, { waitUntil: "networkidle" });
    await page.getByTestId("send-request").click();
    await page.getByTestId("send-request").click();
    await expect(page.getByTestId("budget-reason")).toHaveText(/duplicate-recent/i);
  });
});
