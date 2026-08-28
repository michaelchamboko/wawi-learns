import { describe, expect, it } from "vitest";
import {
  buildMathsActivity,
  classifyMathsAttempt,
  type MathsLessonContext,
  type MathsTemplate,
} from "../../../packages/learning-engine/src/index";

const baseTemplate = (overrides: Partial<MathsTemplate> = {}): MathsTemplate => ({
  id: "tpl-1",
  strand: "number-to-10",
  level: "reception",
  representation: "concrete",
  generator: "count-objects",
  answerKey: "n",
  misconceptionTags: ["count-all"],
  hintSequence: ["Count each object once."],
  ...overrides,
});

const baseContext = (overrides: Partial<MathsLessonContext> = {}): MathsLessonContext => ({
  template: baseTemplate(),
  seed: 42,
  now: 1_700_000_000_000,
  recentRepresentations: [],
  ...overrides,
});

describe("SLC-007-T001 — maths engine", () => {
  it("builds a deterministic maths activity plan with delayed recall metadata", () => {
    const context = baseContext({ recentRepresentations: ["concrete", "concrete"] });
    const a = buildMathsActivity(context);
    const b = buildMathsActivity(context);
    expect(a).toEqual(b);
    expect(a.dimension).toBe("maths");
    expect(a.item.representation).toBe("concrete");
    expect(a.reviewDelayMs).toBeGreaterThan(24 * 60 * 60 * 1000);
    expect(a.supportStrategy).toContain("rotate-representation");
    expect(a.workedExample).toContain("Count");
  });

  it("throws on an unknown generator", () => {
    const context = baseContext({ template: baseTemplate({ generator: "missing-generator" }) });
    expect(() => buildMathsActivity(context)).toThrowError(/unknown-generator/);
  });

  it("classifies correct, incorrect, partial and skipped answers into maths evidence", () => {
    const template = baseTemplate();
    const evidence = classifyMathsAttempt(
      { itemId: "tpl-1-42", result: "correct", hintCount: 0, occurredAt: 0, answer: "7" },
      template,
    );
    expect(evidence.dimension).toBe("maths");
    expect(evidence.templateId).toBe("tpl-1");
    expect(evidence.result).toBe("correct");
    expect(evidence.masteryState).toMatch(/practising|strong/);
    expect(evidence.supportStrategy).toContain("count-with-objects");
    expect(evidence.englishIsolation).toBe(true);

    expect(
      classifyMathsAttempt(
        { itemId: "tpl-1-42", result: "incorrect", hintCount: 0, occurredAt: 0, answer: "5" },
        template,
      ).result,
    ).toBe("incorrect");
    expect(
      classifyMathsAttempt(
        { itemId: "tpl-1-42", result: "skipped", hintCount: 0, occurredAt: 0, answer: "" },
        template,
      ).result,
    ).toBe("skipped");
  });

  it("accepts a nearby numeric estimate without speed pressure", () => {
    const template = baseTemplate({
      generator: "estimate-100",
      strand: "number-to-100",
      level: "year1",
      representation: "concrete",
      misconceptionTags: ["over-under-estimate"],
    });
    const plan = buildMathsActivity({ ...baseContext({ template, seed: 9 }), recentRepresentations: ["concrete"] });
    const actual = Number(plan.item.answer) + 6;
    const evidence = classifyMathsAttempt(
      { itemId: plan.item.itemId, result: "partial", hintCount: 1, occurredAt: 0, answer: String(actual) },
      template,
    );
    expect(evidence.result).toBe("partial");
    expect(evidence.masteryState).toBe("learning");
    expect(evidence.delayMs).toBeGreaterThan(0);
  });
});
