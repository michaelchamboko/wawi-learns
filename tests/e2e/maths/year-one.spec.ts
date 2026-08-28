import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/home/year-one-harness`;

test.describe("SLC-007-T003 — year one mathematics", () => {
  test("renders a worked example and practice step for every Year 1 outcome", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("year-one-maths-journey")).toBeVisible();
    const card = page.getByTestId("year-one-maths-card");
    await expect(card).toBeVisible();
    const workedExample = page.getByTestId("worked-example");
    const practice = page.getByTestId("practice-note");
    await expect(workedExample).toBeVisible();
    await expect(practice).toBeVisible();
    const support = page.getByTestId("support-strategy");
    await expect(support).toBeVisible();
    await page.getByRole("button", { name: "Show answer" }).click();
    await expect(page.getByTestId("year-one-maths-answer")).toBeVisible();
    await page.getByRole("button", { name: "I got it" }).click();
    await context.close();
  });

  test("stays usable offline after the lesson has loaded", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("year-one-maths-progress")).toContainText("Activity 1 of");
    await page.getByRole("button", { name: "I got it" }).click();
    await expect(page.getByTestId("year-one-maths-progress")).not.toContainText("Activity 1 of");
    await context.close();
  });
});
