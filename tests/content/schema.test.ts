import { describe, expect, it } from "vitest";
import {
  GpcRecordSchema,
  WordRecordSchema,
  ContentPackManifestSchema,
  SentenceRecordSchema,
  StoryRecordSchema,
  MathsTemplateSchema,
  AssetRecordSchema,
  FormationPathSchema,
  ReviewReceiptSchema,
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
      recordVersion: "0.1.0",
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
      recordVersion: "0.1.0",
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

  it("retains the versioned PRD word metadata instead of silently dropping it", () => {
    const result = WordRecordSchema.safeParse({
      id: "w-cat",
      spelling: "cat",
      displayForm: "Cat",
      lowercaseForm: "cat",
      wordClass: "noun",
      definition: "a small animal",
      exampleSentences: ["The cat sat."],
      phonemes: ["k", "a", "t"],
      graphemeSegments: ["c", "a", "t"],
      syllableSegments: ["cat"],
      pronunciationRef: "audio/cat.mp3",
      curriculumBand: "reception",
      decodableByStage: { reception: true, year1: true },
      commonExceptionWord: false,
      frequencyBand: "high",
      wordLength: 3,
      concreteImageSuitable: true,
      imageAssetRefs: ["asset-cat"],
      audioAssetRefs: ["audio-cat"],
      tracingPathAvailable: false,
      spellingPatternTags: ["cvc"],
      confusionSets: ["b/d"],
      allowedActivityTypes: ["picture-match"],
      safetyStatus: "approved",
      source: "reviewed-core",
      reviewStatus: "approved",
      reviewer: "content-reviewer",
      reviewReceipt: {
        reviewerKind: "human",
        reviewerId: "reviewer-1",
        reviewerName: "Human Reviewer",
        reviewedAt: "2026-08-26T05:00:00.000Z",
        sourceDigest: "a".repeat(64),
        itemDigest: "b".repeat(64),
        decision: "approved",
      },
      version: "1.0.0",
      deprecated: false,
      recordVersion: "1.0.0",
      gpcIds: ["gpc-c", "gpc-a", "gpc-t"],
      category: "concrete",
      decodable: true,
      taughtIn: ["reception"],
      licence: baseLicence,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayForm).toBe("Cat");
      expect(result.data.reviewStatus).toBe("approved");
      expect(result.data.version).toBe("1.0.0");
    }
  });

  it("requires a complete human review receipt for approved records", () => {
    const receipt = {
      reviewerKind: "human" as const,
      reviewerId: "reviewer-1",
      reviewerName: "Human Reviewer",
      reviewedAt: "2026-08-26T05:00:00.000Z",
      sourceDigest: "a".repeat(64),
      itemDigest: "b".repeat(64),
      decision: "approved" as const,
    };
    expect(ReviewReceiptSchema.safeParse(receipt).success).toBe(true);
    expect(
      ReviewReceiptSchema.safeParse({ ...receipt, sourceDigest: "bad" })
        .success,
    ).toBe(false);
    expect(
      ReviewReceiptSchema.safeParse({ ...receipt, decision: "pending" })
        .success,
    ).toBe(false);
    expect(
      WordRecordSchema.safeParse({
        recordVersion: "0.1.0",
        id: "w-rejected",
        spelling: "cat",
        phonemes: ["k", "a", "t"],
        gpcIds: ["gpc-c"],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        reviewStatus: "approved",
        reviewer: "content-reviewer",
        reviewReceipt: { ...receipt, decision: "rejected" },
        licence: baseLicence,
      }).success,
    ).toBe(false);
  });

  it("rejects incomplete explicitly versioned word, sentence, story and maths records", () => {
    expect(
      WordRecordSchema.safeParse({
        id: "legacy-without-version",
        spelling: "cat",
        phonemes: ["k"],
        gpcIds: [],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: baseLicence,
      }).success,
    ).toBe(false);
    expect(
      WordRecordSchema.safeParse({
        id: "unknown-version",
        spelling: "cat",
        phonemes: ["k"],
        gpcIds: [],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: baseLicence,
        recordVersion: "9.0.0",
      }).success,
    ).toBe(false);
    expect(
      WordRecordSchema.safeParse({
        id: "w",
        spelling: "cat",
        phonemes: ["k"],
        gpcIds: [],
        category: "concrete",
        decodable: true,
        taughtIn: ["reception"],
        licence: baseLicence,
        recordVersion: "1.0.0",
      }).success,
    ).toBe(false);
    expect(
      SentenceRecordSchema.safeParse({
        id: "s",
        text: "A cat.",
        wordIds: ["w"],
        decodableRatio: 1,
        level: "reception",
        licence: baseLicence,
        recordVersion: "1.0.0",
      }).success,
    ).toBe(false);
    expect(
      StoryRecordSchema.safeParse({
        id: "story",
        title: "Story",
        pages: [{ pageNumber: 1, sentenceIds: ["s"] }],
        questions: [
          {
            id: "q",
            prompt: "What?",
            acceptableAnswers: ["cat"],
            type: "literal",
          },
        ],
        level: "reception",
        licence: baseLicence,
        recordVersion: "1.0.0",
      }).success,
    ).toBe(false);
    expect(
      MathsTemplateSchema.safeParse({
        id: "m",
        strand: "number-to-10",
        level: "reception",
        representation: "concrete",
        generator: "count",
        answerKey: "n",
        misconceptionTags: [],
        licence: baseLicence,
        recordVersion: "1.0.0",
      }).success,
    ).toBe(false);
    expect(
      GpcRecordSchema.safeParse({
        recordVersion: "1.0.0",
        id: "g",
        grapheme: "g",
        phonemes: ["g"],
        exampleWordIds: [],
        position: "initial",
        curriculumOrder: 1,
        taughtIn: ["reception"],
        licence: baseLicence,
      }).success,
    ).toBe(false);
    expect(
      AssetRecordSchema.safeParse({
        recordVersion: "1.0.0",
        id: "a",
        url: "/a.svg",
        contentType: "image/svg+xml",
        sha256: "0".repeat(64),
        bytes: 1,
        greyscaleRecognisable: true,
        licence: baseLicence,
      }).success,
    ).toBe(false);
    expect(
      FormationPathSchema.safeParse({
        recordVersion: "1.0.0",
        id: "f",
        grapheme: "g",
        width: 1,
        height: 1,
        waypoints: [],
        licence: baseLicence,
      }).success,
    ).toBe(false);
  });
});
