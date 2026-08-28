import { expect, test } from "@playwright/test";

const PRODUCTION_URL = process.env.PWA_E2E_BASE_URL ?? "https://wawi-learns.vercel.app";
const DEPLOYMENT_URL = process.env.PRODUCTION_DEPLOYMENT_URL ?? PRODUCTION_URL;

const routes = ["/", "/home", "/onboarding", "/offline", "/rewards/adventure-harness"] as const;

test.describe("SLC-010-T005 — production smoke", () => {
  for (const route of routes) {
    test(`live deployment ${DEPLOYMENT_URL} responds for ${route}`, async ({ request }) => {
      const response = await request.get(`${DEPLOYMENT_URL}${route}`, { failOnStatusCode: false });
      expect([200, 302, 307, 308]).toContain(response.status());
    });
  }

  test("production deployment alias is reachable", async ({ request }) => {
    const response = await request.get(PRODUCTION_URL, { failOnStatusCode: false });
    expect([200, 302, 307, 308]).toContain(response.status());
  });
});
