import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/release/rollback-harness`;

test.describe("SLC-009-T005 — release rollback and smoke", () => {
  test("promotes to a candidate and waits for a passing smoke gate", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("release-promote").click();
    await expect(page.getByTestId("release-stage")).toContainText("promoting");
    await expect(page.getByTestId("release-active")).toContainText("1.1.0");
    await page.getByTestId("release-smoke-pass").click();
    await expect(page.getByTestId("release-stage")).toContainText("live");
    await context.close();
  });

  test("rolls back to the last known good and preserves attempts", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("release-promote").click();
    await page.getByTestId("release-smoke-pass").click();
    await expect(page.getByTestId("release-stage")).toContainText("live");
    await page.getByTestId("release-rollback").click();
    await expect(page.getByTestId("release-stage")).toContainText("rolled-back");
    await expect(page.getByTestId("release-active")).toContainText("1.0.0");
    await expect(page.getByTestId("release-preserved")).toContainText("yes");
    await context.close();
  });
});
