import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/parent/custom-pack-harness`;

test.describe("SLC-008-T004 — custom pack", () => {
  test("validates a draft, stamps a revision, approves, and exposes only after approval", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("custom-pack-status")).toContainText("Status: draft");
    await expect(page.getByTestId("custom-pack-overlay")).toContainText("Overlay exposes: no");
    await page.getByTestId("custom-pack-validate").click();
    await expect(page.getByTestId("custom-pack-status")).toContainText("Status: validated");
    await expect(page.getByTestId("custom-pack-revision")).not.toContainText("Revision: —");
    await expect(page.getByTestId("custom-pack-overlay")).toContainText("Overlay exposes: no");
    await page.getByTestId("custom-pack-approve").click();
    await expect(page.getByTestId("custom-pack-status")).toContainText("Status: approved");
    await expect(page.getByTestId("custom-pack-overlay")).toContainText("Overlay exposes: yes");
    await context.close();
  });

  test("editing an approved pack invalidates the revision and hides from overlay", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("custom-pack-validate").click();
    await page.getByTestId("custom-pack-approve").click();
    await page.getByTestId("custom-pack-edit").click();
    await expect(page.getByTestId("custom-pack-status")).toContainText("Status: edited");
    await expect(page.getByTestId("custom-pack-overlay")).toContainText("Overlay exposes: no");
    await expect(page.getByTestId("custom-pack-revision")).toContainText("Revision: —");
    await context.close();
  });

  test("withdrawing a pack removes it from the overlay", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("custom-pack-validate").click();
    await page.getByTestId("custom-pack-approve").click();
    await page.getByTestId("custom-pack-withdraw").click();
    await expect(page.getByTestId("custom-pack-status")).toContainText("Status: withdrawn");
    await expect(page.getByTestId("custom-pack-overlay")).toContainText("Overlay exposes: no");
    await context.close();
  });
});
