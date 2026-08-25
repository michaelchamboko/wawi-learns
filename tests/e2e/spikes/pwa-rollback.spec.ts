import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

const waitForReady = async (page: Page) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration?.active) && navigator.serviceWorker.controller !== null;
  });
};

test.describe("SLC-001-T002 — PWA atomic rollback", () => {
  test("a failed candidate install preserves the prior controller and shell", async ({ browser }) => {
    const context: BrowserContext = await browser.newContext({
      serviceWorkers: "allow",
    });
    const page = await context.newPage();
    await context.route("**/sw.js", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body:
          "self.addEventListener('install', () => self.skipWaiting());" +
          "self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));",
      });
    });
    await waitForReady(page);
    const previousController = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL);
    expect(previousController).toContain("/sw.js");
    await expect(page.getByTestId("home-shell")).toBeVisible();
    await context.unroute("**/sw.js");

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("service worker registration is required");
      await registration.update();
    });
    await expect.poll(async () => page.evaluate(async (expectedController) => {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        installing: registration?.installing?.scriptURL ?? null,
        active: registration?.active?.scriptURL ?? null,
        waiting: registration?.waiting?.scriptURL ?? null,
      };
    }, previousController)).toMatchObject({ active: previousController, waiting: expect.stringContaining("/sw.js") });

    const rollbackState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const controller = navigator.serviceWorker.controller;
      return {
        active: registration?.active?.scriptURL ?? null,
        controller: controller?.scriptURL ?? null,
        waiting: registration?.waiting?.scriptURL ?? null,
      };
    });
    expect(rollbackState.active).toBe(previousController);
    expect(rollbackState.controller).toBe(previousController);
    expect(rollbackState.waiting).toContain("/sw.js");
    await expect(page.getByTestId("home-shell")).toBeVisible();

    await context.close();
  });
});
