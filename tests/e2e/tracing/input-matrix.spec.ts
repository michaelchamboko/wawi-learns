import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-005-T001 — tracing input matrix (shell-level contract).
 *
 * The full tracing input surface (pointer/touch samples scored by scoreTrace)
 * is exercised inside the authenticated activity flow. This spec verifies the
 * reachable learner-shell entry that the tracing activity is launched from: an
 * accessible shell landmark, a single primary action, and no child-facing
 * external links. The pure scorer is covered by tests/unit/tracing/score-trace.
 */
test.describe("SLC-005-T001 — tracing input matrix (shell entry)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
  });

  test("offers an accessible primary action into the activity", async ({ page }) => {
    const shell = page
      .getByTestId("parent-setup-required")
      .or(page.getByTestId("parent-auth"))
      .or(page.getByTestId("child-home"));
    await expect(shell.first()).toBeVisible();
    const primary = page.locator("button.primary-button").first();
    await expect(primary).toBeVisible();
    await expect(primary).toBeEnabled();
  });

  test("exposes no child-facing external links (safe shell)", async ({ page }) => {
    const external = page.locator('a[target="_blank"]');
    await expect(external).toHaveCount(0);
  });
});
