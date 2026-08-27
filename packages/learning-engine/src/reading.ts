/**
 * Controlled reading plan builder (SLC-006-T001).
 *
 * Builds a ReadingPlan from a child's mastery projection and the curated content
 * corpus. The plan enforces PRD-FR-011 / PRD-FR-017:
 *  - a story/sentence is only selected when >= 90% of its words are already
 *    "known" to the child (known = mastered/practising/strong, never "new");
 *  - words that are NOT yet known but appear in the selection are surfaced as
 *    pre-teaching items (tap-to-pronounce / grapheme / definition / practice);
 *  - reading attempts and comprehension attempts are recorded as SEPARATE
 *    evidence tracks (dimension "reading" for decode/word-support, a distinct
 *    comprehension event keyed by story/sentence id) so comprehension is never
 *    inferred from oral accuracy alone.
 *
 * The builder is pure: it never touches the child's speech, narration files, or
 * any provider output. It only reads the mastery projection and curated records.
 */
import type { MasteryProjection } from "./mastery";
import type { SentenceRecord, StoryRecord, WordRecord } from "../../content-schema/src/index";

/** A word the child has not yet mastered but which appears in the plan. */
export interface PreTeachItem {
  readonly wordId: string;
  readonly spelling: string;
  readonly graphemeSegments: readonly string[];
  readonly definition: string | null;
  readonly audioAssetId: string | null;
  readonly illustrationAssetId: string | null;
}

export interface ReadingSentence {
  readonly sentenceId: string;
  readonly text: string;
  readonly wordIds: readonly string[];
  readonly unknownWordIds: readonly string[];
  readonly knownWordRatio: number;
}

export interface ReadingPage {
  readonly pageNumber: number;
  readonly sentenceIds: readonly string[];
  readonly illustrationAssetId: string | null;
}

export interface ReadingQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly type: "literal" | "inferential";
  readonly acceptableAnswers: readonly string[];
}

export interface ReadingPlan {
  readonly storyId: string;
  readonly title: string;
  readonly knownWordRatio: number;
  readonly pages: readonly ReadingPage[];
  readonly sentences: readonly ReadingSentence[];
  readonly preTeach: readonly PreTeachItem[];
  readonly questions: readonly ReadingQuestion[];
  readonly narrationAudioRef: string | null;
  readonly admissible: boolean;
}

export interface ReadingContext {
  readonly story: StoryRecord;
  readonly sentences: ReadonlyMap<string, SentenceRecord>;
  readonly words: ReadonlyMap<string, WordRecord>;
  readonly mastery: ReadonlyMap<string, MasteryProjection>;
  /** Minimum known-word ratio for a story to be admissible (PRD-FR-011: >=0.9). */
  readonly knownWordFloor?: number;
}

export const DEFAULT_KNOWN_WORD_FLOOR = 0.9;

const KNOWN_STATES = new Set(["practising", "strong", "mastered"]);

const isKnown = (mastery: ReadonlyMap<string, MasteryProjection>, wordId: string): boolean => {
  const proj = mastery.get(wordId);
  return !!proj && KNOWN_STATES.has(proj.state);
};

const ratioOf = (known: number, total: number): number =>
  total === 0 ? 0 : known / total;

/**
 * Select the sentences of a story, flagging unknown words per sentence and
 * computing the overall known-word ratio. A sentence is always included (the
 * story was chosen as a whole), but its unknown words become pre-teach items.
 */
const planSentences = (
  ctx: ReadingContext,
): { sentences: ReadingSentence[]; overallRatio: number } => {
  const allWordIds: string[] = [];
  const sentences: ReadingSentence[] = [];
  for (const page of ctx.story.pages) {
    for (const sentenceId of page.sentenceIds) {
      const rec = ctx.sentences.get(sentenceId);
      if (!rec) continue;
      const unknown = rec.wordIds.filter((w) => !isKnown(ctx.mastery, w));
      for (const w of rec.wordIds) allWordIds.push(w);
      sentences.push({
        sentenceId: rec.id,
        text: rec.text,
        wordIds: rec.wordIds,
        unknownWordIds: unknown,
        knownWordRatio: ratioOf(rec.wordIds.length - unknown.length, rec.wordIds.length),
      });
    }
  }
  const knownTotal = allWordIds.filter((w) => isKnown(ctx.mastery, w)).length;
  return { sentences, overallRatio: ratioOf(knownTotal, allWordIds.length) };
};

const planPreTeach = (ctx: ReadingContext, sentences: readonly ReadingSentence[]): PreTeachItem[] => {
  const seen = new Set<string>();
  const items: PreTeachItem[] = [];
  for (const s of sentences) {
    for (const wordId of s.unknownWordIds) {
      if (seen.has(wordId)) continue;
      seen.add(wordId);
      const word = ctx.words.get(wordId);
      if (!word) continue; // never fabricate a word record
      items.push({
        wordId: word.id,
        spelling: word.spelling,
        graphemeSegments: word.graphemeSegments ?? [],
        definition: word.definition ?? null,
        audioAssetId: word.audioAssetId ?? null,
        illustrationAssetId: word.illustrationAssetId ?? null,
      });
    }
  }
  return items;
};

/**
 * Build a controlled reading plan, or return an inadmissible plan (admissible:
 * false) when the known-word ratio is below the floor. Callers must fall back
 * to a curated, fully-decodable reader when admissible is false — never present
 * an over-hard story to the child.
 */
export const buildReadingPlan = (ctx: ReadingContext): ReadingPlan => {
  const floor = ctx.knownWordFloor ?? DEFAULT_KNOWN_WORD_FLOOR;
  const { sentences, overallRatio } = planSentences(ctx);
  const preTeach = planPreTeach(ctx, sentences);
  const pages: ReadingPage[] = ctx.story.pages.map((p) => ({
    pageNumber: p.pageNumber,
    sentenceIds: p.sentenceIds,
    illustrationAssetId: p.illustrationAssetId ?? null,
  }));
  const questions: ReadingQuestion[] = (ctx.story.questions ?? []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    type: q.type,
    acceptableAnswers: q.acceptableAnswers,
  }));
  return {
    storyId: ctx.story.id,
    title: ctx.story.title,
    knownWordRatio: overallRatio,
    pages,
    sentences,
    preTeach,
    questions,
    narrationAudioRef: ctx.story.narrationAudioRef ?? null,
    admissible: overallRatio >= floor,
  };
};

/**
 * Evidence builders — keep reading (decode/word-support) and comprehension as
 * distinct tracks. Comprehension is recorded separately from oral accuracy.
 */
export interface ReadingAttemptEvent {
  readonly dimension: "reading";
  readonly itemId: string;
  readonly result: "correct" | "incorrect" | "partial" | "skipped";
  readonly hintCount: number;
  readonly occurredAt: number;
  readonly modality: "visual" | "audio" | "tile";
  /** Distinguishes decode/word-support from comprehension. */
  readonly evidenceTrack: "decode" | "comprehension";
  /** For comprehension events: the question id and the accepted answer. */
  readonly questionId?: string;
  readonly acceptedAnswer?: string;
}

export const makeReadingAttempt = (
  itemId: string,
  result: ReadingAttemptEvent["result"],
  opts: {
    hintCount?: number;
    occurredAt?: number;
    modality?: ReadingAttemptEvent["modality"];
  } = {},
): ReadingAttemptEvent => ({
  dimension: "reading",
  itemId,
  result,
  hintCount: opts.hintCount ?? 0,
  occurredAt: opts.occurredAt ?? 0,
  modality: opts.modality ?? "visual",
  evidenceTrack: "decode",
});

export const makeComprehensionAttempt = (
  storyId: string,
  questionId: string,
  result: ReadingAttemptEvent["result"],
  acceptedAnswer: string,
  opts: { hintCount?: number; occurredAt?: number } = {},
): ReadingAttemptEvent => ({
  dimension: "reading",
  itemId: storyId,
  result,
  hintCount: opts.hintCount ?? 0,
  occurredAt: opts.occurredAt ?? 0,
  modality: "visual",
  evidenceTrack: "comprehension",
  questionId,
  acceptedAnswer,
});
