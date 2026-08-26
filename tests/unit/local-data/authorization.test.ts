import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canOpenChildModeOffline, parseInstallationSnapshot, persistInstallationSnapshot, type ActivePackState, type InstallationSnapshot } from "../../../packages/local-data/src/offline-auth";
import { ESSENTIAL_PACK_DIGEST, essentialPackManifest, prepareEssentialPack } from "../../../packages/local-data/src/essential-pack";
import { activateValidatedPack } from "../../../packages/local-data/src/packs";

const snapshot: InstallationSnapshot = { installationId: "install-1", parentId: "parent-1", childProfileId: "child-1", packVersion: "1.0.0", packDigest: ESSENTIAL_PACK_DIGEST, issuedAt: 1_700_000_000_000 };
const pack: ActivePackState = { packVersion: "1.0.0", packDigest: ESSENTIAL_PACK_DIGEST, essentialAssetUrls: essentialPackManifest.entryUrls, complete: true };

describe("SLC-002-T005 — installation-bound offline authorization", () => {
  it("binds the snapshot to the validated active pack", () => {
    const canonical = [essentialPackManifest.packVersion, essentialPackManifest.curriculumVersion, essentialPackManifest.engineVersion, ...essentialPackManifest.assets.slice().sort((a, b) => a.url.localeCompare(b.url)).map((asset) => `${asset.url.split("/").pop()}:${asset.bytes}:${asset.sha256}`)].join("|");
    expect(createHash("sha256").update(canonical).digest("hex")).toBe(ESSENTIAL_PACK_DIGEST);
    expect(essentialPackManifest.assets).toHaveLength(5);
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    expect(persistInstallationSnapshot(snapshot, pack, storage)).toBe(true);
    expect(persistInstallationSnapshot({ ...snapshot, packDigest: "b".repeat(64) }, pack, storage)).toBe(false);
  });

  it("parses malformed or revoked state as unavailable", () => {
    expect(parseInstallationSnapshot("not-json")).toBeNull();
    expect(canOpenChildModeOffline({ now: () => 2_000, snapshot: { ...snapshot, revokedAt: 1_999 }, activePack: pack, requestedMode: "child" }).mode).toBe("denied");
  });

  it("denies incomplete packs and every parent mode offline", () => {
    expect(canOpenChildModeOffline({ now: () => 1_700_000_000_001, snapshot, activePack: { ...pack, complete: false }, requestedMode: "child" }).reason).toBe("pack-unavailable");
    expect(canOpenChildModeOffline({ now: () => 1_700_000_000_001, snapshot, activePack: pack, requestedMode: "parent" }).reason).toBe("parent-mode-offline");
  });

  it("accepts LF and CRLF SVG fetches as the same canonical pack", async () => {
    const fetchPack = (crlf: boolean) => async (url: string) => {
      const content = await readFile(resolve(process.cwd(), "public", url.slice(1)));
      const text = content.toString("utf8").replaceAll("\r\n", "\n");
      const normalized = crlf ? text.replaceAll("\n", "\r\n") : text;
      return new TextEncoder().encode(normalized).buffer;
    };

    const lf = await prepareEssentialPack(fetchPack(false));
    const crlf = await prepareEssentialPack(fetchPack(true));
    expect(lf).toEqual(crlf);
    expect(lf?.packDigest).toBe(ESSENTIAL_PACK_DIGEST);
  });

  it("keeps non-SVG bytes exact during pack activation", async () => {
    const bytes = Uint8Array.from([0, 255, 1, 254]).buffer;
    const digest = createHash("sha256").update(new Uint8Array(bytes)).digest("hex");
    const result = await activateValidatedPack({
      packVersion: "1.0.0",
      curriculumVersion: "test",
      engineVersion: "1.0.0",
      issuedAt: 1_700_000_000_000,
      assets: [{ url: "/binary.bin", sha256: digest, bytes: 4, contentType: "application/octet-stream" }],
      entryUrls: ["/binary.bin"],
      sizeBytes: 4,
    }, { fetchFile: async () => bytes });
    expect(result.status).toBe("activated");
  });
});
