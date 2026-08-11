import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

const waitForReady = async (page: Page) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        });
        setTimeout(() => resolve(), 1500);
      });
      if (!navigator.serviceWorker.controller) {
        window.location.reload();
      }
    }
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
};

test.describe("SLC-002-T005 — offline first run", () => {
  test("child shell opens after the SW controls the page and the offline fallback shell serves unknown routes", async ({
    browser,
  }) => {
    const context: BrowserContext = await browser.newContext({
      serviceWorkers: "allow",
    });
    const page = await context.newPage();
    await waitForReady(page);
    await expect(page.getByTestId("home-shell")).toBeVisible();

    await context.setOffline(true);
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("home-shell")).toBeVisible();

    await page.goto(`${BASE_URL}/offline-fallback-check`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("offline-shell")).toBeVisible();

    await context.close();
  });
});