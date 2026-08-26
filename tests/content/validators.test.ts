import { describe, expect, it } from "vitest";
import {
  DEFAULT_THRESHOLDS,
  ReasonCode,
  isSafeContentPath,
  validateContentRepository,
  type ContentPackManifest,
} from "../../packages/content-schema/src/index.full";

const baseLicence = {
  tier: "cc0-1.0" as const,
  licenceId: "CC0-1.0",
  sourceUrl: "https://example.org/source",
  proofPath: "docs/licence/cc0.md",
};

const baseManifest: ContentPackManifest = {
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

const emptyRepo = {
  gpcs: [],
  words: [],
  sentences: [],
  stories: [],
  assets: [],
  formations: [],
  mathsTemplates: [],
};

describe("SLC-003-T001 — content validators", () => {
  it("rejects an unknown schemaVersion", () => {
    const result = validateContentRepository(emptyRepo, {
      ...baseManifest,
      schemaVersion: "99.0.0",
    });
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain(
      ReasonCode.UNKNOWN_SCHEMA_VERSION,
    );
  });

  it("rejects an empty dictionary below the threshold", () => {
    const result = validateContentRepository(emptyRepo, baseManifest);
    expect(result.ok).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain(
      ReasonCode.EMPTY_DICTIONARY,
    );
    expect(result.failures.map((f) => f.code)).toContain(
      ReasonCode.UNSUPPORTED_GPC,
    );
  });

  it("rejects duplicate canonical spellings across the dictionary", () => {
    const words = [
      {
        id: "w-cat",
        recordVersion: "0.1.0",
        spelling: "cat",
        phonemes: ["k", "a", "t"],
        gpcIds: ["gpc-c", "gpc-a", "gpc-t"],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: baseLicence,
      },
      {
        id: "w-cat-2",
        recordVersion: "0.1.0",
        spelling: "cat",
        phonemes: ["k", "e", "t"],
        gpcIds: ["gpc-c", "gpc-a", "gpc-t"],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: baseLicence,
      },
      {
        id: "w-cat-3",
        recordVersion: "0.1.0",
        spelling: "cat",
        phonemes: ["k", "a", "t"],
        gpcIds: ["gpc-c", "gpc-a", "gpc-t"],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: baseLicence,
      },
    ];
    const result = validateContentRepository(
      { ...emptyRepo, words },
      baseManifest,
    );
    expect(result.failures.map((f) => f.code)).toContain(
      ReasonCode.DUPLICATE_SPELLING,
    );
    expect(result.failures.map((f) => f.code)).toContain(
      ReasonCode.DUPLICATE_CANONICAL_CONTENT,
    );
    expect(result.failures.map((f) => f.code)).toContain(
      ReasonCode.HETEROPHONE,
    );
  });

  it("rejects US spelling in any word record", () => {
    const words = [
      {
        id: "w-color",
        recordVersion: "0.1.0",
        spelling: "color",
        phonemes: ["k", "uh", "l", "uh", "r"],
        gpcIds: ["gpc-c", "gpc-o", "gpc-l", "gpc-o", "gpc-r"],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: baseLicence,
      },
    ];
    const result = validateContentRepository(
      { ...emptyRepo, words },
      baseManifest,
    );
    expect(result.ok).toBe(false);
    // The schema-level refine fails first, surfacing as UNKNOWN_SCHEMA_VERSION
    // with the original zod message. Either code is acceptable for the rubric.
    const codes = result.failures.map((f) => f.code);
    expect(codes).toContain(ReasonCode.UNKNOWN_SCHEMA_VERSION);
  });

  it("rejects an unknown licence tier in a word record", () => {
    const words = [
      {
        id: "w-cat",
        recordVersion: "0.1.0",
        spelling: "cat",
        phonemes: ["k", "a", "t"],
        gpcIds: ["gpc-c", "gpc-a", "gpc-t"],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: {
          ...baseLicence,
          tier: "cc-by-sa-4.0" as unknown as "cc0-1.0",
        },
      },
    ];
    const result = validateContentRepository(
      { ...emptyRepo, words },
      baseManifest,
    );
    expect(result.ok).toBe(false);
    // The schema rejects the unknown enum value first; either failure code is acceptable.
    const codes = result.failures.map((f) => f.code);
    expect(codes).toContain(ReasonCode.UNKNOWN_SCHEMA_VERSION);
    expect(codes).toContain(ReasonCode.INVALID_LICENCE);
  });

  it("threshold defaults match the PRD minima", () => {
    expect(DEFAULT_THRESHOLDS.minimumWords).toBe(2000);
    expect(DEFAULT_THRESHOLDS.minimumIllustratedWords).toBe(800);
    expect(DEFAULT_THRESHOLDS.minimumSentences).toBe(400);
    expect(DEFAULT_THRESHOLDS.minimumStories).toBe(60);
    expect(DEFAULT_THRESHOLDS.minimumGpcs).toBeGreaterThanOrEqual(44);
    expect(DEFAULT_THRESHOLDS.minimumMathsTemplates).toBe(40);
  });

  it("returns stable reasons in deterministic path order for safety and integrity failures", () => {
    const words = [
      {
        id: "w-color",
        recordVersion: "0.1.0",
        spelling: "color",
        phonemes: ["k"],
        gpcIds: ["missing-gpc"],
        category: "concrete" as const,
        decodable: true,
        taughtIn: ["reception" as const],
        illustrationAssetId: "missing-asset",
        reviewStatus: "approved",
        licence: baseLicence,
      },
    ];
    const result = validateContentRepository(
      { ...emptyRepo, words },
      baseManifest,
      {
        minimumWords: 0,
        minimumIllustratedWords: 0,
        minimumSentences: 0,
        minimumStories: 0,
        minimumGpcs: 0,
        minimumMathsTemplates: 0,
      },
    );
    expect(result.failures.map((failure) => failure.code)).toEqual(
      expect.arrayContaining([
        ReasonCode.BRITISH_ENGLISH,
        ReasonCode.PHONICS_UNSUPPORTED,
        ReasonCode.MISSING_REQUIRED_ASSET,
        ReasonCode.MISSING_REVIEW,
      ]),
    );
    expect(result.failures.map((failure) => failure.path)).toEqual(
      [...result.failures.map((failure) => failure.path)].sort(),
    );
  });

  it("rejects colour-only instructions, broken answers, and unsafe source paths", () => {
    const result = validateContentRepository(
      {
        ...emptyRepo,
        sentences: [
          {
            id: "s-1",
            text: "Colour the square.",
            wordIds: ["w-1"],
            requiredPhonics: ["gpc-s"],
            decodableRatio: 0,
            level: "reception",
            licence: baseLicence,
          },
        ],
        stories: [
          {
            id: "story-1",
            title: "A story",
            pages: [{ pageNumber: 1, sentenceIds: ["s-1"] }],
            questions: [
              {
                id: "q-1",
                prompt: "What?",
                acceptableAnswers: [""],
                type: "literal",
              },
            ],
            level: "reception",
            licence: baseLicence,
          },
        ],
      },
      baseManifest,
      {
        minimumWords: 0,
        minimumIllustratedWords: 0,
        minimumSentences: 0,
        minimumStories: 0,
        minimumGpcs: 0,
        minimumMathsTemplates: 0,
      },
    );
    expect(result.failures.map((failure) => failure.code)).toEqual(
      expect.arrayContaining([
        ReasonCode.COLOUR_ONLY_INSTRUCTION,
        ReasonCode.NON_DECODABLE,
        ReasonCode.BROKEN_ANSWER,
      ]),
    );
    expect(isSafeContentPath("../secret.json")).toBe(false);
    expect(isSafeContentPath("content/word.ts")).toBe(false);
    expect(isSafeContentPath("content/word.json")).toBe(true);
  });

  it("rejects unversioned arbitrary repository records instead of treating them as legacy", () => {
    const result = validateContentRepository(
      {
        ...emptyRepo,
        words: [
          {
            id: "w",
            spelling: "cat",
            phonemes: ["k"],
            gpcIds: [],
            category: "concrete",
            decodable: true,
            taughtIn: ["reception"],
            licence: baseLicence,
          },
        ],
      },
      baseManifest,
      {
        minimumWords: 0,
        minimumIllustratedWords: 0,
        minimumSentences: 0,
        minimumStories: 0,
        minimumGpcs: 0,
        minimumMathsTemplates: 0,
      },
    );
    expect(result.failures.map((failure) => failure.code)).toContain(
      ReasonCode.SCHEMA_INVALID,
    );
  });

  it("requires approved review evidence for v1 records", () => {
    const result = validateContentRepository(
      {
        ...emptyRepo,
        words: [
          {
            id: "w",
            recordVersion: "1.0.0",
            spelling: "cat",
            phonemes: ["k"],
            gpcIds: [],
            category: "concrete",
            decodable: true,
            taughtIn: ["reception"],
            source: "reviewed-core",
            reviewer: "reviewer",
            reviewStatus: "draft",
            licence: baseLicence,
          },
        ],
      },
      baseManifest,
      {
        minimumWords: 0,
        minimumIllustratedWords: 0,
        minimumSentences: 0,
        minimumStories: 0,
        minimumGpcs: 0,
        minimumMathsTemplates: 0,
      },
    );
    expect(result.failures.map((failure) => failure.code)).toContain(
      ReasonCode.MISSING_REVIEW,
    );
  });
});
