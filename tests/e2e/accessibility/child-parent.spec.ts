import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/accessibility/child-parent-harness`;

test.describe("SLC-009-T003 — accessibility contract", () => {
  test("default metrics pass the contract", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("a11y-settings")).toContainText("Settings: default");
    await expect(page.getByTestId("a11y-report")).toContainText("Report: pass");
    await context.close();
  });

  test("shrinking touch target or spacing surfaces a failure", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("a11y-touch-target-40").click();
    await expect(page.getByTestId("a11y-report")).toContainText("Report: fail (AC-01");
    await page.getByTestId("a11y-touch-target-40").click();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("a11y-touch-spacing-4").click();
    await expect(page.getByTestId("a11y-report")).toContainText("Report: fail (AC-02");
    await context.close();
  });

  test("high contrast and reduced motion settings evaluate against the strict contract", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("a11y-toggle-high-contrast").click();
    await expect(page.getByTestId("a11y-settings")).toContainText("high-contrast");
    await expect(page.getByTestId("a11y-report")).toContainText("Report: pass");
    await page.getByTestId("a11y-toggle-reduced-motion").click();
    await page.getByTestId("a11y-motion-32").click();
    await expect(page.getByTestId("a11y-report")).toContainText("Report: fail (AC-05");
    await context.close();
  });
});
