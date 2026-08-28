import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/parent/overrides-harness`;

test.describe("SLC-008-T003 — audited parent overrides", () => {
  test("renders baseline overrides and never grants evidence", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("overrides-target")).toContainText("Target minutes: 20");
    await expect(page.getByTestId("overrides-mic")).toContainText("Mic enabled: yes");
    await expect(page.getByTestId("overrides-audit")).toContainText("evidence granted: no");
    await context.close();
  });

  test("setting a new target, balanced subjects, and disabling mic all apply without granting evidence", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("overrides-set-target").click();
    await expect(page.getByTestId("overrides-target")).toContainText("Target minutes: 45");
    await page.getByTestId("overrides-enable-balanced").click();
    await expect(page.getByTestId("overrides-subject")).toContainText("Subject balance: balanced");
    await page.getByTestId("overrides-disable-mic").click();
    await expect(page.getByTestId("overrides-mic")).toContainText("Mic enabled: no");
    await expect(page.getByTestId("overrides-audit")).toContainText("evidence granted: no");
    await context.close();
  });
});
