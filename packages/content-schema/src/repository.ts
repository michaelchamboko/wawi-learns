import { readFile } from "node:fs/promises";
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
export async function loadCanonicalCorpus(root: string): Promise<CanonicalCorpus> {
  const base = resolve(root, "content", "seed");
  const [manifestRaw, gpcsRaw, wordsRaw, sentencesRaw, storiesRaw, assetsRaw, formationsRaw, mathsRaw] =
    await Promise.all([
      readFile(resolve(base, "manifest.json"), "utf-8"),
      readFile(resolve(base, "gpcs.json"), "utf-8"),
      readFile(resolve(base, "words.json"), "utf-8"),
      readFile(resolve(base, "sentences.json"), "utf-8"),
      readFile(resolve(base, "stories.json"), "utf-8"),
      readFile(resolve(base, "assets.json"), "utf-8"),
      readFile(resolve(base, "formations.json"), "utf-8"),
      readFile(resolve(base, "maths.json"), "utf-8"),
    ]);

  return {
    manifest: ContentPackManifestSchema.parse(JSON.parse(manifestRaw)),
    gpcs: (JSON.parse(gpcsRaw) as unknown[]).map((value) => GpcRecordSchema.parse(value)),
    words: (JSON.parse(wordsRaw) as unknown[]).map((value) => WordRecordSchema.parse(value)),
    sentences: (JSON.parse(sentencesRaw) as unknown[]).map((value) =>
      SentenceRecordSchema.parse(value),
    ),
    stories: (JSON.parse(storiesRaw) as unknown[]).map((value) => StoryRecordSchema.parse(value)),
    assets: (JSON.parse(assetsRaw) as unknown[]).map((value) => AssetRecordSchema.parse(value)),
    formations: (JSON.parse(formationsRaw) as unknown[]).map((value) =>
      FormationPathSchema.parse(value),
    ),
    mathsTemplates: (JSON.parse(mathsRaw) as unknown[]).map((value) =>
      MathsTemplateSchema.parse(value),
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