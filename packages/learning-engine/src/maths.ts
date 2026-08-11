/**
 * Maths engine (SLC-007-T001).
 * Deterministic, seeded by a per-session seed so client and server replay
 * the same plan. Returns typed activity plans and classification results.
 */

export type Representation = "concrete" | "pictorial" | "abstract";
export type Strand =
  | "number-to-10"
  | "number-to-20"
  | "number-to-100"
  | "place-value"
  | "addition-subtraction"
  | "multiplication-division"
  | "fractions"
  | "measure"
  | "time"
  | "money"
  | "shape-position"
  | "pattern";

export interface MathsTemplate {
  readonly id: string;
  readonly strand: Strand;
  readonly level: "reception" | "year1";
  readonly representation: Representation;
  readonly generator: string;
  readonly answerKey: string;
  readonly misconceptionTags: readonly string[];
}

export interface MathsItem {
  readonly itemId: string;
  readonly templateId: string;
  readonly strand: Strand;
  readonly representation: Representation;
  readonly prompt: string;
  readonly answer: string;
  readonly allowedAnswers: readonly string[];
  readonly misconceptionTags: readonly string[];
}

export type MathsResult = "correct" | "incorrect" | "partial" | "skipped";

export interface MathsAttempt {
  readonly itemId: string;
  readonly result: MathsResult;
  readonly hintCount: number;
  readonly occurredAt: number;
  readonly answer: string;
}

export interface MathsActivityPlan {
  readonly item: MathsItem;
  readonly representation: Representation;
  readonly hint: string;
}

const mulberry32 = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const COUNT_OBJECTS = (
  rng: () => number,
): { prompt: string; answer: string } => {
  const n = Math.floor(rng() * 10) + 1;
  return { prompt: `How many objects? ${"•".repeat(n)}`, answer: String(n) };
};

const SUBITISE = (rng: () => number) => {
  const n = Math.floor(rng() * 5) + 1;
  return { prompt: `How many dots? ${"•".repeat(n)}`, answer: String(n) };
};

const NUMBER_BONDS = (rng: () => number) => {
  const a = Math.floor(rng() * 10) + 1;
  const b = 10 - a;
  return { prompt: `${a} + ? = 10`, answer: String(b) };
};

const TENS_AND_UNITS = (rng: () => number) => {
  const tens = Math.floor(rng() * 9) + 1;
  const units = Math.floor(rng() * 10);
  const value = tens * 10 + units;
  return { prompt: `${tens} tens and ${units} units`, answer: String(value) };
};

const COIN_COMBINATIONS = (rng: () => number) => {
  const fives = Math.floor(rng() * 3);
  const twos = Math.floor(rng() * 3);
  const ones = Math.floor(rng() * 5);
  const total = fives * 5 + twos * 2 + ones;
  return { prompt: `5p×${fives} + 2p×${twos} + 1p×${ones}`, answer: `${total}p` };
};

const GENERATORS: Record<string, (rng: () => number) => { prompt: string; answer: string }> = {
  "count-objects": COUNT_OBJECTS,
  "subitise": SUBITISE,
  "number-bonds": NUMBER_BONDS,
  "tens-and-units": TENS_AND_UNITS,
  "coin-combinations": COIN_COMBINATIONS,
};

export const buildMathsActivity = (
  template: MathsTemplate,
  seed: number,
): MathsActivityPlan => {
  const generator = GENERATORS[template.generator];
  if (!generator) {
    throw new Error(`unknown-generator:${template.generator}`);
  }
  const { prompt, answer } = generator(mulberry32(seed));
  const item: MathsItem = {
    itemId: `${template.id}-${seed}`,
    templateId: template.id,
    strand: template.strand,
    representation: template.representation,
    prompt,
    answer,
    allowedAnswers: [answer],
    misconceptionTags: template.misconceptionTags,
  };
  return {
    item,
    representation: template.representation,
    hint: `Try ${template.representation} first`,
  };
};

export const classifyMathsAttempt = (
  attempt: MathsAttempt,
  item: MathsItem,
): MathsResult => {
  if (attempt.hintCount >= 3) return "incorrect";
  if (attempt.answer === "") return "skipped";
  if (item.allowedAnswers.includes(attempt.answer)) return "correct";
  return "incorrect";
};

export const mathsDimensionMatches = (
  result: MathsResult,
  misconception: string,
): boolean =>
  result === "incorrect" && misconception === "count-all";

export const DETERMINISTIC_SEED_BASE = 1_700_000_000;