import {
  AssetRecordSchema,
  ContentPackManifestSchema,
  FormationPathSchema,
  GpcRecordSchema,
  MathsTemplateSchema,
  ReviewReceiptSchema,
  SentenceRecordSchema,
  StoryRecordSchema,
  WordRecordSchema,
  type ContentPackManifest,
} from "../src/index";

export const ReasonCode = {
  SCHEMA_INVALID: "schema-invalid",
  DUPLICATE_SPELLING: "duplicate-spelling",
  DUPLICATE_CANONICAL_CONTENT: "duplicate-canonical-content",
  HETEROPHONE: "heterophone",
  MISSING_REQUIRED_ASSET: "missing-required-asset",
  INVALID_LICENCE: "invalid-licence",
  COLOUR_ONLY_INSTRUCTION: "colour-only-instruction",
  UNKNOWN_SCHEMA_VERSION: "unknown-schema-version",
  US_SPELLING: "us-spelling",
  BRITISH_ENGLISH: "british-english",
  PHONICS_UNSUPPORTED: "phonics-unsupported",
  NON_DECODABLE: "non-decodable",
  BROKEN_ANSWER: "broken-answer",
  MISSING_REVIEW: "missing-review",
  UNSUPPORTED_GPC: "unsupported-gpc",
  LICENCE_INCOMPATIBLE: "licence-incompatible",
  PATH_ESCAPE: "path-escape",
  SYMLINK_REJECTED: "symlink-rejected",
  EMPTY_DICTIONARY: "empty-dictionary",
} as const;

export type ReasonCodeValue = (typeof ReasonCode)[keyof typeof ReasonCode];

export interface ValidationFailure {
  readonly code: ReasonCodeValue;
  readonly path: string;
  readonly detail: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly failures: readonly ValidationFailure[];
}

const licenceOk = (tier: string): boolean =>
  tier === "cc0-1.0" ||
  tier === "commercial-perpetual" ||
  tier === "project-original" ||
  tier === "ogl-3.0";

export interface Repository {
  readonly gpcs: readonly unknown[];
  readonly words: readonly unknown[];
  readonly sentences: readonly unknown[];
  readonly stories: readonly unknown[];
  readonly assets: readonly unknown[];
  readonly formations: readonly unknown[];
  readonly mathsTemplates: readonly unknown[];
}

const assertShape = <T>(
  schema: {
    safeParse: (
      input: unknown,
    ) => { success: true; data: T } | { success: false; error: unknown };
  },
  values: readonly unknown[],
  path: string,
  failures: ValidationFailure[],
): T[] => {
  const out: T[] = [];
  values.forEach((value, idx) => {
    const result = schema.safeParse(value) as
      | { success: true; data: T }
      | {
          success: false;
          error: { issues: Array<{ path: PropertyKey[]; message: string }> };
        };
    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      failures.push({
        code: details.includes("recordVersion")
          ? ReasonCode.SCHEMA_INVALID
          : ReasonCode.UNKNOWN_SCHEMA_VERSION,
        path: `${path}[${idx}]`,
        detail: details,
      });
      return;
    }
    out.push(result.data);
  });
  return out;
};

export interface ValidateOptions {
  readonly minimumWords?: number;
  readonly minimumIllustratedWords?: number;
  readonly minimumSentences?: number;
  readonly minimumStories?: number;
  readonly minimumGpcs?: number;
  readonly minimumMathsTemplates?: number;
  readonly supportedSchemaVersions?: readonly string[];
}

export const DEFAULT_THRESHOLDS: Required<ValidateOptions> = {
  minimumWords: 2000,
  minimumIllustratedWords: 800,
  minimumSentences: 400,
  minimumStories: 60,
  minimumGpcs: 44,
  minimumMathsTemplates: 40,
  supportedSchemaVersions: ["1.0.0"],
};

export const isSafeContentPath = (value: string): boolean => {
  if (!value || value.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(value))
    return false;
  const segments = value.replaceAll("\\", "/").split("/");
  if (segments.includes("..") || segments.some((segment) => segment === ""))
    return false;
  return !/[.](?:js|jsx|ts|tsx|mjs|cjs)$/i.test(value);
};

export const canonicalizeContent = (value: unknown): string =>
  JSON.stringify(value, (_key, nested) => {
    if (!nested || typeof nested !== "object" || Array.isArray(nested))
      return nested;
    return Object.fromEntries(
      Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)),
    );
  });

export function validateContentRepository(
  repository: Repository,
  manifest: unknown,
  options: ValidateOptions = {},
): ValidationResult {
  const failures: ValidationFailure[] = [];
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options };

  const manifestResult = ContentPackManifestSchema.safeParse(manifest) as
    | { success: true; data: ContentPackManifest }
    | {
        success: false;
        error: { issues: Array<{ path: PropertyKey[]; message: string }> };
      };
  if (!manifestResult.success) {
    failures.push({
      code: ReasonCode.UNKNOWN_SCHEMA_VERSION,
      path: "manifest",
      detail: manifestResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
    return { ok: false, failures };
  }
  if (
    !thresholds.supportedSchemaVersions.includes(
      manifestResult.data.schemaVersion,
    )
  ) {
    failures.push({
      code: ReasonCode.UNKNOWN_SCHEMA_VERSION,
      path: "manifest.schemaVersion",
      detail: `schemaVersion ${manifestResult.data.schemaVersion} not in ${thresholds.supportedSchemaVersions.join(",")}`,
    });
  }

  const gpcs = assertShape(GpcRecordSchema, repository.gpcs, "gpcs", failures);
  const words = assertShape(
    WordRecordSchema,
    repository.words,
    "words",
    failures,
  );
  const sentences = assertShape(
    SentenceRecordSchema,
    repository.sentences,
    "sentences",
    failures,
  );
  const stories = assertShape(
    StoryRecordSchema,
    repository.stories,
    "stories",
    failures,
  );
  const assets = assertShape(
    AssetRecordSchema,
    repository.assets,
    "assets",
    failures,
  );
  const formations = assertShape(
    FormationPathSchema,
    repository.formations,
    "formations",
    failures,
  );
  const mathsTemplates = assertShape(
    MathsTemplateSchema,
    repository.mathsTemplates,
    "mathsTemplates",
    failures,
  );
  void formations;

  const gpcIds = new Set(gpcs.map((gpc) => gpc.id));
  const wordIds = new Set(words.map((word) => word.id));
  const assetIds = new Set(assets.map((asset) => asset.id));
  const checkReview = (values: readonly unknown[], path: string) => {
    values.forEach((value, index) => {
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      const receipt = ReviewReceiptSchema.safeParse(record.reviewReceipt);
      if (
        record.recordVersion === "1.0.0" &&
        (record.reviewStatus !== "approved" ||
          typeof record.reviewer !== "string" ||
          typeof record.source !== "string" ||
          !receipt.success ||
          receipt.data.decision !== "approved")
      ) {
        failures.push({
          code: ReasonCode.MISSING_REVIEW,
          path: `${path}[${index}]`,
          detail: "v1 records require approved review, reviewer and source",
        });
      }
    });
  };
  checkReview(repository.gpcs, "gpcs");
  checkReview(repository.words, "words");
  checkReview(repository.sentences, "sentences");
  checkReview(repository.stories, "stories");
  checkReview(repository.assets, "assets");
  checkReview(repository.formations, "formations");
  checkReview(repository.mathsTemplates, "mathsTemplates");
  for (const raw of repository.words) {
    if (!raw || typeof raw !== "object") continue;
    const word = raw as Record<string, unknown>;
    if (
      typeof word.spelling === "string" &&
      /\b(color|behavior|aluminum|honor|favor|center|theater|defense|license|practice|traveling)\b/i.test(
        word.spelling,
      ) &&
      !/\b(colour|behaviour|aluminium|honour|favour|centre|theatre|defence|licence|practise|travelling)\b/i.test(
        word.spelling,
      )
    ) {
      failures.push({
        code: ReasonCode.BRITISH_ENGLISH,
        path: `words.${String(word.id ?? "unknown")}.spelling`,
        detail: "use British English spelling",
      });
    }
    if (word.reviewStatus === "approved" && typeof word.reviewer !== "string") {
      failures.push({
        code: ReasonCode.MISSING_REVIEW,
        path: `words.${String(word.id ?? "unknown")}.reviewer`,
        detail: "approved records require a reviewer",
      });
    }
    if (
      word.licence &&
      typeof word.licence === "object" &&
      !licenceOk(String((word.licence as Record<string, unknown>).tier))
    ) {
      failures.push({
        code: ReasonCode.INVALID_LICENCE,
        path: `words.${String(word.id ?? "unknown")}.licence`,
        detail: "licence tier is not approved",
      });
    }
    if (Array.isArray(word.gpcIds)) {
      for (const gpcId of word.gpcIds)
        if (typeof gpcId === "string" && !gpcIds.has(gpcId))
          failures.push({
            code: ReasonCode.PHONICS_UNSUPPORTED,
            path: `words.${String(word.id ?? "unknown")}.gpcIds`,
            detail: `unknown GPC ${gpcId}`,
          });
    }
    if (
      typeof word.illustrationAssetId === "string" &&
      !assetIds.has(word.illustrationAssetId)
    )
      failures.push({
        code: ReasonCode.MISSING_REQUIRED_ASSET,
        path: `words.${String(word.id ?? "unknown")}.illustrationAssetId`,
        detail: "referenced asset is missing",
      });
  }
  for (const raw of repository.sentences) {
    if (!raw || typeof raw !== "object") continue;
    const sentence = raw as Record<string, unknown>;
    if (
      typeof sentence.text === "string" &&
      /^\s*colou?r\s+(the|a|an)\b/i.test(sentence.text)
    )
      failures.push({
        code: ReasonCode.COLOUR_ONLY_INSTRUCTION,
        path: `sentences.${String(sentence.id ?? "unknown")}.text`,
        detail: "colour-only instructions are not valid learning content",
      });
    if (
      sentence.requiredPhonics !== undefined &&
      typeof sentence.decodableRatio === "number" &&
      sentence.decodableRatio < 1
    )
      failures.push({
        code: ReasonCode.NON_DECODABLE,
        path: `sentences.${String(sentence.id ?? "unknown")}.decodableRatio`,
        detail:
          "versioned decodable sentences require complete phonics coverage",
      });
    if (
      Array.isArray(sentence.wordIds) &&
      sentence.wordIds.some((id) => typeof id === "string" && !wordIds.has(id))
    )
      failures.push({
        code: ReasonCode.PHONICS_UNSUPPORTED,
        path: `sentences.${String(sentence.id ?? "unknown")}.wordIds`,
        detail: "sentence references an unknown word",
      });
  }
  for (const raw of repository.stories) {
    if (!raw || typeof raw !== "object") continue;
    const story = raw as Record<string, unknown>;
    if (
      Array.isArray(story.questions) &&
      story.questions.some(
        (question) =>
          question &&
          typeof question === "object" &&
          Array.isArray(
            (question as Record<string, unknown>).acceptableAnswers,
          ) &&
          (
            (question as Record<string, unknown>).acceptableAnswers as unknown[]
          ).some(
            (answer) => typeof answer !== "string" || answer.trim() === "",
          ),
      )
    )
      failures.push({
        code: ReasonCode.BROKEN_ANSWER,
        path: `stories.${String(story.id ?? "unknown")}.questions`,
        detail: "every question needs a non-empty acceptable answer",
      });
  }

  // Duplicate canonical spelling across words
  const seen = new Map<string, string>();
  const seenCanonical = new Map<string, string>();
  for (const word of words) {
    const key = word.spelling.toLowerCase();
    if (seen.has(key)) {
      failures.push({
        code: ReasonCode.DUPLICATE_SPELLING,
        path: `words.${word.id}`,
        detail: `spelling "${word.spelling}" already used by ${seen.get(key)}`,
      });
    } else {
      seen.set(key, word.id);
    }
    const canonical = canonicalizeContent({
      spelling: key,
      phonemes: word.phonemes,
    });
    if (seenCanonical.has(canonical))
      failures.push({
        code: ReasonCode.DUPLICATE_CANONICAL_CONTENT,
        path: `words.${word.id}`,
        detail: `canonical content already used by ${seenCanonical.get(canonical)}`,
      });
    else seenCanonical.set(canonical, word.id);
    if (seen.has(key) && seen.get(key) !== word.id) {
      const prior = words.find((candidate) => candidate.id === seen.get(key));
      if (
        prior &&
        canonicalizeContent(prior.phonemes) !==
          canonicalizeContent(word.phonemes)
      )
        failures.push({
          code: ReasonCode.HETEROPHONE,
          path: `words.${word.id}.phonemes`,
          detail: `spelling "${word.spelling}" has conflicting phonemes`,
        });
    }
    if (!licenceOk(word.licence.tier)) {
      failures.push({
        code: ReasonCode.LICENCE_INCOMPATIBLE,
        path: `words.${word.id}.licence`,
        detail: `tier "${word.licence.tier}" is not approved`,
      });
    }
    if (!licenceOk(word.licence.tier))
      failures.push({
        code: ReasonCode.INVALID_LICENCE,
        path: `words.${word.id}.licence`,
        detail: "licence tier is not approved",
      });
  }

  if (gpcs.length < thresholds.minimumGpcs) {
    failures.push({
      code: ReasonCode.UNSUPPORTED_GPC,
      path: "gpcs",
      detail: `need at least ${thresholds.minimumGpcs} GPC records, found ${gpcs.length}`,
    });
  }
  if (words.length < thresholds.minimumWords) {
    failures.push({
      code: ReasonCode.EMPTY_DICTIONARY,
      path: "words",
      detail: `need at least ${thresholds.minimumWords} words, found ${words.length}`,
    });
  }
  const illustrated = words.filter((w) => Boolean(w.illustrationAssetId));
  if (illustrated.length < thresholds.minimumIllustratedWords) {
    failures.push({
      code: ReasonCode.MISSING_REQUIRED_ASSET,
      path: "words.illustration",
      detail: `need at least ${thresholds.minimumIllustratedWords} illustrated concrete/action words, found ${illustrated.length}`,
    });
  }
  if (sentences.length < thresholds.minimumSentences) {
    failures.push({
      code: ReasonCode.MISSING_REQUIRED_ASSET,
      path: "sentences",
      detail: `need at least ${thresholds.minimumSentences} sentences, found ${sentences.length}`,
    });
  }
  if (stories.length < thresholds.minimumStories) {
    failures.push({
      code: ReasonCode.MISSING_REQUIRED_ASSET,
      path: "stories",
      detail: `need at least ${thresholds.minimumStories} stories, found ${stories.length}`,
    });
  }
  if (mathsTemplates.length < thresholds.minimumMathsTemplates) {
    failures.push({
      code: ReasonCode.MISSING_REQUIRED_ASSET,
      path: "mathsTemplates",
      detail: `need at least ${thresholds.minimumMathsTemplates} maths templates, found ${mathsTemplates.length}`,
    });
  }

  const sortedFailures = failures.sort(
    (a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code),
  );
  return { ok: sortedFailures.length === 0, failures: sortedFailures };
}

export type { ContentPackManifest };
