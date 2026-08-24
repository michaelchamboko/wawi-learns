import { test, expect } from "@playwright/test";

test.describe("SLC-011-T004 — Child home and learner journey", () => {
  test("renders the storybook trail, activity renderer, and controls", async ({ page }) => {
    await page.goto("/home");
    // Check for the storybook trail
    await expect(page.getByText(/Storybook Trail/i)).toBeVisible();
    // Check for the activity renderer
    await expect(page.getByText(/Activity Renderer/i)).toBeVisible();
    // Check for the controls
    await expect(page.getByText(/Controls/i)).toBeVisible();
  });
});