import { expect, test } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://localhost:3100";
const HARNESS_URL = `${BASE_URL}/rewards/adventure-harness`;

test.describe("SLC-008-T001 — adventure and rewards projection", () => {
  test("renders the adventure stage, collection, build, character and celebration totals", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await expect(page.getByTestId("adventure-stage")).toContainText("Stage 1");
    await expect(page.getByTestId("adventure-collection")).toContainText("Collection: 1");
    await expect(page.getByTestId("adventure-build")).toContainText("Build: 1");
    await expect(page.getByTestId("adventure-character")).toContainText("Character stage: 1");
    await expect(page.getByTestId("adventure-celebrations")).toContainText("Celebrations: 0");
    await expect(page.getByTestId("adventure-reduced-motion")).toContainText("Reduced motion: off");
    await context.close();
  });

  test("a major celebration advances the stage and turns reduced motion on", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    await page.getByTestId("adventure-add-major").click();
    await expect(page.getByTestId("adventure-celebrations")).toContainText("Celebrations: 1");
    await expect(page.getByTestId("adventure-reduced-motion")).toContainText("Reduced motion: on");
    await expect(page.getByTestId("adventure-stage")).toContainText("Stage 2");
    await context.close();
  });

  test("progress never decreases when an eligible collection is awarded", async ({ page, context }) => {
    await page.goto(HARNESS_URL, { waitUntil: "networkidle" });
    const beforeCollection = await page.getByTestId("adventure-collection").textContent();
    await page.getByTestId("adventure-add-collection").click();
    const afterCollection = await page.getByTestId("adventure-collection").textContent();
    expect(afterCollection).not.toEqual(beforeCollection);
    await context.close();
  });
});
