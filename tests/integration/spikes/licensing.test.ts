import { describe, expect, it } from "vitest";
import { LicenceSchema } from "../../../packages/content-schema/src/index";
import {
  ReasonCode,
  validateContentRepository,
  type ContentPackManifest,
} from "../../../packages/content-schema/src/validators";

const licence = {
  tier: "cc0-1.0" as const,
  licenceId: "CC0-1.0",
  sourceUrl: "https://example.org/source",
  proofPath: "docs/licence/cc0.md",
};

const manifest: ContentPackManifest = {
  packVersion: "1.0.0",
  schemaVersion: "1.0.0",
  curriculumVersion: "curriculum-1",
  engineVersion: "engine-1",
  issuedAt: 1_700_000_000_000,
  counts: { gpc: 0, words: 0, sentences: 0, stories: 0, assets: 0, formations: 0, mathsTemplates: 0 },
  assets: [],
  entryUrls: ["/content/index.json"],
  sizeBytes: 0,
};

describe("SLC-001-T005 — licensing spike", () => {
  it("accepts a complete CC0 licence and rejects share-alike", () => {
    expect(LicenceSchema.safeParse(licence).success).toBe(true);
    expect(
      LicenceSchema.safeParse({ ...licence, tier: "cc-by-sa-4.0" }).success,
    ).toBe(false);
  });

  it("fails closed when a content record carries an unknown licence tier", () => {
    const result = validateContentRepository(
      {
        gpcs: [],
        words: [{
          id: "w-cat",
          spelling: "cat",
          phonemes: ["k", "a", "t"],
          gpcIds: ["gpc-c", "gpc-a", "gpc-t"],
          category: "concrete",
          decodable: true,
          taughtIn: ["reception"],
          licence: { ...licence, tier: "cc-by-sa-4.0" },
        }],
        sentences: [],
        stories: [],
        assets: [],
        formations: [],
        mathsTemplates: [],
      },
      manifest,
      {
        minimumWords: 0,
        minimumIllustratedWords: 0,
        minimumSentences: 0,
        minimumStories: 0,
        minimumGpcs: 0,
        minimumMathsTemplates: 0,
      },
    );

    expect(result.ok).toBe(false);
    expect(result.failures.map((failure) => failure.code)).toContain(
      ReasonCode.UNKNOWN_SCHEMA_VERSION,
    );
  });
});
