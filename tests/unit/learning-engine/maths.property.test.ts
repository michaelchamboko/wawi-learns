import { describe, expect, it } from "vitest";
import {
  buildMathsActivity,
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
  ...overrides,
});

describe("SLC-007-T002/T003 — maths templates", () => {
  it("count-objects yields a Reception count question in [1,10]", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const plan = buildMathsActivity(baseTemplate({ generator: "count-objects" }), seed);
      const answer = Number(plan.item.answer);
      expect(Number.isInteger(answer)).toBe(true);
      expect(answer).toBeGreaterThanOrEqual(1);
      expect(answer).toBeLessThanOrEqual(10);
    }
  });

  it("subitise yields a Reception subitising question in [1,5]", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const plan = buildMathsActivity(
        baseTemplate({ generator: "subitise", strand: "number-to-10", representation: "concrete" }),
        seed,
      );
      const answer = Number(plan.item.answer);
      expect(answer).toBeGreaterThanOrEqual(1);
      expect(answer).toBeLessThanOrEqual(5);
    }
  });

  it("number-bonds yields a + ? = 10 with the correct complement", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const plan = buildMathsActivity(
        baseTemplate({ generator: "number-bonds", strand: "addition-subtraction", representation: "pictorial" }),
        seed,
      );
      const match = /^(\d+) \+ \? = 10$/.exec(plan.item.prompt);
      expect(match).not.toBeNull();
      const a = Number(match![1]);
      const b = Number(plan.item.answer);
      expect(a + b).toBe(10);
    }
  });

  it("tens-and-units yields a Year 1 place-value question", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const plan = buildMathsActivity(
        baseTemplate({
          generator: "tens-and-units",
          strand: "place-value",
          level: "year1",
          representation: "abstract",
        }),
        seed,
      );
      const match = /^(\d+) tens and (\d+) units$/.exec(plan.item.prompt);
      expect(match).not.toBeNull();
      const tens = Number(match![1]);
      const units = Number(match![2]);
      expect(tens * 10 + units).toBe(Number(plan.item.answer));
      expect(plan.item.answer.length).toBeGreaterThan(0);
    }
  });

  it("coin-combinations yields a Year 1 money question with no impossible coins", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const plan = buildMathsActivity(
        baseTemplate({
          generator: "coin-combinations",
          strand: "money",
          level: "year1",
          representation: "pictorial",
        }),
        seed,
      );
      const match = /^5p×(\d+) \+ 2p×(\d+) \+ 1p×(\d+)$/.exec(plan.item.prompt);
      expect(match).not.toBeNull();
      const f = Number(match![1]);
      const t = Number(match![2]);
      const o = Number(match![3]);
      expect(f).toBeLessThanOrEqual(2);
      expect(t).toBeLessThanOrEqual(2);
      expect(o).toBeLessThanOrEqual(4);
    }
  });
});