"use client";

import { useMemo, useState } from "react";
import {
  awardLearningReward,
  projectAdventureStage,
  projectWorldState,
  type RewardEvent,
} from "../../../packages/learning-engine/src/rewards";

const seedEvents: RewardEvent[] = [
  {
    eventId: "r-1",
    childProfileId: "child-1",
    dimension: "phonics",
    kind: "collection",
    intensity: "calm",
    awardedAt: 1_700_000_000_000,
  },
  {
    eventId: "r-2",
    childProfileId: "child-1",
    dimension: "spelling",
    kind: "build",
    intensity: "calm",
    awardedAt: 1_700_000_000_500,
  },
  {
    eventId: "r-3",
    childProfileId: "child-1",
    dimension: "maths",
    kind: "character",
    intensity: "calm",
    awardedAt: 1_700_000_001_000,
  },
];

const STAGE_SIZE = 1;

export function AdventureHarness() {
  const [events, setEvents] = useState<RewardEvent[]>(seedEvents);
  const [reducedMotion, setReducedMotion] = useState(false);

  const world = useMemo(() => projectWorldState(events, "child-1"), [events]);
  const stage = useMemo(
    () => projectAdventureStage(events, STAGE_SIZE),
    [events],
  );

  const addMajorCelebration = () => {
    const next: RewardEvent = {
      eventId: `r-${events.length + 1}-${Date.now()}`,
      childProfileId: "child-1",
      dimension: "reading",
      kind: "celebration",
      intensity: "major",
      awardedAt: Date.now(),
    };
    setEvents((prev) => [...prev, next]);
  };

  const addEligibleCollection = () => {
    const reward = awardLearningReward("child-1", "maths", true, "calm", Date.now());
    if (reward.length === 0) return;
    setEvents((prev) => [...prev, ...reward]);
  };

  return (
    <main className="learner-shell" data-testid="adventure-journey">
      <section className="home-card">
        <p className="eyebrow">Adventure</p>
        <h1>Calm rewards, no loss</h1>
        <p data-testid="adventure-stage">Stage {stage.stage}</p>
        <p data-testid="adventure-next">Next stage in {stage.nextStageIn} rewards</p>
        <p data-testid="adventure-collection">Collection: {world.collection.length}</p>
        <p data-testid="adventure-build">Build: {world.build.length}</p>
        <p data-testid="adventure-character">Character stage: {world.characterStage}</p>
        <p data-testid="adventure-celebrations">Celebrations: {world.celebrations}</p>
        <p data-testid="adventure-reduced-motion" data-active={stage.reducedMotion ? "true" : "false"}>
          Reduced motion: {stage.reducedMotion ? "on" : "off"}
        </p>
        <div className="form-row">
          <button
            className="primary-button"
            type="button"
            onClick={addMajorCelebration}
            data-testid="adventure-add-major"
          >
            Award a major celebration
          </button>
          <button
            className="link-button"
            type="button"
            onClick={addEligibleCollection}
            data-testid="adventure-add-collection"
          >
            Award an eligible learning collection
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setReducedMotion((value) => !value)}
            data-testid="adventure-toggle-motion"
          >
            Toggle reduced motion preference
          </button>
        </div>
        <p data-testid="adventure-preference">Reduced motion preference: {reducedMotion ? "on" : "off"}</p>
      </section>
    </main>
  );
}
