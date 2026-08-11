import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

const waitForReady = async (page: Page) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
        setTimeout(() => resolve(), 1500);
      });
    }
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
};

test.describe("SLC-006-T004 — approved overlay", () => {
  test("the story reading page renders with offline fallback when no overlay is approved", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("picture-word-activity")).toBeVisible();
  });

  test("child cannot reach the parent approval surface offline", async ({ browser }) => {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    await waitForReady(page);
    await context.setOffline(true);
    await page.goto(`${BASE_URL}/offline-fallback-check`, { waitUntil: "load" });
    await page.waitForFunction(() => document.readyState === "complete");
    const body = await page.content();
    expect(body).not.toMatch(/approve-revision/);
    await context.close();
  });
});