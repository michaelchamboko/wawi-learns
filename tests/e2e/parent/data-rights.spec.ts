import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/parent/data-rights-harness`;

test.describe("SLC-008-T005 — data rights and verified deletion", () => {
  test("walks the full deletion state machine to complete", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    const steps = [
      "consent-revoked",
      "pending-events-cancelled",
      "server-marked",
      "local-purged",
      "queue-evicted",
      "overlay-evicted",
      "complete",
    ];
    for (const step of steps) {
      await page.getByTestId(`data-rights-step-${step}`).click();
    }
    await expect(page.getByTestId("data-rights-completed")).toContainText("Completed: 20");
    await expect(page.getByTestId("data-rights-failure")).toContainText("Failure: none");
    await context.close();
  });

  test("jumping ahead of the sequence records a failure", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("data-rights-jump-local").click();
    await expect(page.getByTestId("data-rights-failure")).toContainText("out-of-order");
    await context.close();
  });

  test("replaying the same step is idempotent", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("data-rights-step-consent-revoked").click();
    const before = await page.getByTestId("data-rights-steps").textContent();
    await page.getByTestId("data-rights-step-consent-revoked").click();
    const after = await page.getByTestId("data-rights-steps").textContent();
    expect(after).toEqual(before);
    await context.close();
  });
});
