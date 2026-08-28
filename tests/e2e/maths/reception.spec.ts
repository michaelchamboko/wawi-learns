import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/home/reception-harness`;

test.describe("SLC-007-T002 — reception mathematics", () => {
  test("renders a worked example and practice step for every Reception outcome", async ({ page }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("reception-maths-journey")).toBeVisible();

    const progress = page.getByTestId("reception-maths-progress");
    const workedExample = page.getByTestId("worked-example");
    const practice = page.getByTestId("practice-note");

    for (let step = 1; step <= 13; step += 1) {
      await expect(progress).toHaveText(`Activity ${step} of 13`);
      await expect(workedExample).toContainText(/Worked example:/i);
      await expect(practice).toBeVisible();
      await page.getByRole("button", { name: "Show answer" }).click();
      await expect(page.getByTestId("reception-answer")).toBeVisible();
      await page.getByRole("button", { name: "I got it" }).click();
    }

    await expect(page.getByTestId("reception-maths-complete")).toBeVisible();
    await expect(page.getByTestId("reception-maths-summary")).toHaveText(/13 reception outcomes rehearsed/);
  });

  test("stays usable offline after the lesson has loaded", async ({ browser }) => {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await context.setOffline(true);

    await expect(page.getByTestId("reception-maths-progress")).toHaveText("Activity 1 of 13");
    await page.getByRole("button", { name: "I got it" }).click();
    await expect(page.getByTestId("reception-maths-progress")).toHaveText("Activity 2 of 13");
    await context.close();
  });
});
