import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/parent/dashboard-harness`;

test.describe("SLC-008-T002 — evidence-backed parent dashboard", () => {
  test("renders the evidence-backed dashboard with the week window and weak reasons", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("parent-dashboard")).toBeVisible();
    await expect(page.getByTestId("parent-dashboard-window")).toContainText("Window: week");
    await expect(page.getByTestId("parent-dashboard-attempts")).toContainText("Total attempts: 6");
    await expect(page.getByTestId("parent-dashboard-weak").locator("li")).toHaveCount(1);
    await context.close();
  });

  test("switching to the baseline window and revoking the pack surfaces uncertainty", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("parent-dashboard-window-baseline").click();
    await expect(page.getByTestId("parent-dashboard-window")).toContainText("Window: baseline");
    await page.getByTestId("parent-dashboard-pack-revoked").click();
    await expect(page.getByTestId("parent-dashboard-pack")).toContainText("Pack: revoked");
    await expect(page.getByTestId("parent-dashboard-uncertainty")).toContainText("pack-revoked");
    await context.close();
  });

  test("a sync gap blocks the AI-ready claims signal", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("parent-dashboard-sync-gap").click();
    await expect(page.getByTestId("parent-dashboard-sync")).toContainText("Sync: gap");
    await expect(page.getByTestId("parent-dashboard-backed")).toContainText("Claims backed by evidence: no");
    await context.close();
  });
});
