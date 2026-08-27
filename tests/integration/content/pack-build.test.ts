import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { rm, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { buildPacks, writePack } from "../../../scripts/content/build-packs";
import { verifyPack } from "../../../scripts/content/verify-pack";
import { loadCanonicalCorpus } from "../../../packages/content-schema/src/repository";
import {
  ContentPackManifestSchema,
  type ContentPackManifest,
} from "../../../packages/local-data/src/packs";

// Unique version segment isolates this test's output under public/content so it
// never collides with build:packs output or other workers sharing the project
// root (loadCanonicalCorpus must still read the real content/seed).
const root = resolve(__dirname, "..", "..", "..");
const version = `1.0.0-t5test-${process.pid}-${Date.now()}`;

const buildInput = {
  root,
  version,
  curriculumVersion: "v1",
  engineVersion: "1.0.0",
  essential: true,
} as const;

describe("SLC-003-T005 — immutable content pack build", () => {
  beforeAll(async () => {
    await rm(resolve(root, "public", "content", version), { recursive: true, force: true });
    await rm(resolve(root, "public", "content", `${version}-essential`), { recursive: true, force: true });
    const result = await buildPacks(buildInput);
    await writePack(root, result.essential);
    await writePack(root, result.full);
  });

  afterAll(async () => {
    await rm(resolve(root, "public", "content", version), { recursive: true, force: true });
    await rm(resolve(root, "public", "content", `${version}-essential`), { recursive: true, force: true });
  });

  it("produces a schema-valid manifest for both essential and full packs", async () => {
    for (const v of [version, `${version}-essential`]) {
      const raw = await readFile(resolve(root, "public", "content", v, "manifest.json"), "utf-8");
      const parsed = ContentPackManifestSchema.safeParse(JSON.parse(raw));
      expect(parsed.success, `manifest invalid for ${v}`).toBe(true);
      const manifest = parsed.data as ContentPackManifest;
      expect(manifest.assets.length).toBeGreaterThan(0);
      for (const asset of manifest.assets) {
        expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(asset.bytes).toBeGreaterThan(0);
        expect(asset.contentType).toBe("application/json");
      }
    }
  });

  it("is byte-for-byte reproducible across two independent builds (immutability)", async () => {
    const digestFile = async (base: string, name: string) =>
      createHash("sha256")
        .update(await readFile(resolve(base, name), "utf-8"))
        .digest("hex");
    const files = ["gpcs.json", "words.json", "sentences.json", "stories.json", "assets.json", "formations.json", "maths.json"];
    const firstDir = resolve(root, "public", "content", version, "content");
    const secondVersion = `${version}-repro`;
    await rm(resolve(root, "public", "content", secondVersion), { recursive: true, force: true });
    const result = await buildPacks({ ...buildInput, version: secondVersion });
    await writePack(root, result.full);
    const secondDir = resolve(root, "public", "content", secondVersion, "content");
    for (const f of files) {
      const a = await digestFile(firstDir, f);
      const b = await digestFile(secondDir, f);
      expect(b, `reproducibility mismatch for ${f}`).toBe(a);
    }
    await rm(resolve(root, "public", "content", secondVersion), { recursive: true, force: true });
  });

  it("fails verification when a packed file is corrupted (tamper detection)", async () => {
    const target = resolve(root, "public", "content", version, "content", "words.json");
    const original = await readFile(target, "utf-8");
    const corrupted = original.slice(0, -2) + "{}";
    await writeFile(target, corrupted, "utf-8");
    const result = await verifyPack(root, version);
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.startsWith("hash-mismatch"))).toBe(true);
    await writeFile(target, original, "utf-8");
    expect((await verifyPack(root, version)).ok).toBe(true);
  });

  it("pack is compatible with both consumer schemas (manifest + corpus)", async () => {
    const manifestRaw = await readFile(resolve(root, "public", "content", version, "manifest.json"), "utf-8");
    expect(ContentPackManifestSchema.safeParse(JSON.parse(manifestRaw)).success).toBe(true);
    const corpus = await loadCanonicalCorpus(root);
    expect(corpus.words.length).toBeGreaterThan(0);
    expect(corpus.sentences.length).toBeGreaterThan(0);
    expect(corpus.mathsTemplates.length).toBeGreaterThanOrEqual(40);
  });

  it("essential pack is a coherent 14-day subset with no dangling references", async () => {
    const essWords = new Set(
      (JSON.parse(await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "words.json"), "utf-8")) as Array<{ id: string }>).map((w) => w.id),
    );
    const essSentences = new Set(
      (JSON.parse(await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "sentences.json"), "utf-8")) as Array<{ id: string }>).map((s) => s.id),
    );
    const sentences = JSON.parse(await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "sentences.json"), "utf-8")) as Array<{ id: string; wordIds: string[] }>;
    const stories = JSON.parse(await readFile(resolve(root, "public", "content", `${version}-essential`, "content", "stories.json"), "utf-8")) as Array<{ id: string; pages: Array<{ sentenceIds: string[] }> }>;
    const sentenceWordIds = new Map(sentences.map((s) => [s.id, s.wordIds]));
    for (const s of sentences)
      for (const wid of s.wordIds)
        expect(essWords.has(wid), `essential pack missing word ${wid} used by sentence ${s.id}`).toBe(true);
    for (const st of stories)
      for (const p of st.pages)
        for (const sid of p.sentenceIds)
          expect(essSentences.has(sid), `essential pack missing sentence ${sid} used by story ${st.id}`).toBe(true);
    for (const st of stories)
      for (const p of st.pages)
        for (const sid of p.sentenceIds)
          for (const wid of sentenceWordIds.get(sid) ?? [])
            expect(essWords.has(wid), `essential pack missing word ${wid} (via story ${st.id})`).toBe(true);
  });
});
