import { describe, expect, it, vi } from "vitest";
import {
  buildMathsActivity,
  classifyMathsAttempt,
  startSession,
  commitActivityAttemptThenAdvance,
  type MathsTemplate,
} from "../../../packages/learning-engine/src/index";
import type { AttemptEvent } from "../../../packages/local-data/src";

const template = (overrides: Partial<MathsTemplate> = {}): MathsTemplate => ({
  id: "mt-count-objects",
  strand: "number-to-10",
  level: "reception",
  representation: "concrete",
  generator: "count-objects",
  answerKey: "n",
  misconceptionTags: ["count-all"],
  hintSequence: ["Count each object once."],
  ...overrides,
});

describe("SLC-007-T001 — maths projection", () => {
  it("builds maths evidence that survives session projection and keeps English isolated", async () => {
    const mathsTemplate = template();
    const plan = buildMathsActivity({
      template: mathsTemplate,
      seed: 18,
      now: 1_700_000_000_000,
      recentRepresentations: ["concrete"],
    });

    const evidence = classifyMathsAttempt(
      { itemId: plan.item.itemId, result: "correct", hintCount: 0, occurredAt: 1_700_000_000_000, answer: plan.item.answer },
      mathsTemplate,
    );
    expect(evidence.dimension).toBe("maths");
    expect(evidence.englishIsolation).toBe(true);
    expect(evidence.supportStrategy).toContain("count-with-objects");

    const events: AttemptEvent[] = [];
    const deps = {
      appendAttempt: vi.fn(async (event: AttemptEvent) => {
        events.push(event);
        return { sourceSequence: events.length };
      }),
      now: () => 1_700_000_000_999,
    };
    const session = startSession("child-1", "web-1", "0.1.0", {
      itemId: plan.item.itemId,
      dimension: plan.dimension,
      modality: "visual",
    });

    const outcome = await commitActivityAttemptThenAdvance(
      session,
      { itemId: plan.item.itemId, dimension: plan.dimension, kind: "maths" },
      {
        eventId: "ev-maths",
        result: evidence.result,
        hintCount: 0,
        durationMs: 900,
        occurredAt: 1_700_000_000_000,
      },
      deps,
    );

    expect(outcome.advance).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ dimension: "maths", itemId: plan.item.itemId, result: "correct" });
    expect(outcome.nextState.attemptsCommitted).toBe(1);
    expect(outcome.nextState.lastError).toBeNull();
  });
});
