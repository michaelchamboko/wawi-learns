/**
 * Deletion contract (SLC-008-T005).
 * Pure, sequential, idempotent. Each step is observable so the production
 * Convex mutation can drive the same state machine.
 */
export type DeletionStep =
  | "consent-revoked"
  | "pending-events-cancelled"
  | "server-marked"
  | "local-purged"
  | "queue-evicted"
  | "overlay-evicted"
  | "complete";

export interface DeletionState {
  readonly childProfileId: string;
  readonly steps: readonly DeletionStep[];
  readonly completedAt: number | null;
  readonly failureReason: string | null;
}

export const initialDeletionState = (childProfileId: string): DeletionState => ({
  childProfileId,
  steps: [],
  completedAt: null,
  failureReason: null,
});

const ORDER: readonly DeletionStep[] = [
  "consent-revoked",
  "pending-events-cancelled",
  "server-marked",
  "local-purged",
  "queue-evicted",
  "overlay-evicted",
  "complete",
];

export const nextDeletionStep = (state: DeletionState, step: DeletionStep): DeletionState => {
  const idx = ORDER.indexOf(step);
  if (idx < 0) {
    return { ...state, failureReason: `unknown-step:${step}` };
  }
  const lastIndex = state.steps.length > 0 ? ORDER.indexOf(state.steps[state.steps.length - 1]!) : -1;
  if (lastIndex >= idx) {
    return state; // idempotent
  }
  if (lastIndex !== idx - 1) {
    return { ...state, failureReason: `out-of-order:${step}` };
  }
  const steps = [...state.steps, step];
  return {
    ...state,
    steps,
    completedAt: step === "complete" ? Date.now() : state.completedAt,
  };
};