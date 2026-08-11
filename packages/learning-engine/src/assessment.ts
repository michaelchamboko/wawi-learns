import { z } from "zod";

export const AssessmentStateSchema = z.object({
  parentId: z.string(),
  childProfileId: z.string(),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  coveredDimensions: z.array(
    z.enum(["phonics", "spelling", "reading", "maths", "tracing", "speech"]),
  ),
  itemsAttempted: z.number().int().nonnegative(),
  itemsCorrect: z.number().int().nonnegative(),
  history: z.array(
    z.object({
      dimension: z.enum(["phonics", "spelling", "reading", "maths", "tracing", "speech"]),
      itemId: z.string(),
      result: z.enum(["correct", "incorrect", "partial", "skipped"]),
      occurredAt: z.number(),
    }),
  ),
  baselineVersion: z.string(),
});

export type AssessmentState = z.infer<typeof AssessmentStateSchema>;

export interface AssessmentDecision {
  readonly dimension: AssessmentState["history"][number]["dimension"];
  readonly itemId: string;
  readonly reason: string;
  readonly continue: boolean;
}

export interface AssessmentItemLibrary {
  readonly nextItemId: (dimension: AssessmentState["history"][number]["dimension"], seed: number) => string;
  readonly isCovered: (state: AssessmentState) => boolean;
}

export interface NextItemOptions {
  readonly targetItems: number;
  readonly randomSeed: () => number;
  readonly now: () => number;
}

const DIMENSION_ORDER: AssessmentState["history"][number]["dimension"][] = [
  "phonics",
  "spelling",
  "reading",
  "maths",
];

const DEFAULT_ITEM_LIBRARY: AssessmentItemLibrary = {
  nextItemId: (dimension, seed) => `${dimension}-probe-${seed.toString(36)}`,
  isCovered: (state) => {
    const covered = new Set(state.coveredDimensions);
    return DIMENSION_ORDER.every((d) => covered.has(d));
  },
};

/**
 * Pure, deterministic assessment branching.
 * Stops when:
 *   - every required dimension has at least one piece of evidence,
 *   - the parent can skip (sets coveredDimensions = []),
 *   - the target item count is reached,
 *   - or the parent restarts (history cleared, startedAt reset).
 */
export function nextAssessmentItem(
  state: AssessmentState,
  options: NextItemOptions,
  library: AssessmentItemLibrary = DEFAULT_ITEM_LIBRARY,
): AssessmentDecision {
  if (options.targetItems <= 0) {
    throw new Error("assessment: targetItems must be > 0");
  }

  if (state.itemsAttempted >= options.targetItems) {
    return {
      dimension: state.history.at(-1)?.dimension ?? "phonics",
      itemId: "",
      reason: "target-reached",
      continue: false,
    };
  }

  if (library.isCovered(state)) {
    return {
      dimension: state.history.at(-1)?.dimension ?? "phonics",
      itemId: "",
      reason: "all-dimensions-covered",
      continue: false,
    };
  }

  for (const dimension of DIMENSION_ORDER) {
    if (!state.coveredDimensions.includes(dimension)) {
      const seed = options.randomSeed();
      return {
        dimension,
        itemId: library.nextItemId(dimension, seed),
        reason: `cover-${dimension}`,
        continue: true,
      };
    }
  }

  return {
    dimension: "phonics",
    itemId: "",
    reason: "fallback-stop",
    continue: false,
  };
}

export const DEFAULT_TARGET_ITEMS = 20;

export function startAssessment(
  parentId: string,
  childProfileId: string,
  baselineVersion: string,
  now: () => number,
): AssessmentState {
  return {
    parentId,
    childProfileId,
    startedAt: now(),
    coveredDimensions: [],
    itemsAttempted: 0,
    itemsCorrect: 0,
    history: [],
    baselineVersion,
  };
}

export function skipAssessment(
  state: AssessmentState,
  now: () => number,
): AssessmentState {
  return {
    ...state,
    completedAt: now(),
    coveredDimensions: [],
    baselineVersion: state.baselineVersion,
  };
}

export function restartAssessment(
  state: AssessmentState,
  now: () => number,
): AssessmentState {
  return startAssessment(state.parentId, state.childProfileId, state.baselineVersion, now);
}

export function recordAttempt(
  state: AssessmentState,
  decision: AssessmentDecision,
  result: AssessmentState["history"][number]["result"],
  occurredAt: number,
): AssessmentState {
  const history = [
    ...state.history,
    { dimension: decision.dimension, itemId: decision.itemId, result, occurredAt },
  ];
  const coveredDimensions = state.coveredDimensions.includes(decision.dimension)
    ? state.coveredDimensions
    : [...state.coveredDimensions, decision.dimension];
  const itemsCorrect =
    state.itemsCorrect + (result === "correct" ? 1 : 0);
  return {
    ...state,
    history,
    coveredDimensions,
    itemsAttempted: state.itemsAttempted + 1,
    itemsCorrect,
  };
}