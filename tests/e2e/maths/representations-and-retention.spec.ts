import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

test.describe("SLC-007-T004 — maths representations and retention", () => {
  test("the child home renders the offline-first maths fallback", async ({ page }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
  });
});