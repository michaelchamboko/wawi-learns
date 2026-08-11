import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

const gotoHome = async (page: Page) => {
  await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("picture-word-activity")).toBeVisible();
};

test.describe("SLC-005-T005 — multimodal lesson", () => {
  test("renders the picture-word activity as the default modality", async ({ page }) => {
    await gotoHome(page);
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
  });

  test("child can request help, increment hints, and then submit", async ({ page }) => {
    await gotoHome(page);
    await page.getByTestId("picture-word-help").click();
    await page.getByTestId("picture-word-help").click();
    await expect(page.getByTestId("picture-word-hint-count")).toContainText("Hints used: 2");
    await page.getByTestId("picture-word-correct").click();
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
  });

  test("the activity survives an accidental double-tap on the correct button", async ({ page }) => {
    await gotoHome(page);
    await page.getByTestId("picture-word-correct").click();
    await page.getByTestId("picture-word-correct").click({ force: true });
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
  });
});