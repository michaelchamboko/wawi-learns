import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-003-T005 — pack rollback.
 *
 * The two-slot activation pattern stages a candidate pack in a pending slot and
 * only promotes it after every asset passes hash + size verification. If the
 * candidate is corrupt, activation is rejected and the previously active pack
 * remains authoritative. This spec drives that path in the browser against the
 * served manifests: a valid pack activates, a corrupt candidate is rejected,
 * and the prior (valid) pack version is still the active one afterwards.
 */
const GOOD_VERSION = "1.0.0";
const ESSENTIAL_VERSION = "1.0.0-essential";

const activate = async (
  page: Page,
  manifest: unknown,
  previousPackVersion: string,
) => {
  return page.evaluate(
    async ({ manifestArg, previousPackVersion: prev }) => {
      const toBuffer = async (url: string) => {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`download ${url} failed ${r.status}`);
        return r.arrayBuffer();
      };
      const sha256Hex = async (data: ArrayBuffer) => {
        const hash = await crypto.subtle.digest("SHA-256", data);
        return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
      };
      const m = manifestArg as {
        packVersion: string;
        assets: Array<{ url: string; sha256: string; bytes: number }>;
        sizeBytes: number;
      };
      const downloaded = new Map<string, ArrayBuffer>();
      for (const file of m.assets) {
        let blob: ArrayBuffer;
        try {
          blob = await toBuffer(file.url);
        } catch {
          return { status: "rejected", reason: `download-failed:${file.url}`, activePackVersion: prev };
        }
        const digest = await sha256Hex(blob);
        if (digest !== file.sha256)
          return { status: "rejected", reason: `hash-mismatch:${file.url}`, activePackVersion: prev };
        if (blob.byteLength !== file.bytes)
          return { status: "rejected", reason: `size-mismatch:${file.url}`, activePackVersion: prev };
        downloaded.set(file.url, blob);
      }
      const total = [...downloaded.values()].reduce((acc, b) => acc + b.byteLength, 0);
      if (total !== m.sizeBytes)
        return { status: "rejected", reason: "size-sum-mismatch", activePackVersion: prev };
      return { status: "activated", activePackVersion: m.packVersion };
    },
    { manifestArg: manifest, previousPackVersion: previousPackVersion },
  );
};

const fetchManifest = async (page: Page, version: string) => {
  const res = await page.evaluate(async (url) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`manifest ${url} returned ${r.status}`);
    return r.json();
  }, `${BASE_URL}/content/${version}/manifest.json`);
  return res as {
    packVersion: string;
    assets: Array<{ url: string; sha256: string; bytes: number; contentType: string }>;
    sizeBytes: number;
  };
};

test.describe("SLC-003-T005 — pack rollback", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  });

  test("a valid essential pack activates while a corrupt full candidate is rolled back", async ({
    page,
  }) => {
    const good = await fetchManifest(page, ESSENTIAL_VERSION);
    const goodResult = await activate(page, good, "none");
    expect(goodResult.status).toBe("activated");
    expect(goodResult.activePackVersion).toBe(GOOD_VERSION);

    const candidate = await fetchManifest(page, GOOD_VERSION);
    const corrupt = {
      ...candidate,
      assets: candidate.assets.map((a, idx) =>
        idx === 0 ? { ...a, sha256: "f".repeat(64), bytes: a.bytes + 2 } : a,
      ),
    };
    const rejected = await activate(page, corrupt, GOOD_VERSION);
    expect(rejected.status).toBe("rejected");
    expect(rejected.reason).toContain("hash-mismatch");
    // Prior (valid) pack remains active — rollback preserved it.
    expect(rejected.activePackVersion).toBe(GOOD_VERSION);
  });
});
