import { describe, expect, it, vi } from "vitest";
import {
  commitAttemptThenAdvance,
  startSession,
  type SessionState,
} from "../../../packages/learning-engine/src/session";
import type { AttemptEvent } from "../../../packages/local-data/src";

const plan = { itemId: "w-cat", dimension: "phonics", modality: "picture-word" } as const;

const baseEvent = (over: Partial<Parameters<typeof commitAttemptThenAdvance>[1]> = {}) => ({
  eventId: "ev-1",
  result: "correct" as const,
  hintCount: 0,
  durationMs: 1000,
  dimension: "phonics" as const,
  itemId: "w-cat",
  occurredAt: 1_700_000_000_000,
  ...over,
});

const deps = (appendAttempt: (e: AttemptEvent) => Promise<{ sourceSequence: number }>) => ({
  appendAttempt,
  now: () => 1_700_000_000_000,
});

describe("SLC-004-T005 — attempt flow (durable-before-advance)", () => {
  it("starts a playing session", () => {
    const state = startSession("c-1", "web-1", "0.1.0", plan);
    expect(state.phase).toBe("playing");
    expect(state.attemptsCommitted).toBe(0);
  });

  it("commits the attempt then advances only after the store accepts it", async () => {
    const appendAttempt = vi.fn(async () => ({ sourceSequence: 1 }));
    const state = startSession("c-1", "web-1", "0.1.0", plan);
    const outcome = await commitAttemptThenAdvance(state, baseEvent(), deps(appendAttempt));
    expect(appendAttempt).toHaveBeenCalledTimes(1);
    expect(outcome.advance).toBe(true);
    expect(outcome.nextState.phase).toBe("feedback");
    expect(outcome.nextState.attemptsCommitted).toBe(1);
    expect(outcome.nextState.lastError).toBeNull();
  });

  it("does not advance and keeps the activity when the commit fails (resumable)", async () => {
    const appendAttempt = vi.fn(async () => {
      throw new Error("indexeddb-unavailable");
    });
    const state = startSession("c-1", "web-1", "0.1.0", plan);
    const outcome = await commitAttemptThenAdvance(state, baseEvent(), deps(appendAttempt));
    expect(outcome.advance).toBe(false);
    expect(outcome.nextState.phase).toBe("playing"); // stays, re-presented
    expect(outcome.nextState.lastError).toBe("indexeddb-unavailable");
  });

  it("refuses to commit when not in the playing phase", async () => {
    const appendAttempt = vi.fn(async () => ({ sourceSequence: 1 }));
    const state: SessionState = { ...startSession("c-1", "web-1", "0.1.0", plan), phase: "feedback" };
    const outcome = await commitAttemptThenAdvance(state, baseEvent(), deps(appendAttempt));
    expect(outcome.advance).toBe(false);
    expect(appendAttempt).not.toHaveBeenCalled();
    expect(outcome.nextState.lastError).toBe("cannot-commit-in-phase-feedback");
  });
});
