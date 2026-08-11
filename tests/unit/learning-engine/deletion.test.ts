import { describe, expect, it } from "vitest";
import {
  initialDeletionState,
  nextDeletionStep,
  type DeletionStep,
} from "../../../packages/learning-engine/src/index";

const ORDER: readonly DeletionStep[] = [
  "consent-revoked",
  "pending-events-cancelled",
  "server-marked",
  "local-purged",
  "queue-evicted",
  "overlay-evicted",
  "complete",
];

describe("SLC-008-T005 — deletion state machine", () => {
  it("walks through every step in order", () => {
    let state = initialDeletionState("child-1");
    for (const step of ORDER) {
      state = nextDeletionStep(state, step);
      expect(state.steps[state.steps.length - 1]).toBe(step);
    }
    expect(state.completedAt).not.toBeNull();
  });

  it("rejects an out-of-order step", () => {
    const state = nextDeletionStep(initialDeletionState("child-1"), "server-marked");
    expect(state.failureReason).toMatch(/out-of-order/);
  });

  it("rejects an unknown step", () => {
    const state = nextDeletionStep(initialDeletionState("child-1"), "garbage" as DeletionStep);
    expect(state.failureReason).toMatch(/unknown-step/);
  });

  it("is idempotent for repeated step calls", () => {
    let state = initialDeletionState("child-1");
    state = nextDeletionStep(state, "consent-revoked");
    const a = nextDeletionStep(state, "consent-revoked");
    expect(a).toBe(state);
  });
});