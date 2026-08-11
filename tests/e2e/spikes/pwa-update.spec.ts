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
        // If still no controller, force a reload so the freshly activated worker takes over.
        setTimeout(() => resolve(), 1500);
      });
      if (!navigator.serviceWorker.controller) {
        window.location.reload();
      }
    }
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
};

test.describe("SLC-001-T002 — PWA install / offline / atomic update", () => {
  test("manifest exposes required shell icons, metadata, and current build revision", async ({
    page,
    request,
  }) => {
    const manifest = await request.get(`${BASE_URL}/manifest.webmanifest`);
    expect(manifest.status()).toBe(200);
    const body = (await manifest.json()) as {
      name: string;
      start_url: string;
      display: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
    };
    expect(body.name).toBe("Wawi Learns");
    expect(body.start_url).toBe("/");
    expect(body.display).toBe("standalone");
    expect(body.icons.map((i) => i.sizes)).toEqual(["192x192", "512x512"]);

    for (const icon of body.icons) {
      const res = await request.get(`${BASE_URL}${icon.src}`);
      expect(res.status(), `icon ${icon.src}`).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/svg+xml");
    }

    const serviceWorker = await request.get(`${BASE_URL}/sw.js`);
    expect(serviceWorker.status()).toBe(200);
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    const shellRevision = await page.getByTestId("home-shell").getAttribute("data-git-sha");
    expect(shellRevision).toBeTruthy();
    expect(await serviceWorker.text()).toContain(`'revision':'${shellRevision}'`);
  });

  test("registers a service worker and serves the shell from cache when offline", async ({
    browser,
  }) => {
    const context: BrowserContext = await browser.newContext({
      serviceWorkers: "allow",
    });
    const page = await context.newPage();
    await waitForReady(page);

    const swUrl = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const script = reg?.active?.scriptURL ?? reg?.installing?.scriptURL ?? reg?.waiting?.scriptURL ?? null;
      return script;
    });
    expect(swUrl, "service worker must be registered").toContain("/sw.js");

    await context.setOffline(true);
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("home-shell")).toBeVisible();

    await page.goto(`${BASE_URL}/offline-fallback-check`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("offline-shell")).toBeVisible();

    await context.close();
  });

  test("controlled update: a new worker waits, the old shell keeps control, then SKIP_WAITING hands over", async ({
    browser,
  }) => {
    const context: BrowserContext = await browser.newContext({
      serviceWorkers: "allow",
    });
    const page = await context.newPage();

    // Phase 1 — serve a byte-different "old" stub worker so the real shell SW
    // becomes the *new* worker in the same registration (this is what makes the
    // update boundary observable rather than assumed).
    await context.route("**/sw.js", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body:
          "self.addEventListener('install', () => self.skipWaiting());" +
          "self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));" +
          "self.addEventListener('message', async (event) => { if (event.data?.type === 'IDENTIFY_OLD_STUB') { const clients = await self.clients.matchAll({ type: 'window' }); event.source?.postMessage({ type: 'OLD_STUB_ACTIVE', clients: clients.length }); } });",
      });
    });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg?.active) && navigator.serviceWorker.controller !== null;
    });
    const oldStubClientCount = await page.evaluate(async () => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return -1;
      return new Promise<number>((resolve) => {
        const timeout = window.setTimeout(() => resolve(-1), 1_000);
        navigator.serviceWorker.addEventListener(
          "message",
          (event) => {
            if (event.data?.type === "OLD_STUB_ACTIVE") {
              window.clearTimeout(timeout);
              resolve(event.data.clients);
            }
          },
          { once: true },
        );
        controller.postMessage({ type: "IDENTIFY_OLD_STUB" });
      });
    });
    expect(oldStubClientCount, "the old fixture worker must control this page").toBeGreaterThan(0);
    await context.unroute("**/sw.js");

    // Keep the claimed old page open while fetching the real worker. The update,
    // staged-state observation, and explicit handoff deliberately run in one
    // browser evaluation so Chromium cannot activate it between test round trips.
    const handoff = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const previousController = navigator.serviceWorker.controller;
      if (!reg || !previousController || reg.active !== previousController) {
        return { staged: false, controllerChanged: false, controllerReplaced: false };
      }

      await reg.update();
      const waiting = await new Promise<ServiceWorker | null>((resolve) => {
        const deadline = Date.now() + 5_000;
        const poll = () => {
          if (reg.waiting && reg.active === previousController) {
            resolve(reg.waiting);
            return;
          }
          if (Date.now() >= deadline) {
            resolve(null);
            return;
          }
          window.setTimeout(poll, 10);
        };
        poll();
      });
      if (!waiting) {
        return { staged: false, controllerChanged: false, controllerReplaced: false };
      }

      const controllerChanged = await new Promise<boolean>((resolve) => {
        const timeout = window.setTimeout(() => resolve(false), 5_000);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            window.clearTimeout(timeout);
            resolve(true);
          },
          { once: true },
        );
        waiting.postMessage({ type: "SKIP_WAITING" });
      });
      return {
        staged: true,
        controllerChanged,
        controllerReplaced: navigator.serviceWorker.controller !== previousController,
      };
    });
    expect(handoff).toEqual({
      staged: true,
      controllerChanged: true,
      controllerReplaced: true,
    });
    await page.waitForFunction(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => {
        const active = reg?.active;
        return Boolean(active) && active === navigator.serviceWorker.controller && !reg?.waiting;
      });
    });

    await context.close();
  });
});
