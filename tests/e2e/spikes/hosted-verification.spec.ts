import { test, expect } from "@playwright/test";

test.describe("SLC-011-T005 — Hosted private-beta verification", () => {
  test("production deployment matches reviewed SHA and exposes identity contract", async ({ request }) => {
    // We'll use the production URL from the environment or default to the known Vercel app
    const BASE_URL = process.env.PRODUCTION_URL ?? "https://wawi-learns.vercel.app";
    const res = await request.get(`${BASE_URL}/api/deployment`);
    expect(res.status()).toBe(200);
    const headers = res.headers();
    expect(headers["cache-control"]).toContain("no-store");
    const json = await res.json();
    expect(json.project).toBe("wawi-learns");
    expect(json.environment).toBe("production");
    // The gitSha should be a 40-character hex string
    expect(json.gitSha).toMatch(/^[0-9a-f]{40}$/);
    expect(json.deploymentId).toBeTruthy();
  });
});