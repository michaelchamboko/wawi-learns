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
  test("authorises a validated pack online and opens only child mode offline", async ({ page, context }) => {
    await page.goto(`${BASE_URL}/offline/harness`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("authorize-offline").click();
    await expect(page.getByText(/offline access is ready/i)).toBeVisible();
    await context.setOffline(true);
    await page.getByTestId("enter-child-offline").click();
    await expect(page.getByTestId("offline-child-shell")).toBeVisible();
    await expect(page.getByTestId("parent-route-denied")).toBeVisible();
    await page.evaluate(() => localStorage.setItem("wawi.installation.snapshot", "not-json"));
    await page.getByTestId("enter-child-offline").click();
    await expect(page.getByText(/child mode unavailable/i)).toBeVisible();
  });

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
