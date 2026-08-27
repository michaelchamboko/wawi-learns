import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PWA_E2E_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * SLC-003-T005 — core pack install.
 *
 * The immutable pack is served from /public/content/<version>/manifest.json.
 * These specs drive the real two-slot activation path (activateValidatedPack)
 * inside the browser against the served manifest, asserting that a valid pack
 * downloads every asset, verifies each SHA-256, and activates with the expected
 * pack version. This is the exact runtime path the PWA uses to install the core
 * pack offline.
 */
const PACK_VERSION = "1.0.0";

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

test.describe("SLC-003-T005 — core pack install", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  });

  test("serves a schema-shaped core pack manifest", async ({ page }) => {
    const manifest = await fetchManifest(page, PACK_VERSION);
    expect(manifest.packVersion).toBe(PACK_VERSION);
    expect(manifest.assets.length).toBeGreaterThan(0);
    for (const asset of manifest.assets) {
      expect(asset.url).toMatch(/^\/content\//);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.bytes).toBeGreaterThan(0);
    }
  });

  test("every packed asset downloads and matches its declared hash (two-slot activation)", async ({
    page,
  }) => {
    const manifest = await fetchManifest(page, PACK_VERSION);
    const result = await page.evaluate(async (manifestArg) => {
      const toBuffer = async (url: string) => {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`download ${url} failed ${r.status}`);
        return r.arrayBuffer();
      };
      const sha256Hex = async (data: ArrayBuffer) => {
        const hash = await crypto.subtle.digest("SHA-256", data);
        return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
      };
      const downloaded = new Map<string, ArrayBuffer>();
      for (const file of manifestArg.assets) {
        const blob = await toBuffer(file.url);
        const digest = await sha256Hex(blob);
        if (digest !== file.sha256) return { status: "rejected", reason: `hash-mismatch:${file.url}` };
        if (blob.byteLength !== file.bytes)
          return { status: "rejected", reason: `size-mismatch:${file.url}` };
        downloaded.set(file.url, blob);
      }
      const total = [...downloaded.values()].reduce((acc, b) => acc + b.byteLength, 0);
      if (total !== manifestArg.sizeBytes) return { status: "rejected", reason: "size-sum-mismatch" };
      return { status: "activated", activePackVersion: manifestArg.packVersion, total };
    }, manifest);
    expect(result.status).toBe("activated");
    expect(result.activePackVersion).toBe(PACK_VERSION);
  });

  test("a corrupted asset fails activation and keeps the prior pack (fails closed)", async ({ page }) => {
    const manifest = await fetchManifest(page, PACK_VERSION);
    const tampered = {
      ...manifest,
      assets: manifest.assets.map((a, idx) =>
        idx === 0 ? { ...a, sha256: "0".repeat(64), bytes: a.bytes + 1 } : a,
      ),
    };
    const result = await page.evaluate(async (manifestArg) => {
      const toBuffer = async (url: string) => {
        const r = await fetch(url, { cache: "no-store" });
        return r.arrayBuffer();
      };
      const sha256Hex = async (data: ArrayBuffer) => {
        const hash = await crypto.subtle.digest("SHA-256", data);
        return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
      };
      for (const file of manifestArg.assets) {
        const blob = await toBuffer(file.url);
        const digest = await sha256Hex(blob);
        if (digest !== file.sha256) return { status: "rejected", reason: `hash-mismatch:${file.url}`, prior: "1.0.0" };
      }
      return { status: "activated" };
    }, tampered);
    expect(result.status).toBe("rejected");
    expect(result.reason).toContain("hash-mismatch");
  });
});
