import { lstat, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  AssetRecordSchema,
  FormationPathSchema,
  GpcRecordSchema,
  MathsTemplateSchema,
  SentenceRecordSchema,
  StoryRecordSchema,
  WordRecordSchema,
  ContentPackManifestSchema,
  type AssetRecord,
  type ContentPackManifest,
  type FormationPath,
  type GpcRecord,
  type MathsTemplate,
  type SentenceRecord,
  type StoryRecord,
  type WordRecord,
} from "../src/index.full";
import { isSafeContentPath } from "./validators";

export interface CanonicalCorpus {
  readonly manifest: ContentPackManifest;
  readonly gpcs: readonly GpcRecord[];
  readonly words: readonly WordRecord[];
  readonly sentences: readonly SentenceRecord[];
  readonly stories: readonly StoryRecord[];
  readonly assets: readonly AssetRecord[];
  readonly formations: readonly FormationPath[];
  readonly mathsTemplates: readonly MathsTemplate[];
}

/**
 * Loads the canonical seed corpus from the JSON files in `content/seed/`.
 * The seed is the minimum data needed for the build pipeline to run end to end
 * during V1 development. The full PRD-minima inventory (2000+ words, 60+
 * stories, 40+ maths templates) is committed under `content/<version>/` by
 * the build step and is not checked into this spike.
 */
export async function loadCanonicalCorpus(
  root: string,
): Promise<CanonicalCorpus> {
  const base = resolve(root, "content", "seed");
  const readSeed = async (name: string): Promise<string> => {
    if (!isSafeContentPath(`content/seed/${name}`) || !name.endsWith(".json"))
      throw new Error(`path-escape:${name}`);
    const file = resolve(base, name);
    if ((await lstat(file)).isSymbolicLink())
      throw new Error(`symlink-rejected:${name}`);
    return readFile(file, "utf-8");
  };
  const [
    manifestRaw,
    gpcsRaw,
    wordsRaw,
    sentencesRaw,
    storiesRaw,
    assetsRaw,
    formationsRaw,
    mathsRaw,
  ] = await Promise.all([
    readSeed("manifest.json"),
    readSeed("gpcs.json"),
    readSeed("words.json"),
    readSeed("sentences.json"),
    readSeed("stories.json"),
    readSeed("assets.json"),
    readSeed("formations.json"),
    readSeed("maths.json"),
  ]);

  const legacy = (value: unknown) =>
    value && typeof value === "object" && !("recordVersion" in value)
      ? { ...(value as Record<string, unknown>), recordVersion: "0.1.0" }
      : value;

  return {
    manifest: ContentPackManifestSchema.parse(JSON.parse(manifestRaw)),
    gpcs: (JSON.parse(gpcsRaw) as unknown[]).map((value) =>
      GpcRecordSchema.parse(legacy(value)),
    ),
    words: (JSON.parse(wordsRaw) as unknown[]).map((value) =>
      WordRecordSchema.parse(legacy(value)),
    ),
    sentences: (JSON.parse(sentencesRaw) as unknown[]).map((value) =>
      SentenceRecordSchema.parse(legacy(value)),
    ),
    stories: (JSON.parse(storiesRaw) as unknown[]).map((value) =>
      StoryRecordSchema.parse(legacy(value)),
    ),
    assets: (JSON.parse(assetsRaw) as unknown[]).map((value) =>
      AssetRecordSchema.parse(legacy(value)),
    ),
    formations: (JSON.parse(formationsRaw) as unknown[]).map((value) =>
      FormationPathSchema.parse(legacy(value)),
    ),
    mathsTemplates: (JSON.parse(mathsRaw) as unknown[]).map((value) =>
      MathsTemplateSchema.parse(legacy(value)),
    ),
  };
}

export function corpusToRepository(corpus: CanonicalCorpus) {
  return {
    gpcs: corpus.gpcs,
    words: corpus.words,
    sentences: corpus.sentences,
    stories: corpus.stories,
    assets: corpus.assets,
    formations: corpus.formations,
    mathsTemplates: corpus.mathsTemplates,
  };
}
