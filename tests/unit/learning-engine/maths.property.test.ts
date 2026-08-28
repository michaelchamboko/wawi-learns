import { describe, expect, it } from "vitest";
import {
  buildMathsActivity,
  type MathsLessonContext,
  type MathsTemplate,
} from "../../../packages/learning-engine/src/index";

const baseTemplate = (overrides: Partial<MathsTemplate> = {}): MathsTemplate => ({
  id: "tpl",
  strand: "number-to-10",
  level: "reception",
  representation: "concrete",
  generator: "count-objects",
  answerKey: "n",
  misconceptionTags: ["count-all"],
  hintSequence: ["Count each object once."],
  ...overrides,
});

const context = (
  seed: number,
  template: MathsTemplate = baseTemplate(),
  recentRepresentations: MathsLessonContext["recentRepresentations"] = [],
): MathsLessonContext => ({
  template,
  seed,
  now: 1_700_000_000_000,
  recentRepresentations,
});

describe("SLC-007-T001/T002/T003 — maths templates", () => {
  it("same seed always produces the same item and prompt", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const a = buildMathsActivity(context(seed));
      const b = buildMathsActivity(context(seed));
      expect(a.item.itemId).toBe(b.item.itemId);
      expect(a.item.prompt).toBe(b.item.prompt);
      expect(a.item.answer).toBe(b.item.answer);
      expect(a.reviewDelayMs).toBe(b.reviewDelayMs);
    }
  });

  it("recent repeated representations trigger a longer delay for delayed recall", () => {
    const a = buildMathsActivity(context(7, baseTemplate({ representation: "concrete" }), ["concrete", "concrete"]));
    const b = buildMathsActivity(context(7, baseTemplate({ representation: "concrete" }), ["concrete"]));
    expect(a.reviewDelayMs).toBeGreaterThan(b.reviewDelayMs);
    expect(a.supportStrategy).toContain("rotate-representation");
    expect(b.supportStrategy).not.toContain("rotate-representation");
  });

  it("support strategies are derived from misconception tags", () => {
    const plan = buildMathsActivity(
      context(
        11,
        baseTemplate({
          generator: "one-less",
          strand: "number-to-10",
          representation: "concrete",
          misconceptionTags: ["count-back-error"],
        }),
      ),
    );
    expect(plan.supportStrategy).toContain("count-backwards");
    expect(plan.workedExample.length).toBeGreaterThan(0);
  });
});
