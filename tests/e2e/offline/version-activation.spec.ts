import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/offline/version-activation-harness`;

test.describe("SLC-009-T001 — version activation", () => {
  test("accepts the canonical version set", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("version-result")).toContainText("Pin result: ok");
    await context.close();
  });

  test("rejects incompatible engine, pack, schema and unknown shell", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("version-preset-badEngine").click();
    await expect(page.getByTestId("version-result")).toContainText("incompatible-engine");
    await page.getByTestId("version-preset-badPack").click();
    await expect(page.getByTestId("version-result")).toContainText("incompatible-pack");
    await page.getByTestId("version-preset-badSchema").click();
    await expect(page.getByTestId("version-result")).toContainText("incompatible-schema");
    await page.getByTestId("version-preset-unknownShell").click();
    await expect(page.getByTestId("version-result")).toContainText("unknown-shell-revision");
    await context.close();
  });

  test("switching back to the canonical version restores activation", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("version-preset-badPack").click();
    await expect(page.getByTestId("version-result")).toContainText("incompatible-pack");
    await page.getByTestId("version-preset-canonical").click();
    await expect(page.getByTestId("version-result")).toContainText("Pin result: ok");
    await context.close();
  });
});
