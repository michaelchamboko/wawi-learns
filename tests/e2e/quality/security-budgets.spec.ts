import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/quality/security-harness`;

test.describe("SLC-009-T004 — quality and security budgets", () => {
  test("running the sanitiser redacts PII but keeps the kind", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("quality-run").click();
    await expect(page.getByTestId("quality-output")).toContainText("\"eventId\":\"ev-1\"");
    await expect(page.getByTestId("quality-output")).toContainText("\"childProfileId\":\"[redacted]\"");
    await expect(page.getByTestId("quality-output")).toContainText("\"audio\":\"[redacted]\"");
    await expect(page.getByTestId("quality-output")).toContainText("\"strokePath\":\"[redacted]\"");
    await context.close();
  });

  test("switching to a non-allowed kind still redacts PII", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("quality-kind-tts").click();
    await page.getByTestId("quality-run").click();
    await expect(page.getByTestId("quality-kind")).toContainText("Kind: tts");
    await expect(page.getByTestId("quality-output")).toContainText("\"kind\":\"tts\"");
    await expect(page.getByTestId("quality-output")).toContainText("\"childProfileId\":\"[redacted]\"");
    await context.close();
  });
});
