import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import {
  DEFAULT_THRESHOLDS,
  loadCanonicalCorpus,
} from "../../packages/content-schema/src/index.full";

const repoRoot = resolve(__dirname, "..", "..");

describe("SLC-003-T002/3/4/5 — content seed", () => {
  it("loads the canonical seed corpus with the contract types", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    expect(corpus.gpcs.length).toBeGreaterThan(0);
    expect(corpus.words.length).toBeGreaterThan(0);
    expect(corpus.sentences.length).toBeGreaterThan(0);
    expect(corpus.stories.length).toBeGreaterThan(0);
    expect(corpus.assets.length).toBeGreaterThan(0);
    expect(corpus.formations.length).toBeGreaterThan(0);
    expect(corpus.mathsTemplates.length).toBeGreaterThan(0);
  });

  it("meets the word inventory minima", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const illustratedWords = corpus.words.filter((word) => word.illustrationAssetId);
    expect(corpus.words.length).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.minimumWords);
    expect(illustratedWords.length).toBeGreaterThanOrEqual(
      DEFAULT_THRESHOLDS.minimumIllustratedWords,
    );
  });

  it("every word record carries a recognised licence tier and a non-empty phoneme list", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    for (const word of corpus.words) {
      expect(["cc0-1.0", "commercial-perpetual", "project-original"]).toContain(word.licence.tier);
      expect(word.phonemes.length).toBeGreaterThan(0);
      expect(word.gpcIds.length).toBeGreaterThan(0);
    }
  });

  it("every story binds sentences to its pages and has at least one question", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    for (const story of corpus.stories) {
      const flat = story.pages.flatMap((p) => p.sentenceIds);
      expect(flat.length).toBeGreaterThan(0);
      expect(story.questions.length).toBeGreaterThan(0);
      for (const question of story.questions) {
        expect(question.acceptableAnswers.length).toBeGreaterThan(0);
      }
    }
  });

  it("every maths template tags at least one misconception", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    for (const template of corpus.mathsTemplates) {
      expect(template.misconceptionTags.length).toBeGreaterThan(0);
    }
  });
});
