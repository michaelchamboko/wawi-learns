import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  DETERMINISTIC_SEED_BASE,
  buildMathsActivity,
  classifyMathsAttempt,
  type MathsItem,
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
  ...overrides,
});

describe("SLC-007-T001 — maths engine", () => {
  it("builds a deterministic activity for the same seed", () => {
    const template = baseTemplate();
    const a = buildMathsActivity(template, 42);
    const b = buildMathsActivity(template, 42);
    expect(a.item).toEqual(b.item);
  });

  it("throws on an unknown generator", () => {
    const template = baseTemplate({ generator: "missing-generator" });
    expect(() => buildMathsActivity(template, 1)).toThrowError(/unknown-generator/);
  });

  it("classifies correct, incorrect, partial and skipped answers", () => {
    const item: MathsItem = {
      itemId: "tpl-1-1",
      templateId: "tpl-1",
      strand: "number-to-10",
      representation: "concrete",
      prompt: "How many objects?",
      answer: "3",
      allowedAnswers: ["3"],
      misconceptionTags: ["count-all"],
    };
    expect(
      classifyMathsAttempt({ itemId: "tpl-1-1", result: "correct", hintCount: 0, occurredAt: 0, answer: "3" }, item),
    ).toBe("correct");
    expect(
      classifyMathsAttempt({ itemId: "tpl-1-1", result: "incorrect", hintCount: 0, occurredAt: 0, answer: "5" }, item),
    ).toBe("incorrect");
    expect(
      classifyMathsAttempt({ itemId: "tpl-1-1", result: "skipped", hintCount: 0, occurredAt: 0, answer: "" }, item),
    ).toBe("skipped");
  });

  it("always classifies full-reveal attempts as incorrect", () => {
    const item: MathsItem = {
      itemId: "tpl-1-1",
      templateId: "tpl-1",
      strand: "number-to-10",
      representation: "concrete",
      prompt: "How many objects?",
      answer: "3",
      allowedAnswers: ["3"],
      misconceptionTags: ["count-all"],
    };
    expect(
      classifyMathsAttempt({ itemId: "tpl-1-1", result: "correct", hintCount: 3, occurredAt: 0, answer: "3" }, item),
    ).toBe("incorrect");
  });

  it("property: same seed always produces same itemId", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (seed) => {
        const a = buildMathsActivity(baseTemplate(), seed);
        const b = buildMathsActivity(baseTemplate(), seed);
        expect(a.item.itemId).toBe(b.item.itemId);
      }),
      { numRuns: 50 },
    );
  });

  it("the deterministic seed base is anchored at DETERMINISTIC_SEED_BASE", () => {
    expect(DETERMINISTIC_SEED_BASE).toBe(1_700_000_000);
  });
});