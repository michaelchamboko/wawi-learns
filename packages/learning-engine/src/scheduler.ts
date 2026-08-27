import {
  type MasteryDimension,
  type MasteryProjection,
  type MasteryState,
} from "./mastery";

export type ActivityKind = "learn" | "picture-word" | "tile" | "trace" | "spell" | "read" | "say-word";

export interface LessonContext {
  readonly childProfileId: string;
  readonly yearGroup: "reception" | "year1";
  readonly targetDailyMinutes: number;
  readonly backlogByDimension: Readonly<Partial<Record<MasteryDimension, number>>>;
  readonly recentModalityByDimension: Readonly<
    Partial<Record<MasteryDimension, ActivityKind[]>>
  >;
  readonly dailyCompletedByDimension: Readonly<
    Partial<Record<MasteryDimension, number>>
  >;
}

export interface ActivityCandidate {
  readonly itemId: string;
  readonly dimension: MasteryDimension;
  readonly modality: ActivityKind;
  readonly state: MasteryState;
  readonly isWeak: boolean;
  readonly isNew: boolean;
}

export interface ActivityPlan {
  readonly dimension: MasteryDimension;
  readonly modality: ActivityKind;
  readonly itemId: string;
  readonly reason: string;
  readonly audit: { isWeak: boolean; isNew: boolean };
}

export interface BuildPlanInput {
  readonly context: LessonContext;
  readonly candidates: readonly ActivityCandidate[];
  readonly rng: () => number;
  readonly backlogCeiling?: number;
}

const newRatio = 0.4;
const weakRatio = 0.4;
const retentionRatio = 0.2;
const DEFAULT_BACKLOG_CEILING = 10;

export const buildReviewQueue = (
  candidates: readonly ActivityCandidate[],
  ceiling: number = DEFAULT_BACKLOG_CEILING,
): readonly ActivityCandidate[] => {
  const weak = candidates.filter((c) => c.isWeak);
  return weak.slice(0, ceiling);
};

const pickByRatio = <T>(
  pool: readonly T[],
  desiredCount: number,
  isCandidateOk: (item: T) => boolean,
  rng: () => number,
): T[] => {
  const out: T[] = [];
  const poolSorted = [...pool].sort(() => rng() - 0.5);
  for (const item of poolSorted) {
    if (out.length >= desiredCount) break;
    if (!isCandidateOk(item)) continue;
    out.push(item);
  }
  return out;
};

export const selectNextActivity = (input: BuildPlanInput): ActivityPlan => {
  const backlogCeiling = input.backlogCeiling ?? DEFAULT_BACKLOG_CEILING;
  const { context, candidates, rng } = input;

  // If backlog is excessive, drop new content and revisit weak items.
  const totalBacklog = Object.values(context.backlogByDimension).reduce(
    (acc, value) => acc + (value ?? 0),
    0,
  );

  if (totalBacklog > backlogCeiling) {
    const weak = candidates.find((c) => c.isWeak) ?? candidates[0];
    if (!weak) {
      return {
        dimension: "phonics",
        modality: "learn",
        itemId: "home-plan",
        reason: "no-candidates-home",
        audit: { isWeak: false, isNew: false },
      };
    }
    return {
      dimension: weak.dimension,
      modality: weak.modality,
      itemId: weak.itemId,
      reason: "backlog-exceeded",
      audit: { isWeak: true, isNew: false },
    };
  }

  const weakCount = Math.max(1, Math.round(candidates.length * weakRatio));
  const newCount = Math.max(1, Math.round(candidates.length * newRatio));
  const retentionCount = Math.max(0, candidates.length - weakCount - newCount);

  const weakPicks = pickByRatio(
    candidates.filter((c) => c.isWeak),
    weakCount,
    () => true,
    rng,
  );
  const newPicks = pickByRatio(
    candidates.filter((c) => c.isNew),
    newCount,
    () => true,
    rng,
  );
  const retentionPicks = pickByRatio(
    candidates.filter(
      (c) => c.state === "mastered" || c.state === "strong",
    ),
    retentionCount,
    () => true,
    rng,
  );

  const queue = [...weakPicks, ...newPicks, ...retentionPicks];
  const chosen = queue[0];
  if (!chosen) {
    return {
      dimension: "phonics",
      modality: "learn",
      itemId: "home-plan",
      reason: "queue-empty",
      audit: { isWeak: false, isNew: false },
    };
  }

  // Rotate modality if the same one was used twice in a row in this dimension.
  // Speech (microphone) and tracing (handwriting) are higher-friction modalities:
  // never schedule a third consecutive one when another candidate is available.
  const recent = context.recentModalityByDimension[chosen.dimension] ?? [];
  const lastTwo = recent.slice(-2);
  let selected = chosen;
  let modality = chosen.modality;
  if (lastTwo.length === 2 && lastTwo.every((m) => m === modality) && (modality === "say-word" || modality === "trace")) {
    const fallback = candidates.find((c) => c.modality !== modality) ?? chosen;
    selected = fallback;
    modality = fallback.modality;
    return {
      dimension: selected.dimension,
      modality,
      itemId: selected.itemId,
      reason: "modality-fatigue-rotation",
      audit: { isWeak: selected.isWeak, isNew: selected.isNew },
    };
  }
  const lastModality = recent.at(-1);
  if (lastModality === modality) {
    const fallback = candidates.find((c) => c.dimension === chosen.dimension && c.modality !== modality);
    if (fallback) {
      selected = fallback;
      modality = fallback.modality;
    } else {
      modality = modality === "picture-word" ? "tile" : "picture-word";
    }
  }

  return {
    dimension: selected.dimension,
    modality,
    itemId: selected.itemId,
    reason: selected.isWeak
      ? "weak-recovery"
      : selected.isNew
        ? "new-introduction"
        : "retention",
    audit: { isWeak: selected.isWeak, isNew: selected.isNew },
  };
};

export const candidatesFromProjections = (
  projections: readonly MasteryProjection[],
): readonly ActivityCandidate[] =>
  projections.map((p) => ({
    itemId: p.itemId,
    dimension: "phonics" as MasteryDimension,
    modality: "picture-word" as ActivityKind,
    state: p.state,
    isWeak: p.state === "relearning" || p.state === "learning",
    isNew: p.state === "new",
  }));