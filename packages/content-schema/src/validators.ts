import {
  AssetRecordSchema,
  ContentPackManifestSchema,
  FormationPathSchema,
  GpcRecordSchema,
  MathsTemplateSchema,
  SentenceRecordSchema,
  StoryRecordSchema,
  WordRecordSchema,
  type ContentPackManifest,
} from "../src/index";

export const ReasonCode = {
  DUPLICATE_SPELLING: "duplicate-spelling",
  HETEROPHONE: "heterophone",
  MISSING_REQUIRED_ASSET: "missing-required-asset",
  INVALID_LICENCE: "invalid-licence",
  COLOUR_ONLY_INSTRUCTION: "colour-only-instruction",
  UNKNOWN_SCHEMA_VERSION: "unknown-schema-version",
  US_SPELLING: "us-spelling",
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
  tier === "cc0-1.0" || tier === "commercial-perpetual" || tier === "project-original";

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
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: unknown } },
  values: readonly unknown[],
  path: string,
  failures: ValidationFailure[],
): T[] => {
  const out: T[] = [];
  values.forEach((value, idx) => {
    const result = schema.safeParse(value) as
      | { success: true; data: T }
      | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } };
    if (!result.success) {
      failures.push({
        code: ReasonCode.UNKNOWN_SCHEMA_VERSION,
        path: `${path}[${idx}]`,
        detail: result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
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

export function validateContentRepository(
  repository: Repository,
  manifest: unknown,
  options: ValidateOptions = {},
): ValidationResult {
  const failures: ValidationFailure[] = [];
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options };

  const manifestResult = ContentPackManifestSchema.safeParse(manifest) as
    | { success: true; data: ContentPackManifest }
    | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } };
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
  if (!thresholds.supportedSchemaVersions.includes(manifestResult.data.schemaVersion)) {
    failures.push({
      code: ReasonCode.UNKNOWN_SCHEMA_VERSION,
      path: "manifest.schemaVersion",
      detail: `schemaVersion ${manifestResult.data.schemaVersion} not in ${thresholds.supportedSchemaVersions.join(",")}`,
    });
  }

  const gpcs = assertShape(GpcRecordSchema, repository.gpcs, "gpcs", failures);
  const words = assertShape(WordRecordSchema, repository.words, "words", failures);
  const sentences = assertShape(SentenceRecordSchema, repository.sentences, "sentences", failures);
  const stories = assertShape(StoryRecordSchema, repository.stories, "stories", failures);
  const assets = assertShape(AssetRecordSchema, repository.assets, "assets", failures);
  const formations = assertShape(FormationPathSchema, repository.formations, "formations", failures);
  const mathsTemplates = assertShape(
    MathsTemplateSchema,
    repository.mathsTemplates,
    "mathsTemplates",
    failures,
  );

  // Duplicate canonical spelling across words
  const seen = new Map<string, string>();
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
    if (!licenceOk(word.licence.tier)) {
      failures.push({
        code: ReasonCode.LICENCE_INCOMPATIBLE,
        path: `words.${word.id}.licence`,
        detail: `tier "${word.licence.tier}" is not approved`,
      });
    }
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

  return { ok: failures.length === 0, failures };
}

export type { ContentPackManifest };