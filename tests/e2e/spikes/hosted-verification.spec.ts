import { test, expect } from "@playwright/test";

const expectedGitSha = process.env.EXPECTED_GIT_SHA;
const previousProductionUrl = process.env.PREVIOUS_PRODUCTION_URL;
if (process.env.WAWI_E2E_REQUIRE_HOSTED === "1" && (!expectedGitSha || !previousProductionUrl)) {
  throw new Error("WAWI_E2E_REQUIRE_HOSTED=1 requires EXPECTED_GIT_SHA and PREVIOUS_PRODUCTION_URL");
}

test.describe("SLC-011-T005 — Hosted private-beta verification", () => {
  test("production deployment matches reviewed SHA and exposes identity contract", async ({ request }) => {
    const baseUrl = process.env.PRODUCTION_URL ?? "https://wawi-learns.vercel.app";
    const res = await request.get(`${baseUrl}/api/deployment`);
    expect(res.status()).toBe(200);
    const headers = res.headers();
    expect(headers["cache-control"]).toContain("no-store");
    const json = await res.json();
    expect(json.project).toBe("wawi-learns");
    expect(json.environment).toBe("production");
    expect(json.gitSha).toMatch(/^[0-9a-f]{40}$/);
    if (expectedGitSha) expect(json.gitSha).toBe(expectedGitSha);
    expect(json.convexDeployment).toBe("tacit-pony-603");
    expect(json.deploymentId).toBeTruthy();
  });

  test("previous production deployment is healthy and rollback-ready", async ({ request }) => {
    test.skip(!previousProductionUrl, "PREVIOUS_PRODUCTION_URL is required for rollback readiness");
    const res = await request.get(`${previousProductionUrl}/api/deployment`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.project).toBe("wawi-learns");
    expect(json.environment).toBe("production");
    expect(json.gitSha).toMatch(/^[0-9a-f]{40}$/);

    const currentUrl = process.env.PRODUCTION_URL ?? "https://wawi-learns.vercel.app";
    const current = await request.get(`${currentUrl}/api/deployment`);
    expect(current.status()).toBe(200);
    const currentJson = await current.json();
    expect(json.gitSha).not.toBe(currentJson.gitSha);
  });
});
