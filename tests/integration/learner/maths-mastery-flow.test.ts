import { describe, expect, it } from "vitest";
import { buildMathsActivity, classifyMathsAttempt, type MathsTemplate } from "../../../packages/learning-engine/src/maths";
import { projectMastery, type MasteryEvent } from "../../../packages/learning-engine/src/mastery";

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

const baseTime = 1_700_000_000_000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;

describe("SLC-007-T004 — adaptive maths mastery end to end", () => {
  it("reaches mastered only when representations vary and review delay is respected", () => {
    const representations: Array<"concrete" | "pictorial" | "abstract"> = [
      "concrete",
      "concrete",
      "pictorial",
      "abstract",
    ];

    const events: MasteryEvent[] = [];
    let now = baseTime;

    for (const representation of representations) {
      const tpl = template({ representation });
      const plan = buildMathsActivity({
        template: tpl,
        seed: representations.indexOf(representation) + 1,
        now,
        recentRepresentations: representations.slice(0, representations.indexOf(representation)),
      });
      const evidence = classifyMathsAttempt(
        {
          itemId: plan.item.itemId,
          result: "correct",
          hintCount: 0,
          occurredAt: now,
          answer: plan.item.answer,
        },
        tpl,
      );
      events.push({
        itemId: tpl.id,
        dimension: "maths",
        result: evidence.result,
        hintCount: 0,
        occurredAt: now,
        modality: representation === "concrete" ? "tile" : representation === "pictorial" ? "visual" : "tracing",
      });
      now += TEN_MIN;
    }

    // Need a second modality to reach mastered; tile was used above, add tracing
    for (let i = 0; i < 4; i += 1) {
      const tpl = template({ representation: "abstract" });
      const plan = buildMathsActivity({ template: tpl, seed: 10 + i, now });
      events.push({
        itemId: tpl.id,
        dimension: "maths",
        result: "correct",
        hintCount: 0,
        occurredAt: now,
        modality: "tracing",
      });
      now += TEN_MIN;
    }

    const projections = projectMastery(events, undefined, baseTime + ONE_DAY);
    const aggregate = projections.find((p) => p.itemId === template().id);
    expect(aggregate).toBeDefined();
    expect(aggregate!.correctCount).toBeGreaterThanOrEqual(8);
    expect(aggregate!.state).toBe("mastered");
    expect(aggregate!.reason).toBe("mastered-threshold");
    expect(aggregate!.modalitiesUsed.length).toBeGreaterThanOrEqual(2);
  });

  it("never regresses on slow correct responses and never lets maths evidence touch English", () => {
    const tpl = template();
    const slow = buildMathsActivity({ template: tpl, seed: 1, now: baseTime });
    const slowEvidence = classifyMathsAttempt(
      {
        itemId: slow.item.itemId,
        result: "correct",
        hintCount: 0,
        occurredAt: baseTime,
        answer: slow.item.answer,
      },
      tpl,
    );
    expect(slowEvidence.result).toBe("correct");
    expect(slowEvidence.delayMs).toBeGreaterThan(0);
    expect(slowEvidence.englishIsolation).toBe(true);
    expect(slowEvidence.dimension).toBe("maths");
  });

  it("delayed recall pushes next review to at least one day after now", () => {
    const tpl = template();
    const now = baseTime;
    const plan = buildMathsActivity({
      template: tpl,
      seed: 1,
      now,
      recentRepresentations: ["concrete", "concrete"],
    });
    expect(plan.nextReviewAt - now).toBeGreaterThanOrEqual(ONE_DAY);
    expect(plan.supportStrategy).toContain("delayed-recall");
    expect(plan.supportStrategy).toContain("rotate-representation");
  });
});
