import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
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

// ---- Grammar safety -------------------------------------------------------
// A sentence is grammatical only if a singular noun subject agrees with a verb.
// Because the corpus holds only base-form verbs (no -s / -ing / -ed), a bare
// verb after a 3rd-person-singular subject is ungrammatical. We reject known
// broken families explicitly and also block a class of subject/verb mismatches.
const PRONOUN_SUBJECTS = new Set([
  "he",
  "she",
  "it",
  "the man",
  "the woman",
  "the boy",
  "the girl",
  "the baby",
  "the cat",
  "the dog",
  "the bird",
  "the cow",
  "the pig",
  "the fox",
  "the sun",
  "the rat",
  "the bat",
  "the dad",
  "the friend",
]);

const KNOWN_INVALID = [
  "the big man run",
  "the man eat the woman",
  "the man run on the woman",
  "the small woman play",
  "the woman read the boy",
  "the woman play in the boy",
  "the orange run",
  "the green blueberry walk",
  "the man can eat the woman",
];

// Produce the subject token(s) preceding the finite verb, for agreement checks.
const subjectOf = (tokens: string[]): string[] => {
  // Drop a leading article ("the"/"a"/"an").
  const head = tokens.slice();
  if (head[0] === "the" || head[0] === "a" || head[0] === "an") head.shift();
  return head.slice(0, 2);
};

// We treat a sentence as needing agreement if it is NOT a "can"/"is"/"are"
// construction and the subject is a 3rd-person singular noun/pronoun followed
// directly by a bare verb.
const BARE_VERBS = new Set([
  "run",
  "eat",
  "play",
  "read",
  "stop",
  "walk",
  "find",
  "give",
  "help",
  "make",
  "jump",
  "sit",
  "see",
  "go",
  "look",
  "like",
  "sleep",
  "sing",
  "swim",
  "fly",
  "open",
  "close",
  "climb",
  "catch",
  "draw",
  "write",
  "count",
  "hide",
  "bake",
  "ride",
]);

const isGrammatical = (text: string): boolean => {
  const lower = text.toLowerCase().replace(/\.$/, "").trim();
  if (KNOWN_INVALID.includes(lower)) return false;

  const tokens = sentenceTokens(text);
  // "X can Y" / "X is Y" / "X are Y" are grammatical regardless of verb form.
  const modalIdx = tokens.indexOf("can");
  if (modalIdx !== -1) return true;
  const isIdx = tokens.indexOf("is");
  if (isIdx !== -1) return true;
  const areIdx = tokens.indexOf("are");
  if (areIdx !== -1) return true;

  const subject = subjectOf(tokens);
  const subjectPhrase = subject.join(" ");
  // Singular subject (pronoun or "the <noun>") followed by a bare verb: reject.
  const verbIdx = tokens.findIndex((t) => BARE_VERBS.has(t));
  if (verbIdx <= 0) return true;
  if (PRONOUN_SUBJECTS.has(subjectPhrase)) return false;
  return true;
};

// ---- Fabrication markers --------------------------------------------------
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
        if (lowered.includes(marker))
          hits.push(`${where} -> ${node.slice(0, 60)}`);
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

// ---- Real-file media verification ----------------------------------------
const SHA256_ZERO =
  "0000000000000000000000000000000000000000000000000000000000000000";

const verifyRealMedia = (
  url: string,
  expectedSha: string,
  expectedBytes: number,
): { ok: boolean; reason?: string; bytes?: number; sha?: string } => {
  // Asset urls are rooted at the public dir ("/content/...").
  const rel = url.replace(/^\//, "");
  const diskPath = resolve(repoRoot, "public", rel);
  if (!existsSync(diskPath)) return { ok: false, reason: `missing file: ${url}` };
  const data = readFileSync(diskPath);
  const bytes = data.length;
  const sha = createHash("sha256").update(data).digest("hex");
  if (bytes === 0) return { ok: false, reason: `zero-byte file: ${url}` };
  if (sha === SHA256_ZERO)
    return { ok: false, reason: `all-zero hash file: ${url}` };
  if (sha !== expectedSha)
    return {
      ok: false,
      reason: `hash mismatch ${url}: disk ${sha.slice(0, 12)} != record ${expectedSha.slice(0, 12)}`,
      bytes,
      sha,
    };
  if (bytes !== expectedBytes)
    return {
      ok: false,
      reason: `byte mismatch ${url}: disk ${bytes} != record ${expectedBytes}`,
      bytes,
      sha,
    };
  return { ok: true, bytes, sha };
};

// LICENCE.md truthfully covers ONLY the five MVP illustrations. It must not be
// cited as provenance for sentences, stories, or formations.
const ARTWORK_LICENCE = "content/mvp/LICENCE.md";

describe("SLC-003-T003 — reading and media inventory (honest repair)", () => {
  it("loads the canonical seed corpus", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    expect(corpus.sentences.length).toBeGreaterThan(0);
    expect(corpus.stories.length).toBeGreaterThan(0);
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

  it("rejects ungrammatical / known-invalid sentence families", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const bad: string[] = [];
    for (const sentence of corpus.sentences) {
      if (!isGrammatical(sentence.text))
        bad.push(`${sentence.id}: ${sentence.text}`);
    }
    expect(bad).toEqual([]);
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

  it("every story page binds real sentence ids AND every answer is grounded in that story's OWN sentences", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const sentenceById = new Map(corpus.sentences.map((s) => [s.id, s]));
    for (const story of corpus.stories) {
      expect(story.pages.length).toBeGreaterThan(0);
      const flat = story.pages.flatMap((p) => p.sentenceIds);
      expect(flat.length).toBeGreaterThan(0);
      // Story-local sentence set (NOT the global corpus set).
      const storySentenceTexts = new Set(
        flat.map((sid) => {
          expect(sentenceById.has(sid)).toBe(true);
          return (sentenceById.get(sid) as (typeof corpus.sentences)[number]).text.trim().toLowerCase();
        }),
      );
      const subject = story.title.trim().toLowerCase();
      for (const question of story.questions) {
        expect(question.acceptableAnswers.length).toBeGreaterThan(0);
        for (const answer of question.acceptableAnswers) {
          const normalized = answer.trim().toLowerCase();
          const groundedInThisStory = storySentenceTexts.has(normalized);
          const isSubject = subject.includes(normalized) || normalized.includes(subject.replace(/^the /, ""));
          expect(groundedInThisStory || isSubject).toBe(true);
        }
      }
    }
  });

  it("requires distinct valid geometry for grapheme formations a, s, and t", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const byGrapheme = new Map(corpus.formations.map((f) => [f.grapheme, f]));
    for (const g of ["a", "s", "t"]) {
      expect(byGrapheme.has(g), `missing formation for ${g}`).toBe(true);
      const f = byGrapheme.get(g) as (typeof corpus.formations)[number];
      expect(f.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(Number.isFinite(f.width) && f.width > 0).toBe(true);
      expect(Number.isFinite(f.height) && f.height > 0).toBe(true);
    }
    // Distinct paths: no two of a/s/t share identical waypoints.
    const key = (f: { waypoints: { x: number; y: number }[]; width: number; height: number }) =>
      JSON.stringify({ w: f.width, h: f.height, wp: f.waypoints });
    const sigs = ["a", "s", "t"].map((g) => key(byGrapheme.get(g) as never));
    expect(new Set(sigs).size).toBe(3);
  });

  it("opens every referenced media file and verifies real bytes, size, and SHA-256", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    expect(corpus.assets.length).toBeGreaterThan(0);
    for (const asset of corpus.assets) {
      const result = verifyRealMedia(asset.url, asset.sha256, asset.bytes);
      expect(result.ok, result.reason ?? "media invalid").toBe(true);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.sha256).not.toBe(SHA256_ZERO);
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

  it("rejects provenance that claims content/mvp/LICENCE.md covers sentences, stories, or formations", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const misattributed: string[] = [];
    for (const s of corpus.sentences)
      if (s.licence?.proofPath === ARTWORK_LICENCE)
        misattributed.push(`sentence ${s.id}`);
    for (const st of corpus.stories)
      if (st.licence?.proofPath === ARTWORK_LICENCE)
        misattributed.push(`story ${st.id}`);
    for (const f of corpus.formations)
      if (f.licence?.proofPath === ARTWORK_LICENCE)
        misattributed.push(`formation ${f.id}`);
    expect(misattributed).toEqual([]);
  });

  it("every narration/illustration reference (if present) resolves to a real asset — no empty or dangling refs", async () => {
    const corpus = await loadCanonicalCorpus(repoRoot);
    const assetIds = new Set(corpus.assets.map((a) => a.id));
    const dangling: string[] = [];
    for (const story of corpus.stories) {
      for (const page of story.pages) {
        const ref = page.illustrationAssetId;
        if (ref !== undefined) {
          if (typeof ref !== "string" || ref.trim() === "")
            dangling.push(`story ${story.id} page ${page.pageNumber}: empty illustrationAssetId`);
          else if (!assetIds.has(ref))
            dangling.push(`story ${story.id} page ${page.pageNumber}: dangling ${ref}`);
        }
      }
      const narr = (story as { narrationAudioRef?: unknown }).narrationAudioRef;
      if (narr !== undefined && (typeof narr !== "string" || narr.trim() === ""))
        dangling.push(`story ${story.id}: empty narrationAudioRef`);
    }
    for (const sentence of corpus.sentences) {
      const narr = (sentence as { narrationAudioRef?: unknown }).narrationAudioRef;
      if (narr !== undefined && (typeof narr !== "string" || narr.trim() === ""))
        dangling.push(`sentence ${sentence.id}: empty narrationAudioRef`);
    }
    expect(dangling).toEqual([]);
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
        hits.push(...containsFabrication(raw, rel));
      }
    }
    expect(hits).toEqual([]);
  });
});
