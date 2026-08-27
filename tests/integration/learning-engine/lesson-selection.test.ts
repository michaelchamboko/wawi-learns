import { describe, expect, it } from "vitest";
import {
  projectMastery,
  candidatesFromProjections,
  selectNextActivity,
  buildReviewQueue,
  DEFAULT_THRESHOLDS,
  type MasteryEvent,
  type LessonContext,
} from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;

const ev = (
  overrides: Partial<MasteryEvent> & Pick<MasteryEvent, "itemId" | "dimension">,
): MasteryEvent => ({
  result: "correct",
  hintCount: 0,
  occurredAt: NOW,
  modality: "visual",
  ...overrides,
});

const baseContext = (over: Partial<LessonContext> = {}): LessonContext => ({
  childProfileId: "c-1",
  yearGroup: "reception",
  targetDailyMinutes: 20,
  backlogByDimension: {},
  recentModalityByDimension: {},
  dailyCompletedByDimension: {},
  ...over,
});

// Build a candidate pool from a set of mastery events using the real pipeline.
const poolFrom = (events: MasteryEvent[]) =>
  candidatesFromProjections(projectMastery(events, DEFAULT_THRESHOLDS, NOW));

describe("SLC-004-T002 — lesson selection (pack-to-plan integration)", () => {
  it("selects a weak item for recovery before introducing new content", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-weak", dimension: "phonics", result: "incorrect" }),
      ev({ itemId: "i-new", dimension: "phonics", modality: "audio" }),
    ];
    const candidates = poolFrom(events);
    const plan = selectNextActivity({
      context: baseContext(),
      candidates,
      rng: () => 0.5,
    });
    expect(plan.audit.isWeak).toBe(true);
    expect(plan.reason).toBe("weak-recovery");
  });

  it("keeps a deterministic, seeded failure-free selection for a fixed RNG", () => {
    const events: MasteryEvent[] = Array.from({ length: 6 }, (_, i) =>
      ev({ itemId: `i-${i}`, dimension: "phonics", modality: i % 2 ? "audio" : "visual" }),
    ).concat([
      ev({ itemId: "w-weak", dimension: "phonics", result: "incorrect", occurredAt: NOW + 1 }),
    ]);
    const candidates = poolFrom(events);
    const first = selectNextActivity({ context: baseContext(), candidates, rng: () => 0.3 });
    const second = selectNextActivity({ context: baseContext(), candidates, rng: () => 0.3 });
    expect(second).toEqual(first);
  });

  it("buildReviewQueue only ever contains weak items, never new or mastered", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-1", dimension: "phonics", result: "incorrect" }),
      ev({ itemId: "w-2", dimension: "phonics", result: "incorrect", occurredAt: NOW + 1 }),
      ev({ itemId: "i-1", dimension: "phonics", modality: "audio" }),
      ev({ itemId: "m-1", dimension: "phonics", modality: "tile", occurredAt: NOW - 100000 }),
      ev({ itemId: "m-1", dimension: "phonics", modality: "speech", occurredAt: NOW - 90000 }),
    ];
    const candidates = poolFrom(events);
    const queue = buildReviewQueue(candidates, 10);
    expect(queue.every((c) => c.isWeak)).toBe(true);
    expect(queue.every((c) => c.itemId.startsWith("w-"))).toBe(true);
  });

  it("returns a safe home plan when no eligible activity exists", () => {
    const plan = selectNextActivity({
      context: baseContext(),
      candidates: [],
      rng: () => 0.5,
    });
    expect(plan.itemId).toBe("home-plan");
    expect(["queue-empty", "no-candidates-home"]).toContain(plan.reason);
  });

  it("drops new content and revisits weak items when backlog exceeds the ceiling", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-1", dimension: "phonics", result: "incorrect" }),
      ev({ itemId: "i-1", dimension: "phonics", modality: "audio" }),
    ];
    const candidates = poolFrom(events);
    const plan = selectNextActivity({
      context: baseContext({ backlogByDimension: { phonics: 11 } }),
      candidates,
      rng: () => 0.5,
      backlogCeiling: 10,
    });
    expect(plan.reason).toBe("backlog-exceeded");
    expect(plan.audit.isWeak).toBe(true);
  });
});
