import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

test.describe("SLC-006-T005 — consent withdrawal controls", () => {
  test("withdrawal immediately disables future provider work", async ({ page }) => {
    await page.goto(`${BASE_URL}/safety/withdrawal`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("withdrawal-state")).toHaveText(/open/i);
    await page.getByTestId("request-withdrawal").click();
    await expect(page.getByTestId("withdrawal-state")).toHaveText(/pending/i);
    await expect(page.getByTestId("queue-state")).toHaveText(/blocked/i);
    await page.getByTestId("acknowledge-withdrawal").click();
    await expect(page.getByTestId("withdrawal-state")).toHaveText(/acknowledged/i);
    await expect(page.getByTestId("queue-state")).toHaveText(/blocked/i);
  });

  test("revoked storage keeps the prior envelope when an update fails", async ({ page }) => {
    await page.goto(`${BASE_URL}/safety/withdrawal`, { waitUntil: "networkidle" });
    await page.getByTestId("seed-snapshot").click();
    await page.getByTestId("break-storage").click();
    await expect(page.getByTestId("storage-status")).toHaveText(/kept/i);
  });
});
