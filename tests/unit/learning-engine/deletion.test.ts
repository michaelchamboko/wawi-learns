import { describe, expect, it } from "vitest";
import { initialDeletionState, nextDeletionStep } from "../../../packages/learning-engine/src/deletion";

describe("SLC-008-T005 — deletion and consent", () => {
  it("walks the full deletion state machine and lands on complete", () => {
    let state = initialDeletionState("child-1");
    const order: ReturnType<typeof nextDeletionStep>["steps"] = [
      "consent-revoked",
      "pending-events-cancelled",
      "server-marked",
      "local-purged",
      "queue-evicted",
      "overlay-evicted",
      "complete",
    ] as const;
    for (const step of order) {
      state = nextDeletionStep(state, step as never);
    }
    expect(state.failureReason).toBeNull();
    expect(state.completedAt).not.toBeNull();
    expect(state.steps).toEqual(order);
  });

  it("rejects out-of-order steps and records the failure", () => {
    let state = initialDeletionState("child-1");
    state = nextDeletionStep(state, "consent-revoked");
    state = nextDeletionStep(state, "local-purged");
    expect(state.failureReason).toBe("out-of-order:local-purged");
  });

  it("treats replayed steps as idempotent", () => {
    let state = initialDeletionState("child-1");
    state = nextDeletionStep(state, "consent-revoked");
    const replayed = nextDeletionStep(state, "consent-revoked");
    expect(replayed).toBe(state);
  });

  it("refuses unknown step names and reports them", () => {
    const state = initialDeletionState("child-1");
    const failed = nextDeletionStep(state, "nuke-from-orbit" as never);
    expect(failed.failureReason).toMatch(/unknown-step/);
  });
});
