/**
 * Maths engine (SLC-007-T001).
 * Deterministic maths lesson planning and evidence classification.
 *
 * The engine keeps maths isolated from English strands: every plan and
 * evidence record is explicitly tagged as maths and only uses the maths
 * template inventory.
 */
import type { MasteryState } from "./mastery";

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
  readonly hintSequence?: readonly string[];
  readonly source?: string;
  readonly difficulty?: { readonly min: number; readonly max: number };
}

export interface MathsItem {
  readonly itemId: string;
  readonly templateId: string;
  readonly strand: Strand;
  readonly representation: Representation;
  readonly dimension: "maths";
  readonly prompt: string;
  readonly answer: string;
  readonly allowedAnswers: readonly string[];
  readonly misconceptionTags: readonly string[];
  readonly workedExample: string;
  readonly supportStrategy: readonly string[];
  readonly reviewDelayMs: number;
  readonly nextReviewAt: number;
  readonly answerMode: "exact" | "numeric";
  readonly tolerance?: number;
}

export interface MathsLessonContext {
  readonly template: MathsTemplate;
  readonly seed: number;
  readonly now?: number;
  readonly recentRepresentations?: readonly Representation[];
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
  readonly dimension: "maths";
  readonly item: MathsItem;
  readonly representation: Representation;
  readonly workedExample: string;
  readonly supportStrategy: readonly string[];
  readonly reviewDelayMs: number;
  readonly nextReviewAt: number;
}

export interface MathsEvidence {
  readonly dimension: "maths";
  readonly templateId: string;
  readonly itemId: string;
  readonly strand: Strand;
  readonly representation: Representation;
  readonly prompt: string;
  readonly answer: string;
  readonly result: MathsResult;
  readonly misconceptionTags: readonly string[];
  readonly supportStrategy: readonly string[];
  readonly masteryState: MasteryState;
  readonly delayMs: number;
  readonly englishIsolation: true;
}

type GeneratedMathsTask = {
  readonly prompt: string;
  readonly answer: string;
  readonly allowedAnswers: readonly string[];
  readonly answerMode: "exact" | "numeric";
  readonly tolerance?: number;
  readonly workedExample: string;
  readonly supportStrategy: readonly string[];
  readonly reviewDelayMs: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TWO_DAY_MS = 2 * DAY_MS;
const THREE_DAY_MS = 3 * DAY_MS;

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

const randInt = (rng: () => number, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

const normalize = (value: string): string => value.trim().replace(/\s+/g, " ").toLowerCase();

const unique = (values: readonly string[]): string[] => Array.from(new Set(values));

const DOTS = (count: number): string => "•".repeat(count);

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const SHAPES_2D = ["circle", "square", "triangle", "rectangle", "pentagon", "hexagon"] as const;
const SHAPES_3D = ["cube", "cuboid", "sphere", "cylinder", "cone"] as const;
const COINS = ["1p", "2p", "5p", "10p"] as const;
const POSITION_WORDS = ["left", "right", "above", "below"] as const;
const COLOUR_WORDS = ["red", "blue", "green", "yellow", "orange", "purple"] as const;

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
] as const;

const TEENS = [
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

const numberToWords = (value: number): string => {
  if (value < 0 || value > 100 || !Number.isInteger(value)) {
    throw new Error(`unsupported-number:${value}`);
  }
  if (value < 10) return ONES[value]!;
  if (value < 20) return TEENS[value - 10]!;
  if (value === 100) return "one hundred";
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return ones === 0 ? TENS[tens]! : `${TENS[tens]}-${ONES[ones]}`;
};

const representationDelay = (representation: Representation): number => {
  switch (representation) {
    case "concrete":
      return DAY_MS;
    case "pictorial":
      return TWO_DAY_MS;
    case "abstract":
      return THREE_DAY_MS;
  }
};

const supportStrategyFromTag = (tag: string): readonly string[] => {
  const map: Record<string, readonly string[]> = {
    "count-all": ["count-with-objects", "worked-example"],
    "skip-one": ["track-each-item", "worked-example"],
    "numeral-quantity-confusion": ["match-numeral-to-quantity", "worked-example"],
    "more-fewer-reversal": ["compare-quantity", "worked-example"],
    "off-by-one": ["slow-counting", "worked-example"],
    "count-back-error": ["count-backwards", "worked-example"],
    "skip-teen": ["count-in-ones", "worked-example"],
    "order-confusion": ["sequence-order", "worked-example"],
    "teen-reversal": ["teen-and-ones", "worked-example"],
    "ten-miscount": ["bundle-tens", "worked-example"],
    "teen-hundred-confusion": ["hundreds-and-tens", "worked-example"],
    "over-under-estimate": ["estimate-range", "worked-example"],
    "place-value-reversal": ["build-tens-and-ones", "worked-example"],
    "partition-error": ["split-tens-and-ones", "worked-example"],
    "exchange-error": ["exchange-counters", "worked-example"],
    reversal: ["fact-family-reverse", "worked-example"],
    "take-away-reversal": ["subtract-from-set", "worked-example"],
    "carry-error": ["bridge-ten", "worked-example"],
    "borrow-error": ["bridge-ten", "worked-example"],
    "fact-family-confusion": ["fact-family-triangle", "worked-example"],
    "group-count-error": ["make-equal-groups", "worked-example"],
    "row-column-confusion": ["array-counting", "worked-example"],
    "double-error": ["pair-and-double", "worked-example"],
    "share-remainder": ["share-equally", "worked-example"],
    "half-error": ["split-equally", "worked-example"],
    "half-not-equal": ["split-equally", "worked-example"],
    "quarter-not-equal": ["split-equally", "worked-example"],
    "unequal-parts": ["compare-parts", "worked-example"],
    "length-reversal": ["compare-length", "worked-example"],
    "unit-confusion": ["measure-with-unit", "worked-example"],
    "mass-reversal": ["compare-mass", "worked-example"],
    "capacity-confusion": ["compare-capacity", "worked-example"],
    "hour-hand-confusion": ["read-clock-face", "worked-example"],
    "day-order": ["sequence-days", "worked-example"],
    "half-past-confusion": ["read-half-past", "worked-example"],
    "sequence-error": ["before-and-after", "worked-example"],
    "coin-confusion": ["coin-denominations", "worked-example"],
    "skip-1p": ["combine-coins", "worked-example"],
    "value-reversal": ["same-money", "worked-example"],
    "total-error": ["pay-exact", "worked-example"],
    "shape-misname": ["shape-name", "worked-example"],
    "side-corner-confusion": ["shape-properties", "worked-example"],
    "solid-misname": ["solid-name", "worked-example"],
    "position-reversal": ["direction-words", "worked-example"],
    "pattern-break": ["copy-pattern", "worked-example"],
    "rule-error": ["find-the-rule", "worked-example"],
    "copy-error": ["repeat-pattern", "worked-example"],
  };
  return map[tag] ?? ["worked-example"];
};

const supportStrategiesFor = (tags: readonly string[], representation: Representation, recentRepresentations: readonly Representation[]): string[] => {
  const strategies = tags.flatMap((tag) => supportStrategyFromTag(tag));
  const recentMatches = recentRepresentations.filter((rep) => rep === representation).length;
  if (recentMatches >= 2) {
    strategies.push("rotate-representation");
  }
  strategies.push("delayed-recall", "worked-example");
  return unique(strategies);
};

const basePrompt = (representation: Representation, prompt: string): string =>
  `${prompt} [${representation}]`;

const generatedTask = (params: {
  prompt: string;
  answer: string;
  allowedAnswers?: readonly string[];
  answerMode?: "exact" | "numeric";
  tolerance?: number;
  workedExample?: string;
  supportStrategy?: readonly string[];
  reviewDelayMs?: number;
}): GeneratedMathsTask => ({
  prompt: params.prompt,
  answer: params.answer,
  allowedAnswers: params.allowedAnswers ?? [params.answer],
  answerMode: params.answerMode ?? "exact",
  tolerance: params.tolerance,
  workedExample: params.workedExample ?? `Worked example: ${params.answer}`,
  supportStrategy: params.supportStrategy ?? ["worked-example"],
  reviewDelayMs: params.reviewDelayMs ?? DAY_MS,
});

const buildGeneratedTask = (template: MathsTemplate, seed: number, recentRepresentations: readonly Representation[] = []): GeneratedMathsTask => {
  const rng = mulberry32(seed);
  const rep = template.representation;
  const delay = representationDelay(rep) + (recentRepresentations.filter((r) => r === rep).length >= 2 ? DAY_MS : 0);
  const strategies = supportStrategiesFor(template.misconceptionTags, rep, recentRepresentations);
  const hint = template.hintSequence?.[0] ?? `Try the ${rep} representation first.`;
  const promptPrefix = (prompt: string) => basePrompt(rep, prompt);

  switch (template.generator) {
    case "count-objects": {
      const n = randInt(rng, 1, 10);
      return generatedTask({
        prompt: promptPrefix(`How many objects? ${DOTS(n)}`),
        answer: String(n),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "count-sequence": {
      const n = randInt(rng, 1, 10);
      return generatedTask({
        prompt: promptPrefix(`Count the sequence from 1 to ${n}.`),
        answer: String(n),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "numeral-match": {
      const n = randInt(rng, 1, 10);
      return generatedTask({
        prompt: promptPrefix(`Match the numeral ${n} to the quantity.`),
        answer: String(n),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "compare-more-fewer": {
      const left = randInt(rng, 1, 5);
      const right = randInt(rng, 1, 5);
      const answer = left > right ? "left" : left < right ? "right" : "same";
      return generatedTask({
        prompt: promptPrefix(`Which group has more: left ${DOTS(left)} or right ${DOTS(right)}?`),
        answer,
        allowedAnswers: [answer],
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "one-more": {
      const n = randInt(rng, 0, 9);
      return generatedTask({
        prompt: promptPrefix(`What is one more than ${n}?`),
        answer: String(n + 1),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "one-less": {
      const n = randInt(rng, 1, 10);
      return generatedTask({
        prompt: promptPrefix(`What is one less than ${n}?`),
        answer: String(n - 1),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "count-20": {
      const n = randInt(rng, 1, 20);
      return generatedTask({
        prompt: promptPrefix(`How many objects? ${DOTS(n)}`),
        answer: String(n),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "teen-break": {
      const ones = randInt(rng, 0, 9);
      const value = 10 + ones;
      return generatedTask({
        prompt: promptPrefix(`Show ${value} as ten and ones.`),
        answer: `10+${ones}`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "order-20": {
      const a = randInt(rng, 1, 20);
      const b = randInt(rng, 1, 20);
      return generatedTask({
        prompt: promptPrefix(`Put ${a} and ${b} in order from smallest to largest.`),
        answer: `${Math.min(a, b)}<${Math.max(a, b)}`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "count-in-tens": {
      const tens = randInt(rng, 1, 9);
      return generatedTask({
        prompt: promptPrefix(`Count in tens to ${tens * 10}.`),
        answer: String(tens * 10),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "read-write-numbers": {
      const value = randInt(rng, 1, 99);
      const word = numberToWords(value);
      return generatedTask({
        prompt: promptPrefix(`Write "${word}" as digits.`),
        answer: String(value),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "estimate-100": {
      const target = randInt(rng, 20, 80);
      return generatedTask({
        prompt: promptPrefix(`About how many are there? ${target} is close enough.`),
        answer: String(target),
        answerMode: "numeric",
        tolerance: 10,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "tens-and-units": {
      const tens = randInt(rng, 1, 9);
      const units = randInt(rng, 0, 9);
      return generatedTask({
        prompt: promptPrefix(`There are ${tens} tens and ${units} units. What number is it?`),
        answer: String(tens * 10 + units),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "partition-2digit": {
      const tens = randInt(rng, 1, 9);
      const units = randInt(rng, 0, 9);
      return generatedTask({
        prompt: promptPrefix(`Partition ${tens * 10 + units} into tens and ones.`),
        answer: `${tens}+${units}`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "make-number": {
      const tens = randInt(rng, 1, 9);
      const units = randInt(rng, 0, 9);
      return generatedTask({
        prompt: promptPrefix(`Make the number from ${tens} tens and ${units} ones.`),
        answer: String(tens * 10 + units),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "number-bonds": {
      const a = randInt(rng, 1, 9);
      return generatedTask({
        prompt: promptPrefix(`What number makes ${a} + ? = 10?`),
        answer: String(10 - a),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "add-within-10": {
      const a = randInt(rng, 0, 10);
      const b = randInt(rng, 0, 10 - a);
      return generatedTask({
        prompt: promptPrefix(`${a} + ${b} = ?`),
        answer: String(a + b),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "sub-within-10": {
      const a = randInt(rng, 0, 10);
      const b = randInt(rng, 0, a);
      return generatedTask({
        prompt: promptPrefix(`${a} - ${b} = ?`),
        answer: String(a - b),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "add-within-20": {
      const a = randInt(rng, 0, 20);
      const b = randInt(rng, 0, 20 - a);
      return generatedTask({
        prompt: promptPrefix(`${a} + ${b} = ?`),
        answer: String(a + b),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "sub-within-20": {
      const a = randInt(rng, 0, 20);
      const b = randInt(rng, 0, a);
      return generatedTask({
        prompt: promptPrefix(`${a} - ${b} = ?`),
        answer: String(a - b),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "fact-families": {
      const a = randInt(rng, 1, 9);
      const b = randInt(rng, 1, 9);
      const c = a + b;
      return generatedTask({
        prompt: promptPrefix(`Use the fact family for ${a}, ${b} and ${c}.`),
        answer: `${a}+${b}=${c},${b}+${a}=${c}`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "groups-of": {
      const groups = randInt(rng, 2, 5);
      const size = randInt(rng, 2, 5);
      return generatedTask({
        prompt: promptPrefix(`How many items are in ${groups} groups of ${size}?`),
        answer: String(groups * size),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "arrays": {
      const rows = randInt(rng, 2, 5);
      const cols = randInt(rng, 2, 5);
      return generatedTask({
        prompt: promptPrefix(`How many in ${rows} rows and ${cols} columns?`),
        answer: String(rows * cols),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "doubles": {
      const n = randInt(rng, 1, 10);
      return generatedTask({
        prompt: promptPrefix(`Double ${n}.`),
        answer: String(n * 2),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "share-equally": {
      const total = randInt(rng, 2, 20);
      const parts = randInt(rng, 2, 5);
      const answer = String(Math.floor(total / parts));
      return generatedTask({
        prompt: promptPrefix(`Share ${total} equally between ${parts} children.`),
        answer,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "halves": {
      const n = randInt(rng, 2, 20) * 2;
      return generatedTask({
        prompt: promptPrefix(`Half of ${n}.`),
        answer: String(n / 2),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "half-of": {
      const n = randInt(rng, 2, 20) * 2;
      return generatedTask({
        prompt: promptPrefix(`What is half of ${n}?`),
        answer: String(n / 2),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "quarter-of": {
      const n = randInt(rng, 4, 20) * 4;
      return generatedTask({
        prompt: promptPrefix(`What is a quarter of ${n}?`),
        answer: String(n / 4),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "equal-parts": {
      return generatedTask({
        prompt: promptPrefix(`Are the parts equal?`),
        answer: `parts equal`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "compare-length": {
      const left = randInt(rng, 2, 10);
      const right = randInt(rng, 2, 10);
      const answer = left > right ? "left longer" : left < right ? "right longer" : "same length";
      return generatedTask({
        prompt: promptPrefix(`Compare lengths: left ${left} cm, right ${right} cm.`),
        answer,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "measure-cm": {
      return generatedTask({
        prompt: promptPrefix(`Which unit measures the length in this task?`),
        answer: "cm",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "compare-mass": {
      const heavier = randInt(rng, 1, 2) === 1 ? "left" : "right";
      const lighter = heavier === "left" ? "right" : "left";
      return generatedTask({
        prompt: promptPrefix(`Which is heavier, left or right?`),
        answer: `${heavier} heavier, ${lighter} lighter`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "capacity": {
      return generatedTask({
        prompt: promptPrefix(`Which container holds more?`),
        answer: "more",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "o-clock": {
      const hour = randInt(rng, 1, 12);
      return generatedTask({
        prompt: promptPrefix(`What time is ${hour}:00?`),
        answer: `${String(hour).padStart(2, "0")}:00`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "order-days": {
      const start = randInt(rng, 0, 6);
      const ordered = [DAYS[start]!, DAYS[(start + 1) % 7]!, DAYS[(start + 2) % 7]!];
      return generatedTask({
        prompt: promptPrefix(`Put these days in order: ${ordered.slice().reverse().join(", ")}.`),
        answer: ordered.join(" -> "),
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "half-past": {
      const hour = randInt(rng, 1, 12);
      return generatedTask({
        prompt: promptPrefix(`What time is half past ${hour}?`),
        answer: `${String(hour).padStart(2, "0")}:30`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "sequence-events": {
      return generatedTask({
        prompt: promptPrefix(`What comes first in a simple story sequence?`),
        answer: "before/after",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "coin-values": {
      const coin = COINS[randInt(rng, 0, COINS.length - 1)]!;
      return generatedTask({
        prompt: promptPrefix(`What is the value of the coin shown: ${coin}?`),
        answer: coin,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "coin-combinations": {
      const fives = randInt(rng, 0, 2);
      const twos = randInt(rng, 0, 2);
      const ones = randInt(rng, 0, 4);
      const total = fives * 5 + twos * 2 + ones;
      return generatedTask({
        prompt: promptPrefix(`5p×${fives} + 2p×${twos} + 1p×${ones}`),
        answer: `${total}p`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "same-amount": {
      return generatedTask({
        prompt: promptPrefix(`Do these have the same amount?`),
        answer: "equal value",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "pay-exact": {
      const total = randInt(rng, 1, 20);
      return generatedTask({
        prompt: promptPrefix(`Pay exactly ${total}p.`),
        answer: `${total}p`,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "name-2d": {
      const shape = SHAPES_2D[randInt(rng, 0, SHAPES_2D.length - 1)]!;
      return generatedTask({
        prompt: promptPrefix(`Name this 2D shape: ${shape}.`),
        answer: shape,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "properties-2d": {
      return generatedTask({
        prompt: promptPrefix(`What properties do 2D shapes have?`),
        answer: "sides/corners",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "name-3d": {
      const solid = SHAPES_3D[randInt(rng, 0, SHAPES_3D.length - 1)]!;
      return generatedTask({
        prompt: promptPrefix(`Name this 3D shape: ${solid}.`),
        answer: solid,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "position": {
      const position = POSITION_WORDS[randInt(rng, 0, POSITION_WORDS.length - 1)]!;
      return generatedTask({
        prompt: promptPrefix(`Where is the object? ${position}.`),
        answer: position,
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "continue-pattern": {
      const colour = COLOUR_WORDS[randInt(rng, 0, COLOUR_WORDS.length - 1)]!;
      const sequence = [colour, colour === "red" ? "blue" : "red", colour].join(", ");
      return generatedTask({
        prompt: promptPrefix(`Continue the pattern: ${sequence}.`),
        answer: "next item",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "missing-term": {
      const start = randInt(rng, 1, 5);
      const step = randInt(rng, 1, 3);
      const seq = [start, start + step, start + 2 * step];
      return generatedTask({
        prompt: promptPrefix(`What comes next in ${seq.join(", ")}?`),
        answer: "sequence rule",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    case "copy-pattern": {
      return generatedTask({
        prompt: promptPrefix(`Copy this pattern exactly.`),
        answer: "match",
        workedExample: hint,
        supportStrategy: strategies,
        reviewDelayMs: delay,
      });
    }
    default:
      throw new Error(`unknown-generator:${template.generator}`);
  }
};

const itemFromTemplate = (template: MathsTemplate, seed: number, recentRepresentations: readonly Representation[] = []): MathsItem => {
  const generated = buildGeneratedTask(template, seed, recentRepresentations);
  return {
    itemId: `${template.id}-${seed}`,
    templateId: template.id,
    strand: template.strand,
    representation: template.representation,
    dimension: "maths",
    prompt: generated.prompt,
    answer: generated.answer,
    allowedAnswers: generated.allowedAnswers,
    misconceptionTags: template.misconceptionTags,
    workedExample: generated.workedExample,
    supportStrategy: generated.supportStrategy,
    reviewDelayMs: generated.reviewDelayMs,
    nextReviewAt: generated.reviewDelayMs,
    answerMode: generated.answerMode,
    tolerance: generated.tolerance,
  };
};

const parseSeedFromItemId = (itemId: string, templateId: string): number => {
  const prefix = `${templateId}-`;
  if (!itemId.startsWith(prefix)) return 0;
  const raw = itemId.slice(prefix.length);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normaliseResult = (generated: MathsItem, attempt: MathsAttempt): MathsResult => {
  if (attempt.answer.trim().length === 0) return "skipped";
  if (attempt.hintCount >= 3) return "incorrect";
  if (attempt.result === "skipped") return "skipped";

  const attemptAnswer = normalize(attempt.answer);
  const accepted = generated.allowedAnswers.map(normalize);

  if (generated.answerMode === "numeric") {
    const expected = Number(generated.answer);
    const actual = Number(attempt.answer);
    if (Number.isFinite(expected) && Number.isFinite(actual)) {
      const tolerance = generated.tolerance ?? 0;
      if (Math.abs(actual - expected) <= tolerance) {
        return attempt.result === "partial" || attempt.hintCount > 0 ? "partial" : "correct";
      }
    }
  }

  if (accepted.includes(attemptAnswer)) {
    return attempt.result === "partial" || attempt.hintCount > 0 ? "partial" : "correct";
  }

  return attempt.result === "partial" ? "partial" : "incorrect";
};

const masteryFrom = (result: MathsResult, hintCount: number, reviewDelayMs: number): MasteryState => {
  if (result === "skipped") return "new";
  if (result === "incorrect") return "learning";
  if (result === "partial") return "learning";
  if (hintCount > 0) return "practising";
  return reviewDelayMs >= THREE_DAY_MS ? "strong" : "practising";
};

export const buildMathsActivity = (
  input: MathsLessonContext,
): MathsActivityPlan => {
  const item = itemFromTemplate(input.template, input.seed, input.recentRepresentations ?? []);
  return {
    dimension: "maths",
    item,
    representation: item.representation,
    workedExample: item.workedExample,
    supportStrategy: item.supportStrategy,
    reviewDelayMs: item.reviewDelayMs,
    nextReviewAt: (input.now ?? 0) + item.reviewDelayMs,
  };
};

export const classifyMathsAttempt = (
  attempt: MathsAttempt,
  template: MathsTemplate,
): MathsEvidence => {
  const seed = parseSeedFromItemId(attempt.itemId, template.id);
  const item = itemFromTemplate(template, seed);
  const result = normaliseResult(item, attempt);
  return {
    dimension: "maths",
    templateId: template.id,
    itemId: attempt.itemId,
    strand: template.strand,
    representation: template.representation,
    prompt: item.prompt,
    answer: item.answer,
    result,
    misconceptionTags: template.misconceptionTags,
    supportStrategy: item.supportStrategy,
    masteryState: masteryFrom(result, attempt.hintCount, item.reviewDelayMs),
    delayMs: item.reviewDelayMs,
    englishIsolation: true,
  };
};

export const mathsDimensionMatches = (
  result: MathsResult,
  misconception: string,
): boolean => result === "incorrect" && supportStrategyFromTag(misconception).length > 0;

export const DETERMINISTIC_SEED_BASE = 1_700_000_000;
