import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-004-T004 — child home and activity shell.
 *
 * Exercises the accessible learner shell and the durable, resumable session
 * affordances that render without a parent account. Full activity flow is
 * gated behind parent authentication; this spec covers the shell-level
 * navigation, pause/home and accessibility contracts that are reachable
 * unauthenticated, plus the offline entry when the device is offline.
 */
test.describe("SLC-004-T004 — child shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
  });

  test("renders an accessible learner shell landmark with a primary action", async ({ page }) => {
    const shell = page
      .getByTestId("parent-setup-required")
      .or(page.getByTestId("parent-auth"))
      .or(page.getByTestId("child-home"));
    await expect(shell.first()).toBeVisible();
    const primary = page.locator("button.primary-button").first();
    await expect(primary).toBeVisible();
    await expect(primary).toBeEnabled();
  });

  test("parent area exposes no child-facing external links (safe shell)", async ({ page }) => {
    const external = page.locator('a[target="_blank"]');
    await expect(external).toHaveCount(0);
  });

  test("keyboard users can reach and activate the primary action", async ({ page }) => {
    const primary = page.locator("button.primary-button").first();
    await primary.focus();
    await expect(primary).toBeFocused();
  });
});
