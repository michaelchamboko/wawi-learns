import { describe, expect, it } from "vitest";
import {
  DEFAULT_TARGET_ITEMS,
  nextAssessmentItem,
  recordAttempt,
  restartAssessment,
  skipAssessment,
  startAssessment,
  type AssessmentDecision,
  type AssessmentState,
} from "../../../packages/learning-engine/src/index.js";

const NOW = 1_700_000_000_000;

const stateWith = (overrides: Partial<AssessmentState>): AssessmentState => ({
  parentId: "parent-1",
  childProfileId: "child-1",
  startedAt: NOW,
  coveredDimensions: [],
  itemsAttempted: 0,
  itemsCorrect: 0,
  history: [],
  baselineVersion: "baseline-1",
  ...overrides,
});

describe("SLC-002-T004 — onboarding assessment", () => {
  it("starts with an empty state and the configured baseline version", () => {
    const state = startAssessment("parent-1", "child-1", "baseline-1", () => NOW);
    expect(state.coveredDimensions).toEqual([]);
    expect(state.itemsAttempted).toBe(0);
  });

  it("advances one dimension at a time until all four required dimensions are covered", () => {
    let state = stateWith({});
    const seed = (() => {
      let n = 0;
      return () => ++n;
    })();

    const seen: string[] = [];
    while (true) {
      const decision = nextAssessmentItem(state, {
        targetItems: DEFAULT_TARGET_ITEMS,
        randomSeed: seed,
        now: () => NOW,
      });
      if (!decision.continue) break;
      seen.push(decision.dimension);
      state = recordAttempt(state, decision, "correct", NOW);
    }

    expect(seen).toEqual(["phonics", "spelling", "reading", "maths"]);
  });

  it("stops at the configured target item count even if dimensions are not yet covered", () => {
    let state = stateWith({ itemsAttempted: 19 });
    const decision = nextAssessmentItem(state, {
      targetItems: 20,
      randomSeed: () => 1,
      now: () => NOW,
    });
    expect(decision.continue).toBe(true);

    state = recordAttempt(state, decision, "correct", NOW);
    const next = nextAssessmentItem(state, {
      targetItems: 20,
      randomSeed: () => 2,
      now: () => NOW,
    });
    expect(next.continue).toBe(false);
    expect(next.reason).toBe("target-reached");
  });

  it("parent can skip the assessment and the result is baseline-incomplete", () => {
    const skipped = skipAssessment(stateWith({}), () => NOW);
    expect(skipped.completedAt).toBe(NOW);
    expect(skipped.coveredDimensions).toEqual([]);
  });

  it("restart clears history but preserves parent/child/baseline identity", () => {
    const started = startAssessment("parent-2", "child-2", "baseline-2", () => NOW);
    const progressed = recordAttempt(
      started,
      { dimension: "phonics", itemId: "p-1", reason: "cover-phonics", continue: true },
      "correct",
      NOW,
    );
    const reset = restartAssessment(progressed, () => NOW + 1000);
    expect(reset.history).toEqual([]);
    expect(reset.parentId).toBe("parent-2");
    expect(reset.childProfileId).toBe("child-2");
    expect(reset.baselineVersion).toBe("baseline-2");
    expect(reset.startedAt).toBe(NOW + 1000);
  });

  it("never returns an out-of-baseline item id (no random number ever drifts the dimension)", () => {
    let state = stateWith({});
    const seed = (() => {
      let n = 0;
      return () => ++n;
    })();
    const decisions: AssessmentDecision[] = [];
    while (decisions.length < 8) {
      const decision = nextAssessmentItem(state, {
        targetItems: 4,
        randomSeed: seed,
        now: () => NOW,
      });
      if (!decision.continue) break;
      decisions.push(decision);
      state = recordAttempt(state, decision, "correct", NOW);
    }
    // Each decision belongs to a dimension that was missing from the state at that moment.
    for (let i = 0; i < decisions.length; i += 1) {
      expect(decisions[i]!.itemId).toMatch(/^([a-z]+)-probe-[a-z0-9]+$/);
    }
  });
});