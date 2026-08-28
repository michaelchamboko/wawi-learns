/**
 * Reward projection (SLC-008-T001).
 * Pure, deterministic, idempotent. The same event set yields the same
 * WorldState, and progress never decreases.
 */

export type RewardKind = "collection" | "build" | "character" | "celebration";

export interface RewardEvent {
  readonly eventId: string;
  readonly childProfileId: string;
  readonly dimension: "phonics" | "spelling" | "reading" | "maths" | "tracing" | "speech";
  readonly kind: RewardKind;
  readonly intensity: "calm" | "major";
  readonly awardedAt: number;
}

export interface WorldState {
  readonly childProfileId: string;
  readonly collection: readonly string[];
  readonly build: readonly string[];
  readonly characterStage: number;
  readonly celebrations: number;
}

export const EMPTY_WORLD: Omit<WorldState, "childProfileId"> = {
  collection: [],
  build: [],
  characterStage: 0,
  celebrations: 0,
};

export const projectWorldState = (
  events: readonly RewardEvent[],
  childProfileId: string,
): WorldState => {
  const sorted = [...events].sort((a, b) => a.awardedAt - b.awardedAt);
  const collection = new Set<string>();
  const build = new Set<string>();
  let characterStage = 0;
  let celebrations = 0;

  for (const event of sorted) {
    switch (event.kind) {
      case "collection":
        collection.add(`${event.dimension}:${event.eventId}`);
        break;
      case "build":
        build.add(`${event.dimension}:${event.eventId}`);
        break;
      case "character":
        characterStage += event.intensity === "major" ? 2 : 1;
        break;
      case "celebration":
        celebrations += 1;
        break;
    }
  }

  return {
    childProfileId,
    collection: [...collection].sort(),
    build: [...build].sort(),
    characterStage,
    celebrations,
  };
};

export const awardLearningReward = (
  childProfileId: string,
  dimension: RewardEvent["dimension"],
  eligible: boolean,
  intensity: "calm" | "major" = "calm",
  occurredAt: number = Date.now(),
): RewardEvent[] => {
  if (!eligible) return [];
  return [
    {
      eventId: `reward-${occurredAt}-${dimension}`,
      childProfileId,
      dimension,
      kind: "collection",
      intensity,
      awardedAt: occurredAt,
    },
  ];
};

export const projectAdventureStage = (
  events: readonly RewardEvent[],
  stageSize: number = 5,
): { stage: number; nextStageIn: number; reducedMotion: boolean } => {
  if (stageSize <= 0) throw new Error("stage-size-must-be-positive");
  const sorted = [...events].sort((a, b) => a.awardedAt - b.awardedAt);
  let characterStage = 0;
  let celebrations = 0;
  let reducedMotion = false;
  for (const event of sorted) {
    if (event.kind === "character") {
      characterStage += event.intensity === "major" ? 2 : 1;
    } else if (event.kind === "celebration") {
      celebrations += 1;
    }
    if (event.intensity === "major") reducedMotion = true;
  }
  const earnedCelebrations = celebrations + characterStage;
  const stage = Math.floor(earnedCelebrations / stageSize);
  const nextStageIn = Math.max(stageSize - (earnedCelebrations % stageSize), 0);
  return { stage, nextStageIn, reducedMotion };
};

export const mergeRewardEvents = (a: readonly RewardEvent[], b: readonly RewardEvent[]): RewardEvent[] => {
  const seen = new Set<string>();
  const merged: RewardEvent[] = [];
  for (const event of [...a, ...b]) {
    if (seen.has(event.eventId)) continue;
    seen.add(event.eventId);
    merged.push(event);
  }
  return merged.sort((left, right) => left.awardedAt - right.awardedAt);
};