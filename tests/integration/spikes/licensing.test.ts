import { describe, expect, it } from "vitest";
import {
  LICENCE_TIERS,
  LicenceSchema,
  ReviewReceiptSchema,
} from "../../../packages/content-schema/src/index";
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
        words: [
          {
            id: "w-cat",
            recordVersion: "0.1.0",
            spelling: "cat",
            phonemes: ["k", "a", "t"],
            gpcIds: ["gpc-c", "gpc-a", "gpc-t"],
            category: "concrete",
            decodable: true,
            taughtIn: ["reception"],
            licence: { ...licence, tier: "cc-by-sa-4.0" },
          },
        ],
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

  it("accepts OGL 3.0 only with attributable, hashed and safe source evidence", () => {
    const ogl = {
      tier: "ogl-3.0",
      licenceId: "OGL-3.0",
      attribution: "Department for Education",
      sourceDigest: "b".repeat(64),
      sourceUrl:
        "https://www.gov.uk/government/publications/national-curriculum-in-england",
      proofPath: "docs/licence/ogl-national-curriculum.md",
    };
    expect(LICENCE_TIERS).toContain("ogl-3.0");
    expect(LicenceSchema.safeParse(ogl).success).toBe(true);
    expect(
      LicenceSchema.safeParse({ ...ogl, attribution: "" }).success,
    ).toBe(false);
    expect(
      LicenceSchema.safeParse({ ...ogl, sourceDigest: "not-a-digest" })
        .success,
    ).toBe(false);
    expect(
      LicenceSchema.safeParse({ ...ogl, proofPath: "../private/proof.md" })
        .success,
    ).toBe(false);
    expect(
      LicenceSchema.safeParse({ ...ogl, sourceUrl: "not-a-url" }).success,
    ).toBe(false);
  });

  it("exports one explicit human approval receipt shape", () => {
    const receipt = {
      reviewerKind: "human" as const,
      reviewerId: "reviewer-1",
      reviewerName: "Human Reviewer",
      reviewedAt: "2026-08-26T05:00:00.000Z",
      sourceDigest: "b".repeat(64),
      itemDigest: "c".repeat(64),
      decision: "approved",
    };
    expect(ReviewReceiptSchema.safeParse(receipt).success).toBe(true);
    expect(
      ReviewReceiptSchema.safeParse({ ...receipt, decision: "pending" })
        .success,
    ).toBe(false);
    expect(
      ReviewReceiptSchema.safeParse({ ...receipt, decision: "rejected" })
        .success,
    ).toBe(true);
  });
});
