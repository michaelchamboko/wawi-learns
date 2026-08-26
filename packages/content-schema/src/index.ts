import { z } from "zod";

/**
 * Content schema definitions used by the build-time validator and the
 * runtime pack activation.
 * All schemas are versioned and additive; new fields require a schema
 * version bump and an additive migration in `packages/local-data/src/store.ts`.
 */
export const LICENCE_TIERS = [
  "cc0-1.0",
  "commercial-perpetual",
  "project-original",
] as const;
export type LicenceTier = (typeof LICENCE_TIERS)[number];

export const SchemaVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
export const RecordVersionSchema = z.enum(["0.1.0", "1.0.0"]);

export const LicenceSchema = z.object({
  tier: z.enum(LICENCE_TIERS),
  licenceId: z.string().min(1),
  sourceUrl: z.string().url(),
  proofPath: z.string().min(1),
  reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
  reviewer: z.string().min(1).optional(),
  reviewedAt: z.string().datetime().optional(),
});

const usSpellingBan = (value: string) =>
  !/\b(color|behavior|aluminum|honor|favor|center|theater|defense|license|practice|traveling)\b/i.test(
    value,
  ) ||
  /\b(colour|behaviour|aluminium|honour|favour|centre|theatre|defence|licence|practise|travelling)\b/i.test(
    value,
  );

export const GpcRecordSchema = z
  .object({
    recordVersion: RecordVersionSchema,
    id: z.string().min(1),
    grapheme: z.string().min(1).max(8),
    phonemes: z.array(z.string()).min(1),
    exampleWordIds: z.array(z.string()),
    position: z.enum(["initial", "medial", "final", "any"]),
    curriculumOrder: z.number().int().nonnegative(),
    taughtIn: z.array(z.enum(["reception", "year1"])).min(1),
    source: z.string().min(1).optional(),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
    reviewer: z.string().min(1).optional(),
    licence: LicenceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recordVersion === "1.0.0") {
      for (const field of ["source", "reviewStatus", "reviewer"] as const)
        if (value[field] === undefined)
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `v1 GPC record requires ${field}`,
          });
    }
  });

export const WordRecordSchema = z
  .object({
    recordVersion: RecordVersionSchema,
    id: z.string().min(1),
    spelling: z.string().min(1).refine(usSpellingBan, {
      message: "US spelling rejected; use British English.",
    }),
    displayForm: z.string().min(1).optional(),
    lowercaseForm: z.string().min(1).optional(),
    wordClass: z.string().min(1).optional(),
    definition: z.string().min(1).optional(),
    exampleSentences: z.array(z.string().min(1)).min(1).optional(),
    phonemes: z.array(z.string()).min(1),
    graphemeSegments: z.array(z.string().min(1)).min(1).optional(),
    syllableSegments: z.array(z.string().min(1)).min(1).optional(),
    pronunciationRef: z.string().min(1).optional(),
    curriculumBand: z.string().min(1).optional(),
    decodableByStage: z.record(z.string(), z.boolean()).optional(),
    commonExceptionWord: z.boolean().optional(),
    frequencyBand: z.string().min(1).optional(),
    wordLength: z.number().int().positive().optional(),
    concreteImageSuitable: z.boolean().optional(),
    imageAssetRefs: z.array(z.string().min(1)).optional(),
    audioAssetRefs: z.array(z.string().min(1)).optional(),
    tracingPathAvailable: z.boolean().optional(),
    spellingPatternTags: z.array(z.string().min(1)).optional(),
    confusionSets: z.array(z.string().min(1)).optional(),
    allowedActivityTypes: z.array(z.string().min(1)).optional(),
    safetyStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    source: z.string().min(1).optional(),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
    reviewer: z.string().min(1).optional(),
    version: SchemaVersionSchema.optional(),
    deprecated: z.boolean().optional(),
    gpcIds: z.array(z.string()).min(1),
    category: z.enum(["concrete", "action", "abstract", "exception"]),
    decodable: z.boolean(),
    taughtIn: z.array(z.enum(["reception", "year1"])).min(1),
    illustrationAssetId: z.string().optional(),
    audioAssetId: z.string().optional(),
    licence: LicenceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recordVersion !== "1.0.0") return;
    for (const field of [
      "displayForm",
      "lowercaseForm",
      "wordClass",
      "definition",
      "exampleSentences",
      "graphemeSegments",
      "syllableSegments",
      "pronunciationRef",
      "curriculumBand",
      "decodableByStage",
      "commonExceptionWord",
      "frequencyBand",
      "wordLength",
      "concreteImageSuitable",
      "imageAssetRefs",
      "audioAssetRefs",
      "tracingPathAvailable",
      "spellingPatternTags",
      "confusionSets",
      "allowedActivityTypes",
      "safetyStatus",
      "source",
      "reviewStatus",
      "reviewer",
      "version",
      "deprecated",
    ] as const) {
      if (value[field] === undefined)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `v1 word record requires ${field}`,
        });
    }
  });

export const SentenceRecordSchema = z
  .object({
    recordVersion: RecordVersionSchema,
    id: z.string().min(1),
    text: z.string().min(1),
    wordIds: z.array(z.string()).min(1),
    decodableRatio: z.number().min(0).max(1),
    curriculumBand: z.string().min(1).optional(),
    requiredPhonics: z.array(z.string().min(1)).optional(),
    knownWordRatio: z.number().min(0).max(1).optional(),
    introducedWordIds: z.array(z.string().min(1)).optional(),
    complexity: z.number().int().nonnegative().optional(),
    narrationAudioRef: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
    reviewer: z.string().min(1).optional(),
    level: z.enum(["reception", "year1"]),
    licence: LicenceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recordVersion !== "1.0.0") return;
    for (const field of [
      "curriculumBand",
      "requiredPhonics",
      "knownWordRatio",
      "introducedWordIds",
      "complexity",
      "narrationAudioRef",
      "source",
      "reviewStatus",
      "reviewer",
    ] as const) {
      if (value[field] === undefined)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `v1 sentence record requires ${field}`,
        });
    }
  });

export const StoryRecordSchema = z
  .object({
    recordVersion: RecordVersionSchema,
    id: z.string().min(1),
    title: z.string().min(1),
    pages: z.array(
      z.object({
        pageNumber: z.number().int().positive(),
        sentenceIds: z.array(z.string()).min(1),
        illustrationAssetId: z.string().optional(),
      }),
    ),
    questions: z.array(
      z.object({
        id: z.string().min(1),
        prompt: z.string().min(1),
        acceptableAnswers: z.array(z.string()).min(1),
        type: z.enum(["literal", "inferential"]),
      }),
    ),
    curriculumBand: z.string().min(1).optional(),
    requiredPhonics: z.array(z.string().min(1)).optional(),
    knownWordRatio: z.number().min(0).max(1).optional(),
    introducedWordIds: z.array(z.string().min(1)).optional(),
    narrationAudioRef: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
    reviewer: z.string().min(1).optional(),
    level: z.enum(["reception", "year1"]),
    licence: LicenceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recordVersion !== "1.0.0") return;
    for (const field of [
      "curriculumBand",
      "requiredPhonics",
      "knownWordRatio",
      "introducedWordIds",
      "narrationAudioRef",
      "source",
      "reviewStatus",
      "reviewer",
    ] as const) {
      if (value[field] === undefined)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `v1 story record requires ${field}`,
        });
    }
  });

export const AssetRecordSchema = z
  .object({
    recordVersion: RecordVersionSchema,
    id: z.string().min(1),
    url: z.string(),
    contentType: z.string(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    bytes: z.number().int().nonnegative(),
    greyscaleRecognisable: z.boolean(),
    assetKind: z.enum(["image", "audio", "tracing", "diagram"]).optional(),
    safetyStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
    reviewer: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    licence: LicenceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recordVersion === "1.0.0") {
      for (const field of [
        "assetKind",
        "safetyStatus",
        "reviewStatus",
        "reviewer",
        "source",
      ] as const)
        if (value[field] === undefined)
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `v1 asset record requires ${field}`,
          });
    }
  });

export const FormationPathSchema = z
  .object({
    recordVersion: RecordVersionSchema,
    id: z.string().min(1),
    grapheme: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    waypoints: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        direction: z.enum([
          "left-to-right",
          "top-to-bottom",
          "right-to-left",
          "bottom-to-top",
        ]),
      }),
    ),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
    reviewer: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    licence: LicenceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recordVersion === "1.0.0") {
      for (const field of ["reviewStatus", "reviewer", "source"] as const)
        if (value[field] === undefined)
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `v1 formation record requires ${field}`,
          });
    }
  });

export const MathsTemplateSchema = z
  .object({
    recordVersion: RecordVersionSchema,
    id: z.string().min(1),
    strand: z.enum([
      "number-to-10",
      "number-to-20",
      "number-to-100",
      "place-value",
      "addition-subtraction",
      "multiplication-division",
      "fractions",
      "measure",
      "time",
      "money",
      "shape-position",
      "pattern",
    ]),
    level: z.enum(["reception", "year1"]),
    representation: z.enum(["concrete", "pictorial", "abstract"]),
    generator: z.string().regex(/^[a-z][a-z0-9-]*$/),
    answerKey: z.string().min(1),
    misconceptionTags: z.array(z.string()),
    source: z.string().min(1).optional(),
    difficulty: z.object({ min: z.number(), max: z.number() }).optional(),
    hintSequence: z.array(z.string().min(1)).optional(),
    languageComplexity: z.number().int().nonnegative().optional(),
    offlineAssetRequirements: z.array(z.string().min(1)).optional(),
    reviewStatus: z.enum(["draft", "in-review", "approved"]).optional(),
    reviewer: z.string().min(1).optional(),
    licence: LicenceSchema,
  })
  .superRefine((value, ctx) => {
    if (value.recordVersion !== "1.0.0") return;
    for (const field of [
      "difficulty",
      "hintSequence",
      "languageComplexity",
      "offlineAssetRequirements",
      "source",
      "reviewStatus",
      "reviewer",
    ] as const) {
      if (value[field] === undefined)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `v1 maths template requires ${field}`,
        });
    }
  });

export const ContentPackManifestSchema = z.object({
  packVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  schemaVersion: SchemaVersionSchema,
  curriculumVersion: z.string(),
  engineVersion: z.string(),
  issuedAt: z.number(),
  counts: z.object({
    gpc: z.number().int().nonnegative(),
    words: z.number().int().nonnegative(),
    sentences: z.number().int().nonnegative(),
    stories: z.number().int().nonnegative(),
    assets: z.number().int().nonnegative(),
    formations: z.number().int().nonnegative(),
    mathsTemplates: z.number().int().nonnegative(),
  }),
  assets: z.array(AssetRecordSchema),
  entryUrls: z.array(z.string()).min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export type GpcRecord = z.infer<typeof GpcRecordSchema>;
export type WordRecord = z.infer<typeof WordRecordSchema>;
export type SentenceRecord = z.infer<typeof SentenceRecordSchema>;
export type StoryRecord = z.infer<typeof StoryRecordSchema>;
export type AssetRecord = z.infer<typeof AssetRecordSchema>;
export type FormationPath = z.infer<typeof FormationPathSchema>;
export type MathsTemplate = z.infer<typeof MathsTemplateSchema>;
export type ContentPackManifest = z.infer<typeof ContentPackManifestSchema>;
export type Licence = z.infer<typeof LicenceSchema>;
