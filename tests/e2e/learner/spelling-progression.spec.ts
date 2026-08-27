import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-005-T002 — spelling progression (shell-level contract).
 *
 * The spelling activity flow (decode/encode progression scored by the spelling
 * engine) runs inside the authenticated session. This spec verifies the
 * reachable learner-shell entry contract it launches from. The pure spelling
 * engine is covered by tests/unit/learning-engine/spelling.test.ts.
 */
test.describe("SLC-005-T002 — spelling progression (shell entry)", () => {
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
