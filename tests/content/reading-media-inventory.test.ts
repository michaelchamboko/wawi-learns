import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import {
  DEFAULT_THRESHOLDS,
  loadCanonicalCorpus,
} from "../../packages/content-schema/src/index.full";

const repoRoot = resolve(__dirname, "..", "..");

// Normalize a sentence/word string into lowercase alphabetic tokens so we can
// prove that the words referenced by a sentence actually spell out its text.
const normalizeToken = (value: string): string =>
  value.toLowerCase().replace(/[^a-z'’]/g, "");

const sentenceTokens = (text: string): string[] =>
  text
    .replace(/\.$/, "")
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

// Tokens that are real corpus words but are function words we should not treat
// as a "subject mismatch" signal. Kept explicit for clarity.
const FABRICATION_MARKERS = [
  "example.org",
  "placeholder",
  "aaaa",
  "bbbb",
  "0000000000000000000000000000000000000000000000000000000000000000",
  "reviewreceipt",
  "reviewedat",
  "approved",
];

const containsFabrication = (value: unknown, path = ""): string[] => {
  const hits: string[] = [];
  const walk = (node: unknown, where: string): void => {
    if (node === null || node === undefined) return;
    if (typeof node === "string") {
      const lowered = node.toLowerCase();
      for (const marker of FABRICATION_MARKERS) {
        if (lowered.includes(marker)) hits.push(`${where} -> ${node.slice(0, 60)}`);
      }
    } else if (Array.isArray(node)) {
      node.forEach((item, idx) => walk(item, `${where}[${idx}]`));
    } else if (typeof node === "object") {
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        walk(val, `${where}.${key}`);
      }
    }
  };
  walk(value, path);
  return hits;
};

describe("SLC-003-T003 — reading and media inventory (honest repair)", () => {
  it("loads the canonical seed corpus", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    expect(corpus.sentences.length).toBeGreaterThan(0);
    expect(corpus.stories.length).toBeGreaterThan(0);
    // Media may legitimately be empty in a spike; we only assert arrays exist.
    expect(Array.isArray(corpus.assets)).toBe(true);
    expect(Array.isArray(corpus.formations)).toBe(true);
  });

  it("meets the sentence inventory minimum with unique IDs and distinct texts", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    expect(corpus.sentences.length).toBeGreaterThanOrEqual(
      DEFAULT_THRESHOLDS.minimumSentences,
    );
    const ids = corpus.sentences.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const texts = corpus.sentences.map((s) => s.text.trim().toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("meets the story inventory minimum with unique IDs and distinct titles", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    expect(corpus.stories.length).toBeGreaterThanOrEqual(
      DEFAULT_THRESHOLDS.minimumStories,
    );
    const ids = corpus.stories.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = corpus.stories.map((s) => s.title.trim().toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("every sentence decodes: resolved wordIds spell its exact normalized text", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const spellById = new Map(corpus.words.map((w) => [w.id, w.spelling]));
    for (const sentence of corpus.sentences) {
      expect(sentence.wordIds.length).toBeGreaterThan(0);
      const resolved = sentence.wordIds.map((id) => {
        expect(spellById.has(id)).toBe(true);
        return normalizeToken(spellById.get(id) as string);
      });
      const expected = sentenceTokens(sentence.text);
      expect(resolved).toEqual(expected);
    }
  });

  it("every story page binds real sentence ids and every answer is grounded in those sentences", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const sentenceById = new Map(corpus.sentences.map((s) => [s.id, s]));
    const sentenceTexts = new Set(
      corpus.sentences.map((s) => s.text.trim().toLowerCase()),
    );
    for (const story of corpus.stories) {
      expect(story.pages.length).toBeGreaterThan(0);
      const flat = story.pages.flatMap((p) => p.sentenceIds);
      expect(flat.length).toBeGreaterThan(0);
      const storySentences = flat.map((sid) => {
        expect(sentenceById.has(sid)).toBe(true);
        return sentenceById.get(sid) as (typeof corpus.sentences)[number];
      });
      // Pages form a coherent passage: every referenced sentence exists above.
      expect(storySentences.length).toBe(flat.length);

      expect(story.questions.length).toBeGreaterThan(0);
      for (const question of story.questions) {
        expect(question.acceptableAnswers.length).toBeGreaterThan(0);
        for (const answer of question.acceptableAnswers) {
          expect(answer.trim().length).toBeGreaterThan(0);
          const normalized = answer.trim().toLowerCase();
          // Every literal answer must be either a real sentence in the story's
          // own sentences or the story subject (a corpus noun present in text).
          const isGroundedSentence = sentenceTexts.has(normalized);
          const isStorySubject = storySentences.some((s) =>
            s.text.toLowerCase().includes(normalized),
          );
          expect(isGroundedSentence || isStorySubject).toBe(true);
        }
      }
    }
  });

  it("no asset or formation references dangling or fabricated media", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    for (const asset of corpus.assets) {
      // Reject zero-byte / all-zero-hash / placeholder media.
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.sha256).not.toBe(
        "0000000000000000000000000000000000000000000000000000000000000000",
      );
      expect(asset.contentType).toBeTruthy();
      expect(asset.licence.tier).toBeTruthy();
    }
    // Manifest asset/formation counts must equal the actual arrays.
    const manifest = corpus.manifest;
    expect(manifest.counts.assets).toBe(corpus.assets.length);
    expect(manifest.counts.formations).toBe(corpus.formations.length);
    expect(manifest.counts.sentences).toBe(corpus.sentences.length);
    expect(manifest.counts.stories).toBe(corpus.stories.length);
  });

  it("no fabricated approval, receipt, placeholder metadata or example.org in seed records", async () => {
    const paths = [
      "content/seed/sentences.json",
      "content/seed/stories.json",
      "content/seed/assets.json",
      "content/seed/formations.json",
      "content/seed/manifest.json",
    ];
    const hits: string[] = [];
    for (const rel of paths) {
      const raw = readFileSync(resolve(repoRoot, rel), "utf-8");
      try {
        hits.push(...containsFabrication(JSON.parse(raw), rel));
      } catch {
        // Fall back to raw-string scan if a file is not pure JSON.
        hits.push(...containsFabrication(raw, rel));
      }
    }
    expect(hits).toEqual([]);
  });
});
