import { describe, expect, it } from "vitest";
import {
  buildReviewQueue,
  candidatesFromProjections,
  selectNextActivity,
  type ActivityCandidate,
} from "../../../packages/learning-engine/src/index";

const candidates = (
  overrides: Partial<ActivityCandidate>[],
): ActivityCandidate[] =>
  overrides.map((o, idx) => ({
    itemId: o.itemId ?? `item-${idx}`,
    dimension: o.dimension ?? "phonics",
    modality: o.modality ?? "picture-word",
    state: o.state ?? "new",
    isWeak: o.isWeak ?? false,
    isNew: o.isNew ?? true,
  }));

describe("SLC-004-T002 — lesson scheduler", () => {
  it("buildReviewQueue returns only weak candidates up to the ceiling", () => {
    const pool = candidates([
      { itemId: "w-1", isWeak: true, isNew: false },
      { itemId: "w-2", isWeak: true, isNew: false },
      { itemId: "i-1", isWeak: false, isNew: true },
      { itemId: "i-2", isWeak: false, isNew: true },
      { itemId: "s-1", state: "strong", isWeak: false, isNew: false },
    ]);
    const queue = buildReviewQueue(pool, 10);
    expect(queue.map((q) => q.itemId)).toEqual(["w-1", "w-2"]);
  });

  it("selectNextActivity returns home plan when no candidates exist", () => {
    const plan = selectNextActivity({
      context: {
        childProfileId: "c-1",
        yearGroup: "reception",
        targetDailyMinutes: 20,
        backlogByDimension: {},
        recentModalityByDimension: {},
        dailyCompletedByDimension: {},
      },
      candidates: [],
      rng: () => 0.5,
    });
    expect(plan.itemId).toBe("home-plan");
    expect(plan.reason).toBe("queue-empty");
  });

  it("drops new content when backlog exceeds the ceiling", () => {
    const plan = selectNextActivity({
      context: {
        childProfileId: "c-1",
        yearGroup: "reception",
        targetDailyMinutes: 20,
        backlogByDimension: { phonics: 12 },
        recentModalityByDimension: {},
        dailyCompletedByDimension: {},
      },
      candidates: candidates([
        { itemId: "w-1", isWeak: true, isNew: false },
        { itemId: "i-1", isWeak: false, isNew: true },
      ]),
      rng: () => 0.5,
    });
    expect(plan.reason).toBe("backlog-exceeded");
    expect(plan.audit.isWeak).toBe(true);
  });

  it("rotates modality when the same one was used twice in a row", () => {
    const plan = selectNextActivity({
      context: {
        childProfileId: "c-1",
        yearGroup: "reception",
        targetDailyMinutes: 20,
        backlogByDimension: {},
        recentModalityByDimension: { phonics: ["picture-word"] },
        dailyCompletedByDimension: {},
      },
      candidates: candidates([
        { itemId: "w-1", isWeak: true, modality: "picture-word" },
      ]),
      rng: () => 0,
    });
    expect(plan.modality).toBe("tile");
  });

  it("candidatesFromProjections preserves weak/new flags", () => {
    const result = candidatesFromProjections([
      { itemId: "w-1", state: "learning", correctCount: 0, incorrectCount: 2, modalitiesUsed: [], reason: "" },
      { itemId: "i-1", state: "new", correctCount: 0, incorrectCount: 0, modalitiesUsed: [], reason: "" },
    ]);
    expect(result.find((c) => c.itemId === "w-1")?.isWeak).toBe(true);
    expect(result.find((c) => c.itemId === "i-1")?.isNew).toBe(true);
  });
});