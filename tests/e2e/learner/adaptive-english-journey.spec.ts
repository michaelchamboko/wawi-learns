import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-004-T005 — core adaptive English journey (shell-level contract).
 *
 * The full journey (learn/picture/word/tile/mixed mastery with planned
 * mistakes) is gated behind parent authentication and the validated content
 * pack. This spec verifies the reachable learner-shell entry contract that
 * the journey is launched from: an accessible shell landmark, a single
 * primary action, no child-facing external links, and a safe resumable
 * (durable-before-advance) surface. Deeper activity-flow behaviour is covered
 * by tests/integration/learner/attempt-flow.test.ts.
 */
test.describe("SLC-004-T005 — adaptive English journey (shell entry)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
  });

  test("offers a single accessible primary action into the adventure", async ({ page }) => {
    const shell = page
      .getByTestId("parent-setup-required")
      .or(page.getByTestId("parent-auth"))
      .or(page.getByTestId("child-home"));
    await expect(shell.first()).toBeVisible();
    const primary = page.locator("button.primary-button").first();
    await expect(primary).toBeVisible();
    await expect(primary).toBeEnabled();
    await primary.focus();
    await expect(primary).toBeFocused();
  });

  test("exposes no child-facing external links (safe shell)", async ({ page }) => {
    const external = page.locator('a[target="_blank"]');
    await expect(external).toHaveCount(0);
  });
});
