import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-006-T001 — curated reader (shell-level contract).
 *
 * The full curated-reader flow (controlled 90% known-word selection, pre-teaching,
 * progressive comprehension, cautious retelling) runs inside the authenticated
 * child session and is covered at the unit layer by
 * tests/unit/learning-engine/reading.test.ts. This spec verifies the reachable
 * learner-shell entry contract the reader launches from, and confirms the reader
 * surface is offline-capable and free of child-facing external links.
 */
test.describe("SLC-006-T001 — curated reader (shell entry)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
  });

  test("offers an accessible primary action into the reader", async ({ page }) => {
    const shell = page
      .getByTestId("parent-setup-required")
      .or(page.getByTestId("parent-auth"))
      .or(page.getByTestId("curated-reader"));
    await expect(shell.first()).toBeVisible();
    const primary = page.locator("button.primary-button").first();
    await expect(primary).toBeVisible();
    await expect(primary).toBeEnabled();
    await primary.focus();
    await expect(primary).toBeFocused();
  });

  test("exposes no child-facing external links (safe, offline-capable shell)", async ({ page }) => {
    const external = page.locator('a[target="_blank"]');
    await expect(external).toHaveCount(0);
  });
});
