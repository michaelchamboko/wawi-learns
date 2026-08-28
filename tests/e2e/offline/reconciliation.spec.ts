import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/offline/reconciliation-harness`;

test.describe("SLC-009-T002 — reconciliation", () => {
  test("accepts a clean ordered batch", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("reconcile-accepted")).toContainText("a");
    await expect(page.getByTestId("reconcile-accepted")).toContainText("b");
    await expect(page.getByTestId("reconcile-accepted")).toContainText("c");
    await expect(page.getByTestId("reconcile-revoked")).toContainText("Revoked seen: no");
    await context.close();
  });

  test("marking an install revoked evicts its events before any display", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("reconcile-mark-revoked").click();
    await expect(page.getByTestId("reconcile-evicted")).toContainText("Evicted: c");
    await expect(page.getByTestId("reconcile-revoked")).toContainText("Revoked seen: yes");
    await expect(page.getByTestId("reconcile-accepted")).toContainText("Accepted: a, b");
    await context.close();
  });

  test("toggle duplicate and out-of-order gap both surface the right counters", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("reconcile-toggle-duplicate").click();
    await expect(page.getByTestId("reconcile-dedup")).toContainText("Deduped: a");
    await page.getByTestId("reconcile-toggle-gap").click();
    await expect(page.getByTestId("reconcile-gap")).toContainText("Gap detected: yes");
    await context.close();
  });
});
