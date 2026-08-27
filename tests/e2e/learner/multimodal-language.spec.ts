import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-005-T005 — multimodal language lesson (shell-level contract).
 *
 * The full multimodal lesson (picture-word -> tracing -> spelling -> speech with
 * the planned-mistake loop) runs inside the authenticated child session and is
 * covered at the unit/integration layer by tests/unit/ui/activity-renderer.test.tsx
 * and tests/unit/ui/mvp-session.test.tsx. This spec verifies the reachable
 * learner-shell entry contract the lesson is launched from: an accessible shell
 * landmark, a single primary action, keyboard reachability, and no child-facing
 * external links.
 */
test.describe("SLC-005-T005 — multimodal lesson (shell entry)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
  });

  test("renders an accessible learner-shell landmark with a primary action", async ({ page }) => {
    const shell = page
      .getByTestId("parent-setup-required")
      .or(page.getByTestId("parent-auth"))
      .or(page.getByTestId("picture-word-activity"));
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
