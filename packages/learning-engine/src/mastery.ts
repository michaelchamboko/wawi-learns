/**
 * Mastery projection (pure, deterministic, order-independent).
 * Mastery states: new → learning → practising → strong → mastered.
 * Regression to "relearning" is a projection-only decision driven by
 * a configurable threshold; AttemptEvents themselves are immutable.
 */

export const MASTERY_STATES = [
  "new",
  "learning",
  "practising",
  "strong",
  "mastered",
  "relearning",
] as const;

export type MasteryState = (typeof MASTERY_STATES)[number];

export type MasteryDimension =
  | "phonics"
  | "spelling"
  | "reading"
  | "maths"
  | "tracing"
  | "speech";

export interface MasteryEvent {
  readonly itemId: string;
  readonly dimension: MasteryDimension;
  readonly result: "correct" | "incorrect" | "partial" | "skipped";
  readonly hintCount: number;
  readonly occurredAt: number;
  readonly modality: "visual" | "audio" | "tracing" | "speech" | "tile";
}

export interface MasteryThresholds {
  /** Number of distinct correct results in a 24h window to reach "strong". */
  readonly strongMinCorrect: number;
  /** Number of distinct correct results across ≥2 modalities to reach "mastered". */
  readonly masteredMinCorrect: number;
  readonly masteredMinModalities: number;
  /** A regression is triggered if `incorrect` results outnumber `correct` in a recent window. */
  readonly regressionWindow: number;
}

export const DEFAULT_THRESHOLDS: MasteryThresholds = {
  strongMinCorrect: 4,
  masteredMinCorrect: 8,
  masteredMinModalities: 2,
  regressionWindow: 6,
};

export interface MasteryProjection {
  readonly itemId: string;
  readonly state: MasteryState;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly modalitiesUsed: readonly MasteryEvent["modality"][];
  readonly reason: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const distinct = <T>(values: readonly T[]): T[] => Array.from(new Set(values));

const windowEvents = (
  events: readonly MasteryEvent[],
  now: number,
  windowMs: number,
): MasteryEvent[] => events.filter((e) => Math.abs(now - e.occurredAt) <= windowMs);

export const weightAttempt = (event: MasteryEvent): number => {
  if (event.result === "skipped") return 0;
  if (event.hintCount >= 3) return 0; // full reveal does not advance mastery
  if (event.result === "correct") return event.hintCount === 0 ? 1 : 0.5;
  if (event.result === "partial") return 0.25;
  return -0.5;
};

export const projectMastery = (
  events: readonly MasteryEvent[],
  thresholds: MasteryThresholds = DEFAULT_THRESHOLDS,
  now: number = Date.now(),
): MasteryProjection[] => {
  const byItem = new Map<string, MasteryEvent[]>();
  for (const event of events) {
    const list = byItem.get(event.itemId) ?? [];
    list.push(event);
    byItem.set(event.itemId, list);
  }

  const projections: MasteryProjection[] = [];
  for (const [itemId, itemEvents] of byItem) {
    const sorted = [...itemEvents].sort((a, b) => a.occurredAt - b.occurredAt);
    const counts = (e: MasteryEvent) =>
      e.result === "correct" && e.hintCount < 3 ? 1 : 0;
    const correct = sorted.reduce((acc, e) => acc + counts(e), 0);
    const incorrect = sorted.filter((e) => e.result === "incorrect").length;
    const modalitiesUsed = distinct(
      sorted.filter((e) => e.result === "correct" && e.hintCount < 3).map((e) => e.modality),
    );

    const recent = windowEvents(sorted, now, ONE_DAY_MS);
    const recentCorrect = recent.filter(
      (e) => e.result === "correct" && e.hintCount < 3,
    ).length;
    const recentIncorrect = recent.filter((e) => e.result === "incorrect").length;

    let state: MasteryState = "new";
    let reason = "no-events";

    if (correct === 0 && incorrect > 0) {
      state = "learning";
      reason = "any-incorrect";
    } else if (
      recentIncorrect > recentCorrect &&
      recent.length >= thresholds.regressionWindow
    ) {
      state = "relearning";
      reason = "regression-window";
    } else if (
      correct >= thresholds.masteredMinCorrect &&
      modalitiesUsed.length >= thresholds.masteredMinModalities
    ) {
      state = "mastered";
      reason = "mastered-threshold";
    } else if (correct >= thresholds.strongMinCorrect && recentCorrect > 0) {
      state = "strong";
      reason = "strong-threshold";
    } else if (correct > 0) {
      state = "practising";
      reason = "some-correct";
    } else if (incorrect > 0) {
      state = "learning";
      reason = "errors-only";
    }

    projections.push({
      itemId,
      state,
      correctCount: correct,
      incorrectCount: incorrect,
      modalitiesUsed,
      reason,
    });
  }

  return projections.sort((a, b) => a.itemId.localeCompare(b.itemId));
};