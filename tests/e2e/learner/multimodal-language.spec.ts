import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

const openHarness = async (browser: Browser): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/home/multimodal-harness`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("multimodal-harness")).toBeVisible();
  return { context, page };
};

const advanceToSpeech = async (page: Page) => {
  await page.getByRole("button", { name: "I'm ready" }).click();
  await page.getByRole("button", { name: "sun", exact: true }).click();
  await page.getByRole("button", { name: "sit", exact: true }).click();
  await page.getByRole("button", { name: "I traced it", exact: true }).click();
  for (const letter of ["c", "a", "n"]) await page.getByRole("button", { name: letter, exact: true }).click();
};

test.describe("SLC-005-T005 — multimodal language lesson", () => {
  test("records only matching-dimension evidence through picture, tracing, spelling and speech", async ({ browser }) => {
    const { context, page } = await openHarness(browser);
    await advanceToSpeech(page);
    await page.getByTestId("microphone-permission").click();
    await page.getByTestId("speech-record").click();

    await expect(page.getByTestId("attempt-log")).toHaveText([
      "phonics:w-cat:correct",
      "phonics:w-sun:correct",
      "reading:w-sit:correct",
      "tracing:w-sat:correct",
      "spelling:w-can:correct",
      "speech:w-cat:partial",
    ].join("|"));
    await context.close();
  });

  test("uses denied-microphone fallback and records speech only after the child confirms practice", async ({ browser }) => {
    const { context, page } = await openHarness(browser);
    await advanceToSpeech(page);

    await page.getByTestId("deny-microphone").click();
    await expect(page.getByTestId("speech-fallback")).toBeVisible();
    await expect(page.getByTestId("attempt-log")).not.toContainText("speech:");
    await page.getByRole("button", { name: "I said it" }).click();
    await expect(page.getByTestId("attempt-log")).toContainText("speech:w-cat:partial");
    await context.close();
  });

  test("uses offline speech fallback and cancel records no attempt", async ({ browser }) => {
    const { context, page } = await openHarness(browser);
    await advanceToSpeech(page);

    await page.getByTestId("toggle-offline").click();
    await expect(page.getByTestId("speech-fallback")).toBeVisible();
    await page.getByTestId("cancel-activity").click();
    await expect(page.getByTestId("attempt-log")).not.toContainText("speech:");
    await context.close();
  });
});
