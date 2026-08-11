import { describe, expect, it } from "vitest";
import {
  GpcRecordSchema,
  WordRecordSchema,
  ContentPackManifestSchema,
  type GpcRecord,
  type WordRecord,
  type ContentPackManifest,
} from "../../packages/content-schema/src/index.full";

const baseLicence = {
  tier: "cc0-1.0" as const,
  licenceId: "CC0-1.0",
  sourceUrl: "https://example.org/source",
  proofPath: "docs/licence/cc0.md",
};

describe("SLC-003-T001 — content schema", () => {
  it("GPC record requires phonemes, position, curriculum order and a licence", () => {
    const valid: GpcRecord = {
      id: "gpc-s",
      grapheme: "s",
      phonemes: ["s"],
      exampleWordIds: ["w-sun"],
      position: "initial",
      curriculumOrder: 0,
      taughtIn: ["reception"],
      licence: baseLicence,
    };
    expect(GpcRecordSchema.safeParse(valid).success).toBe(true);

    const missing = { ...valid } as Partial<GpcRecord>;
    delete missing.phonemes;
    expect(GpcRecordSchema.safeParse(missing).success).toBe(false);
  });

  it("Word record rejects US spelling", () => {
    const us: WordRecord = {
      id: "w-color",
      spelling: "color",
      phonemes: ["k", "uh", "l", "uh", "r"],
      gpcIds: ["gpc-c", "gpc-o", "gpc-l", "gpc-o", "gpc-r"],
      category: "concrete",
      decodable: true,
      taughtIn: ["reception"],
      licence: baseLicence,
    };
    const result = WordRecordSchema.safeParse(us);
    expect(result.success).toBe(false);

    const british: WordRecord = { ...us, spelling: "colour" };
    expect(WordRecordSchema.safeParse(british).success).toBe(true);
  });

  it("ContentPackManifest requires counts and asset list", () => {
    const manifest: ContentPackManifest = {
      packVersion: "1.0.0",
      schemaVersion: "1.0.0",
      curriculumVersion: "curriculum-1",
      engineVersion: "engine-1",
      issuedAt: 1_700_000_000_000,
      counts: {
        gpc: 0,
        words: 0,
        sentences: 0,
        stories: 0,
        assets: 0,
        formations: 0,
        mathsTemplates: 0,
      },
      assets: [],
      entryUrls: ["/content/index.json"],
      sizeBytes: 0,
    };
    expect(ContentPackManifestSchema.safeParse(manifest).success).toBe(true);
  });
});