import { describe, expect, it } from "vitest";
import {
  buildReadingPlan,
  makeReadingAttempt,
  makeComprehensionAttempt,
  DEFAULT_KNOWN_WORD_FLOOR,
  type ReadingContext,
} from "../../../packages/learning-engine/src/reading";
import type { MasteryProjection } from "../../../packages/learning-engine/src/mastery";
import type { SentenceRecord, StoryRecord, WordRecord } from "../../../packages/content-schema/src/index";

const word = (id: string, spelling: string, known: boolean): WordRecord =>
  ({
    recordVersion: "1.0.0",
    id,
    spelling,
    phonemes: ["a"],
    gpcIds: ["g1"],
    category: "concrete",
    decodable: true,
    taughtIn: ["reception"],
    licence: { tier: "original", holder: "Wawi Learns", licenceId: "WAWI-ORIG-1", attestation: "project-original" },
    graphemeSegments: [spelling],
    illustrationAssetId: `img-${id}`,
    audioAssetId: `aud-${id}`,
  }) as unknown as WordRecord;

const sentence = (id: string, text: string, wordIds: string[]): SentenceRecord =>
  ({
    recordVersion: "1.0.0",
    id,
    text,
    wordIds,
    decodableRatio: 1,
    level: "reception",
    licence: { tier: "original", holder: "Wawi Learns", licenceId: "WAWI-ORIG-1", attestation: "project-original" },
  }) as unknown as SentenceRecord;

const story = (id: string, pages: SentenceRecord[][], questions: StoryRecord["questions"] = []): StoryRecord =>
  ({
    recordVersion: "1.0.0",
    id,
    title: "Test Story",
    pages: pages.map((sents, i) => ({
      pageNumber: i + 1,
      sentenceIds: sents.map((s) => s.id),
      illustrationAssetId: `page-${i}`,
    })),
    questions,
    level: "reception",
    licence: { tier: "original", holder: "Wawi Learns", licenceId: "WAWI-ORIG-1", attestation: "project-original" },
  }) as unknown as StoryRecord;

const mastery = (knownIds: string[]): Map<string, MasteryProjection> => {
  const m = new Map<string, MasteryProjection>();
  for (const id of knownIds) {
    m.set(id, { itemId: id, state: "mastered", correctCount: 5, incorrectCount: 0, modalitiesUsed: ["visual"], reason: "known" });
  }
  return m;
};

const ctx = (over: Partial<ReadingContext> = {}): ReadingContext => {
  const w1 = word("w1", "cat", true);
  const w2 = word("w2", "sat", true);
  const w3 = word("w3", "the", false); // unknown
  const s1 = sentence("s1", "The cat sat.", ["w3", "w1", "w2"]);
  const st = story("story1", [[s1]], [
    { id: "q1", prompt: "What sat?", acceptableAnswers: ["cat"], type: "literal" },
  ]);
  return {
    story: st,
    sentences: new Map([[s1.id, s1]]),
    words: new Map([[w1.id, w1], [w2.id, w2], [w3.id, w3]]),
    mastery: mastery(["w1", "w2"]), // w3 unknown -> 2/3 = 0.667
    ...over,
  };
};

describe("SLC-006-T001 — controlled reading plan", () => {
  it("admits a story when >= 90% of words are known", () => {
    const w1 = word("w1", "cat", true);
    const w2 = word("w2", "sat", true);
    const w3 = word("w3", "mat", true);
    const w4 = word("w4", "the", true);
    const w5 = word("w5", "on", true);
    const w6 = word("w6", "a", true);
    const w7 = word("w7", "rug", true);
    const w8 = word("w8", "red", true);
    const w9 = word("w9", "big", true);
    const w10 = word("w10", "fox", false); // 1 unknown of 10 = 0.9
    const s1 = sentence("s1", "The cat sat on a red big rug.", ["w4", "w1", "w2", "w5", "w6", "w8", "w9", "w7"]);
    const s2 = sentence("s2", "A fox.", ["w6", "w10"]);
    const st = story("story2", [[s1], [s2]]);
    const m = new Map<string, MasteryProjection>();
    for (const w of [w1, w2, w3, w4, w5, w6, w7, w8, w9]) {
      m.set(w.id, { itemId: w.id, state: "mastered", correctCount: 5, incorrectCount: 0, modalitiesUsed: ["visual"], reason: "known" });
    }
    const plan = buildReadingPlan({
      ...ctx(),
      story: st,
      sentences: new Map([[s1.id, s1], [s2.id, s2]]),
      words: new Map([[w1.id, w1], [w2.id, w2], [w3.id, w3], [w4.id, w4], [w5.id, w5], [w6.id, w6], [w7.id, w7], [w8.id, w8], [w9.id, w9], [w10.id, w10]]),
      mastery: m,
    });
    expect(plan.knownWordRatio).toBeGreaterThanOrEqual(DEFAULT_KNOWN_WORD_FLOOR);
    expect(plan.admissible).toBe(true);
  });

  it("rejects (inadmissible) a story below the 90% known-word floor", () => {
    const plan = buildReadingPlan(ctx()); // 2/3 known = 0.667
    expect(plan.knownWordRatio).toBeCloseTo(0.6667, 3);
    expect(plan.admissible).toBe(false);
  });

  it("surfaces unknown words as pre-teach items, never fabricating missing records", () => {
    const plan = buildReadingPlan(ctx());
    expect(plan.preTeach).toHaveLength(1);
    expect(plan.preTeach[0]!.wordId).toBe("w3");
    expect(plan.preTeach[0]!.spelling).toBe("the");
    expect(plan.sentences[0]!.unknownWordIds).toEqual(["w3"]);
  });

  it("omits pre-teach when every word is known", () => {
    const known = ctx();
    // Make w3 known too.
    const plan = buildReadingPlan({ ...known, mastery: mastery(["w1", "w2", "w3"]) });
    expect(plan.preTeach).toHaveLength(0);
  });

  it("keeps reading (decode) and comprehension as separate evidence tracks", () => {
    const decode = makeReadingAttempt("s1", "correct", { hintCount: 0 });
    const comp = makeComprehensionAttempt("story1", "q1", "correct", "cat");
    expect(decode.evidenceTrack).toBe("decode");
    expect(decode.dimension).toBe("reading");
    expect(comp.evidenceTrack).toBe("comprehension");
    expect(comp.questionId).toBe("q1");
    expect(comp.acceptedAnswer).toBe("cat");
    // Different tracks => same story/sentence id does not collide as one fact.
    expect(decode.evidenceTrack === comp.evidenceTrack).toBe(false);
  });

  it("does not invent a word record for an unknown wordId absent from the corpus", () => {
    const missing = ctx();
    missing.story.pages[0]!.sentenceIds.push("s-missing");
    // sentence map has no s-missing; builder must skip, not fabricate.
    const plan = buildReadingPlan(missing);
    expect(plan.sentences.every((s) => s.sentenceId !== "s-missing")).toBe(true);
  });
});
