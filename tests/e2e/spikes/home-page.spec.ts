import { test, expect } from "@playwright/test";

test.describe("SLC-011-T004 — Child home and learner journey (parent auth)", () => {
  test("shows parent authentication form when not authenticated", async ({ page }) => {
    await page.goto("/home", { waitUntil: "networkidle" });
    // Check for the parent auth card
    await expect(page.getByText(/Parent area/i)).toBeVisible();
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});