/**
 * Release rollback state machine (SLC-009-T005).
 * Pure, deterministic. A rollback keeps the last known-good version
 * active and never deletes attempts; smoke is the pre-promote gate.
 */
export type RollbackStage =
  | "idle"
  | "promoting"
  | "smoke-pending"
  | "live"
  | "rollback-pending"
  | "rolled-back";

export interface RollbackState {
  readonly stage: RollbackStage;
  readonly activeVersion: string;
  readonly lastKnownGood: string;
  readonly smokePassed: boolean;
  readonly attemptsPreserved: boolean;
}

export const initialRollbackState = (version: string): RollbackState => ({
  stage: "idle",
  activeVersion: version,
  lastKnownGood: version,
  smokePassed: false,
  attemptsPreserved: true,
});

export const promote = (state: RollbackState, candidate: string): RollbackState => ({
  ...state,
  stage: "promoting",
  activeVersion: candidate,
  lastKnownGood: state.activeVersion,
});

export const runSmoke = (state: RollbackState, passed: boolean): RollbackState => ({
  ...state,
  stage: passed ? "live" : "smoke-pending",
  smokePassed: passed,
});

export const beginRollback = (state: RollbackState): RollbackState => ({
  ...state,
  stage: "rollback-pending",
});

export const finishRollback = (state: RollbackState): RollbackState => ({
  ...state,
  stage: "rolled-back",
  activeVersion: state.lastKnownGood,
  attemptsPreserved: true,
});

export const ROLLBACK_FLOW: ReadonlyArray<RollbackStage> = [
  "idle",
  "promoting",
  "smoke-pending",
  "live",
  "rollback-pending",
  "rolled-back",
];
