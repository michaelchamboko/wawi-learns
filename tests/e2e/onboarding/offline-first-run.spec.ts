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
    await waitForReady(page);
    await page.goto(`${BASE_URL}/offline/harness`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("authorize-offline").click();
    await expect(page.getByText(/offline access is ready/i)).toBeVisible();
    await page.getByTestId("corrupt-offline-update").click();
    await expect(page.getByText(/child mode unavailable/i)).toBeVisible();
    await page.getByTestId("enter-child-offline").click();
    await expect(page.getByText(/offline access is ready/i)).toBeVisible();
    await page.getByTestId("revoke-offline").click();
    await page.getByTestId("enter-child-offline").click();
    await expect(page.getByText(/child mode unavailable/i)).toBeVisible();
    await page.getByTestId("clear-offline").click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("authorize-offline").click();
    await expect(page.getByText(/offline access is ready/i)).toBeVisible();
    await page.goto(`${BASE_URL}/offline`, { waitUntil: "domcontentloaded" });
    await context.setOffline(true);
    await page.goto(`${BASE_URL}/offline`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("offline-child-entry")).toBeVisible();
    await expect(page.getByTestId("offline-parent-denied")).toBeVisible();
    await page.getByRole("button", { name: /disable microphone/i }).click();
    await expect(page.getByTestId("offline-safety-lockout")).toBeVisible();
    await page.goto(`${BASE_URL}/offline`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("offline-safety-lockout")).toBeVisible();
    await expect(page.getByRole("button", { name: /disable microphone/i })).toHaveCount(0);
    await page.goto(`${BASE_URL}/home`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/parent routes are unavailable offline/i)).toBeVisible();
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
