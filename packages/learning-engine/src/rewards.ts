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