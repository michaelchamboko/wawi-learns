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

test.describe("SLC-009-T005 — full release journey", () => {
  test("the SW controls the page after install and offline navigation falls back to /offline", async ({
    browser,
  }) => {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    await waitForReady(page);
    await context.setOffline(true);
    await page.goto(`${BASE_URL}/offline-fallback-check`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("offline-shell")).toBeVisible();
    await context.close();
  });

  test("the manifest endpoint serves the expected PWA metadata", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await waitForReady(page);
    const response = await page.request.get(`${BASE_URL}/manifest.webmanifest`);
    expect(response.status()).toBe(200);
    const body = await response.json() as { name: string; display: string; start_url: string };
    expect(body.name).toBe("Wawi Learns");
    expect(body.display).toBe("standalone");
    expect(body.start_url).toBe("/");
    await context.close();
  });
});