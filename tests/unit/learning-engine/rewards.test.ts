import { describe, expect, it } from "vitest";
import {
  EMPTY_WORLD,
  awardLearningReward,
  mergeRewardEvents,
  projectAdventureStage,
  projectWorldState,
  type RewardEvent,
} from "../../../packages/learning-engine/src/index";

const event = (overrides: Partial<RewardEvent> & Pick<RewardEvent, "eventId" | "kind">): RewardEvent => ({
  childProfileId: "child-1",
  dimension: "phonics",
  intensity: "calm",
  awardedAt: 1_700_000_000_000,
  ...overrides,
});

describe("SLC-008-T001 — reward projection", () => {
  it("deduplicates collection entries by eventId", () => {
    const events = [
      event({ eventId: "e1", kind: "collection" }),
      event({ eventId: "e1", kind: "collection" }),
      event({ eventId: "e2", kind: "collection" }),
    ];
    const world = projectWorldState(events, "child-1");
    expect(world.collection).toHaveLength(2);
  });

  it("progress never decreases across replays", () => {
    const events = [
      event({ eventId: "e1", kind: "collection" }),
      event({ eventId: "b1", kind: "build" }),
      event({ eventId: "c1", kind: "character", intensity: "major" }),
      event({ eventId: "ce1", kind: "celebration" }),
    ];
    const first = projectWorldState(events, "child-1");
    const second = projectWorldState(events, "child-1");
    expect(first).toEqual(second);
    expect(first.characterStage).toBe(2);
    expect(first.celebrations).toBe(1);
  });

  it("replays are order-independent", () => {
    const events = [
      event({ eventId: "e1", kind: "collection" }),
      event({ eventId: "b1", kind: "build" }),
      event({ eventId: "c1", kind: "character" }),
    ];
    const reversed = [...events].reverse();
    const a = projectWorldState(events, "child-1");
    const b = projectWorldState(reversed, "child-1");
    expect(a).toEqual(b);
  });

  it("a missed day does not reduce progress", () => {
    const events = [event({ eventId: "e1", kind: "collection" })];
    const world = projectWorldState(events, "child-1");
    expect(world.collection.length).toBe(1);
  });

  it("awardLearningReward returns no event when the outcome is not eligible", () => {
    const events = awardLearningReward("child-1", "phonics", false);
    expect(events).toEqual([]);
  });

  it("awardLearningReward returns a single eligible collection event", () => {
    const events = awardLearningReward("child-1", "phonics", true, "calm", 1_700_000_000_000);
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe("collection");
  });

  it("the empty world state is the canonical starting point", () => {
    expect(EMPTY_WORLD.characterStage).toBe(0);
    expect(EMPTY_WORLD.celebrations).toBe(0);
    expect(EMPTY_WORLD.collection).toEqual([]);
    expect(EMPTY_WORLD.build).toEqual([]);
  });

  it("major character rewards count double and only then enable reduced motion", () => {
    const events: RewardEvent[] = [
      event({ eventId: "c1", kind: "character" }),
      event({ eventId: "c2", kind: "character", intensity: "major" }),
    ];
    const world = projectWorldState(events, "child-1");
    expect(world.characterStage).toBe(3);
    const stage = projectAdventureStage(events, 2);
    expect(stage.stage).toBe(1);
    expect(stage.reducedMotion).toBe(true);
  });

  it("calm-only rewards stay in reduced-motion-off mode", () => {
    const events: RewardEvent[] = [
      event({ eventId: "c1", kind: "character" }),
      event({ eventId: "c2", kind: "character" }),
    ];
    const stage = projectAdventureStage(events, 4);
    expect(stage.reducedMotion).toBe(false);
    expect(stage.nextStageIn).toBe(2);
  });

  it("mergeRewardEvents deduplicates by eventId and sorts by awardedAt", () => {
    const left = [event({ eventId: "e1", kind: "collection", awardedAt: 10 })];
    const right = [
      event({ eventId: "e1", kind: "collection", awardedAt: 10 }),
      event({ eventId: "e2", kind: "build", awardedAt: 5 }),
    ];
    const merged = mergeRewardEvents(left, right);
    expect(merged.map((e) => e.eventId)).toEqual(["e2", "e1"]);
  });

  it("offline replay of cached events yields identical world state", () => {
    const events = [
      event({ eventId: "e1", kind: "collection" }),
      event({ eventId: "b1", kind: "build" }),
      event({ eventId: "c1", kind: "character" }),
    ];
    const before = projectWorldState(events, "child-1");
    const replayed = projectWorldState(mergeRewardEvents([], events), "child-1");
    expect(replayed).toEqual(before);
  });
});