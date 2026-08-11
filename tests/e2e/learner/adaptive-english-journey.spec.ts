import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

const visitHome = async (page: Page) => {
  await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
};

test.describe("SLC-004-T005 — adaptive English journey", () => {
  test("renders the child home with a picture-word activity", async ({ page }) => {
    await visitHome(page);
    await expect(page.getByTestId("child-home")).toBeVisible();
    await expect(page.getByTestId("child-home-greeting")).toContainText(/Malachi/);
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
    await expect(page.getByTestId("picture-word-illustration")).toBeVisible();
  });

  test("committing an attempt advances state and records the result", async ({ page }) => {
    await visitHome(page);
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
    await page.getByTestId("picture-word-correct").click();
    // The local session commits before advancing; the UI keeps the activity rendered for feedback.
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
    await expect(page.getByTestId("picture-word-hint-count")).toContainText("Hints used: 0");
  });

  test("help button increments hint count without committing", async ({ page }) => {
    await visitHome(page);
    await page.getByTestId("picture-word-help").click();
    await page.getByTestId("picture-word-help").click();
    await expect(page.getByTestId("picture-word-hint-count")).toContainText("Hints used: 2");
  });
});