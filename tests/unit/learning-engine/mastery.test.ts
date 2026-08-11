import { describe, expect, it } from "vitest";
import {
  DEFAULT_THRESHOLDS,
  projectMastery,
  weightAttempt,
  type MasteryEvent,
} from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;

const ev = (overrides: Partial<MasteryEvent> & Pick<MasteryEvent, "itemId" | "dimension">): MasteryEvent => ({
  result: "correct",
  hintCount: 0,
  occurredAt: NOW,
  modality: "visual",
  ...overrides,
});

describe("SLC-004-T001 — mastery projection", () => {
  it("returns 'new' for items with no events", () => {
    const projection = projectMastery([], DEFAULT_THRESHOLDS, NOW);
    expect(projection).toEqual([]);
  });

  it("transitions new → practising on the first correct result", () => {
    const events: MasteryEvent[] = [ev({ itemId: "w-cat", dimension: "phonics" })];
    const projection = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
    expect(projection[0]?.state).toBe("practising");
  });

  it("reaches 'strong' after the strongMinCorrect threshold inside a 24h window", () => {
    const events: MasteryEvent[] = Array.from({ length: 5 }, (_, i) =>
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: NOW - i * 1000 }),
    );
    const projection = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
    expect(projection[0]?.state).toBe("strong");
  });

  it("reaches 'mastered' only with cross-modality evidence", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-cat", dimension: "phonics", modality: "visual" }),
      ev({ itemId: "w-cat", dimension: "phonics", modality: "visual" }),
      ev({ itemId: "w-cat", dimension: "phonics", modality: "audio" }),
      ev({ itemId: "w-cat", dimension: "phonics", modality: "tile" }),
      ev({ itemId: "w-cat", dimension: "phonics", modality: "speech" }),
      ev({ itemId: "w-cat", dimension: "phonics", modality: "tracing" }),
      ev({ itemId: "w-cat", dimension: "phonics", modality: "visual" }),
      ev({ itemId: "w-cat", dimension: "phonics", modality: "audio" }),
    ];
    const projection = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
    expect(projection[0]?.state).toBe("mastered");
  });

  it("full-reveal (3+ hints) does not advance mastery", () => {
    const events: MasteryEvent[] = Array.from({ length: 5 }, () =>
      ev({ itemId: "w-cat", dimension: "phonics", hintCount: 3, result: "correct" }),
    );
    const projection = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
    expect(projection[0]?.state).toBe("new");
  });

  it("regresses when incorrect outnumbers correct in a recent window", () => {
    const baseEvents: MasteryEvent[] = Array.from({ length: 8 }, (_, i) =>
      ev({
        itemId: "w-cat",
        dimension: "phonics",
        occurredAt: NOW - 1000 * 60 * 60 * 24 * 3 + i * 1000, // 3 days ago
      }),
    );
    const recentEvents: MasteryEvent[] = [
      ev({ itemId: "w-cat", dimension: "phonics", result: "incorrect", occurredAt: NOW - 1000 }),
      ev({ itemId: "w-cat", dimension: "phonics", result: "incorrect", occurredAt: NOW - 2000 }),
      ev({ itemId: "w-cat", dimension: "phonics", result: "incorrect", occurredAt: NOW - 3000 }),
      ev({ itemId: "w-cat", dimension: "phonics", result: "incorrect", occurredAt: NOW - 4000 }),
      ev({ itemId: "w-cat", dimension: "phonics", result: "incorrect", occurredAt: NOW - 5000 }),
      ev({ itemId: "w-cat", dimension: "phonics", result: "correct", occurredAt: NOW - 6000 }),
    ];
    const projection = projectMastery([...baseEvents, ...recentEvents], DEFAULT_THRESHOLDS, NOW);
    expect(projection[0]?.state).toBe("relearning");
  });

  it("projection is order-independent (same event set yields the same projection)", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: NOW - 5000, modality: "visual" }),
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: NOW - 1000, modality: "audio" }),
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: NOW - 2000, modality: "tile" }),
    ];
    const reversed = [...events].reverse();
    const a = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
    const b = projectMastery(reversed, DEFAULT_THRESHOLDS, NOW);
    expect(a[0]?.state).toBe(b[0]?.state);
    expect(a[0]?.correctCount).toBe(b[0]?.correctCount);
  });

  it("weightAttempt returns 0 for full reveal and skipped", () => {
    expect(weightAttempt(ev({ itemId: "x", dimension: "phonics", hintCount: 3, result: "correct" }))).toBe(0);
    expect(weightAttempt(ev({ itemId: "x", dimension: "phonics", result: "skipped" }))).toBe(0);
  });

  it("weightAttempt ranks clean correct above hinted correct above partial above incorrect", () => {
    expect(weightAttempt(ev({ itemId: "x", dimension: "phonics" }))).toBe(1);
    expect(weightAttempt(ev({ itemId: "x", dimension: "phonics", hintCount: 1 }))).toBe(0.5);
    expect(weightAttempt(ev({ itemId: "x", dimension: "phonics", result: "partial" }))).toBe(0.25);
    expect(weightAttempt(ev({ itemId: "x", dimension: "phonics", result: "incorrect" }))).toBe(-0.5);
  });
});