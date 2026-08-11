import { describe, expect, it } from "vitest";
import {
  commitAttemptThenAdvance,
  completeSession,
  pauseSession,
  startSession,
  type SessionState,
} from "../../../packages/learning-engine/src/index";

const activityPlan = { itemId: "w-cat", dimension: "phonics", modality: "picture-word" };

describe("SLC-004-T004 — child activity shell", () => {
  it("starts in the playing phase with zero committed attempts", () => {
    const state = startSession("c-1", "install-1", "0.1.0", activityPlan);
    expect(state.phase).toBe("playing");
    expect(state.attemptsCommitted).toBe(0);
    expect(state.lastError).toBeNull();
  });

  it("commits the attempt before advancing to feedback", async () => {
    const state = startSession("c-1", "install-1", "0.1.0", activityPlan);
    const outcome = await commitAttemptThenAdvance(
      state,
      {
        eventId: "evt-1",
        result: "correct",
        hintCount: 0,
        durationMs: 1200,
        dimension: "phonics",
        itemId: "w-cat",
        occurredAt: 1_700_000_000_000,
      },
      {
        appendAttempt: async () => ({ sourceSequence: 1 }),
        now: () => 1_700_000_000_000,
      },
    );
    expect(outcome.advance).toBe(true);
    expect(outcome.nextState.phase).toBe("feedback");
    expect(outcome.nextState.attemptsCommitted).toBe(1);
  });

  it("does not advance when the commit fails; the session remains paused", async () => {
    const state = startSession("c-1", "install-1", "0.1.0", activityPlan);
    const outcome = await commitAttemptThenAdvance(
      state,
      {
        eventId: "evt-2",
        result: "correct",
        hintCount: 0,
        durationMs: 1000,
        dimension: "phonics",
        itemId: "w-cat",
        occurredAt: 1_700_000_000_000,
      },
      {
        appendAttempt: async () => {
          throw new Error("indexeddb-locked");
        },
        now: () => 1_700_000_000_000,
      },
    );
    expect(outcome.advance).toBe(false);
    expect(outcome.nextState.phase).toBe("playing");
    expect(outcome.nextState.lastError).toContain("indexeddb-locked");
  });

  it("rejects a commit that arrives in the wrong phase", async () => {
    let state: SessionState = startSession("c-1", "install-1", "0.1.0", activityPlan);
    state = completeSession(state);
    const outcome = await commitAttemptThenAdvance(
      state,
      {
        eventId: "evt-3",
        result: "correct",
        hintCount: 0,
        durationMs: 1000,
        dimension: "phonics",
        itemId: "w-cat",
        occurredAt: 1_700_000_000_000,
      },
      {
        appendAttempt: async () => ({ sourceSequence: 1 }),
        now: () => 1_700_000_000_000,
      },
    );
    expect(outcome.advance).toBe(false);
    expect(outcome.nextState.lastError).toMatch(/cannot-commit-in-phase-complete/);
  });

  it("pauseSession returns the session to the intro phase", () => {
    const state = startSession("c-1", "install-1", "0.1.0", activityPlan);
    const paused = pauseSession(state);
    expect(paused.phase).toBe("intro");
  });
});