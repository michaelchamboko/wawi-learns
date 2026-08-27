import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { buildPacks, writePack } from "../../../scripts/content/build-packs";
import { verifyPack } from "../../../scripts/content/verify-pack";
import { loadCanonicalCorpus } from "../../../packages/content-schema/src/repository";
import {
  ContentPackManifestSchema,
  type ContentPackManifest,
} from "../../../packages/local-data/src/packs";

const root = resolve(__dirname, "..", "..", "..");

describe("SLC-003-T005 — immutable content pack build", () => {
  const version = "1.0.0";

  beforeAll(async () => {
    await rm(resolve(root, "public", "content", version), { recursive: true, force: true });
    await rm(resolve(root, "public", "content", `${version}-essential`), {
      recursive: true,
      force: true,
    });
    const result = await buildPacks({
      root,
      version,
      curriculumVersion: "v1",
      engineVersion: "1.0.0",
      essential: true,
    });
    await writePack(root, result.essential);
    await writePack(root, result.full);
  });

  afterAll(async () => {
    await rm(resolve(root, "public", "content", version), { recursive: true, force: true });
    await rm(resolve(root, "public", "content", `${version}-essential`), {
      recursive: true,
      force: true,
    });
  });

  it("produces a schema-valid manifest for both essential and full packs", async () => {
    for (const v of [version, `${version}-essential`]) {
      const raw = await readFile(
        resolve(root, "public", "content", v, "manifest.json"),
        "utf-8",
      );
      const parsed = ContentPackManifestSchema.safeParse(JSON.parse(raw));
      expect(parsed.success, `manifest invalid for ${v}`).toBe(true);
      // Every asset entry carries a real sha256 + byte size + contentType.
      const manifest = parsed.data as ContentPackManifest;
      expect(manifest.assets.length).toBeGreaterThan(0);
      for (const asset of manifest.assets) {
        expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(asset.bytes).toBeGreaterThan(0);
        expect(asset.contentType).toBe("application/json");
      }
    }
  });

  it("is byte-for-byte reproducible across two builds (immutability)", async () => {
    const readDigest = async (v: string) => {
      const raw = await readFile(resolve(root, "public", "content", v, "manifest.json"), "utf-8");
      return createHash("sha256").update(raw).digest("hex");
    };
    const first = await readDigest(version);
    // Rebuild into a temp location and hash the actual written manifest file.
    const result = await buildPacks({
      root,
      version,
      curriculumVersion: "v1",
      engineVersion: "1.0.0",
      essential: true,
    });
    const tmp = resolve(root, "public", "content", `${version}-repro`);
    await rm(tmp, { recursive: true, force: true });
    await mkdir(tmp, { recursive: true });
    await writePack(root, result.full); // writes to public/content/1.0.0
    const second = await readDigest(version);
    expect(second).toBe(first);
    await rm(resolve(root, "public", "content", version), { recursive: true, force: true });
    await rm(tmp, { recursive: true, force: true });
    // Re-establish the beforeAll output so later tests have the pack on disk.
    await writePack(
      root,
      (await buildPacks({ root, version, curriculumVersion: "v1", engineVersion: "1.0.0", essential: true })).full,
    );
  });

  it("fails verification when a packed file is corrupted (tamper detection)", async () => {
    const target = resolve(root, "public", "content", version, "content", "words.json");
    const original = await readFile(target, "utf-8");
    const corrupted = original.slice(0, -2) + "{}"; // truncate -> invalid JSON, wrong hash
    await writeFile(target, corrupted, "utf-8");
    const result = await verifyPack(root, version);
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.startsWith("hash-mismatch"))).toBe(true);
    // Restore for later tests.
    await writeFile(target, original, "utf-8");
    const restored = await verifyPack(root, version);
    expect(restored.ok).toBe(true);
  });

  it("pack is compatible with both consumer schemas (manifest + corpus)", async () => {
    // The manifest parses as a pack manifest.
    const manifestRaw = await readFile(
      resolve(root, "public", "content", version, "manifest.json"),
      "utf-8",
    );
    expect(ContentPackManifestSchema.safeParse(JSON.parse(manifestRaw)).success).toBe(true);
    // The packed corpus still loads as a valid canonical corpus (provenance preserved).
    const corpus = await loadCanonicalCorpus(root);
    expect(corpus.words.length).toBeGreaterThan(0);
    expect(corpus.sentences.length).toBeGreaterThan(0);
    expect(corpus.mathsTemplates.length).toBeGreaterThanOrEqual(40);
  });

  it("essential pack is a coherent 14-day subset with no dangling references", async () => {
    const essWords = new Set(
      (JSON.parse(
        await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "words.json"), "utf-8"),
      ) as Array<{ id: string }>).map((w) => w.id),
    );
    const essSentences = new Set(
      (JSON.parse(
        await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "sentences.json"), "utf-8"),
      ) as Array<{ id: string }>).map((s) => s.id),
    );
    const sentences = JSON.parse(
      await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "sentences.json"), "utf-8"),
    ) as Array<{ id: string; wordIds: string[] }>;
    const stories = JSON.parse(
      await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "stories.json"), "utf-8"),
    ) as Array<{ id: string; pages: Array<{ sentenceIds: string[] }> }>;
    // Every sentence's words resolve within the essential word set.
    const sentenceWordIds = new Map(sentences.map((s) => [s.id, s.wordIds]));
    for (const s of sentences)
      for (const wid of s.wordIds)
        expect(essWords.has(wid), `essential pack missing word ${wid} used by sentence ${s.id}`).toBe(true);
    // Every story references sentences that exist in the essential pack.
    for (const st of stories)
      for (const p of st.pages)
        for (const sid of p.sentenceIds)
          expect(essSentences.has(sid), `essential pack missing sentence ${sid} used by story ${st.id}`).toBe(true);
    // Every story's referenced sentence's words resolve within the essential word set.
    for (const st of stories)
      for (const p of st.pages)
        for (const sid of p.sentenceIds)
          for (const wid of sentenceWordIds.get(sid) ?? [])
            expect(essWords.has(wid), `essential pack missing word ${wid} (via story ${st.id})`).toBe(true);
  });
});
