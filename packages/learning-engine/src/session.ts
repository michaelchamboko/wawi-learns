/**
 * Local activity session: durable-before-advance.
 *
 * The child UI commits the AttemptEvent into IndexedDB synchronously and only
 * then advances to the next activity. If the commit fails the session stays
 * paused with the same activity re-presented. The implementation is pure so
 * the contract is testable without a renderer.
 */
import type { AttemptEvent } from "../../local-data/src/types";

export type SessionPhase =
  | "intro"
  | "playing"
  | "feedback"
  | "complete";

export interface SessionState {
  readonly childProfileId: string;
  readonly installationId: string;
  readonly phase: SessionPhase;
  readonly activityPlan: { itemId: string; dimension: string; modality: string };
  readonly attemptsCommitted: number;
  readonly lastError: string | null;
  readonly clientVersion: string;
}

export interface CommitAttemptInput {
  readonly eventId: string;
  readonly result: AttemptEvent["result"];
  readonly hintCount: number;
  readonly durationMs: number;
  readonly dimension: AttemptEvent["dimension"];
  readonly itemId: string;
  readonly occurredAt: number;
}

export interface ActivityAttemptPlan {
  readonly itemId: string;
  readonly dimension: AttemptEvent["dimension"];
  readonly kind: string;
}

export interface CommitAttemptOutcome {
  readonly nextState: SessionState;
  readonly advance: boolean;
}

export interface CommitAttemptDependencies {
  readonly appendAttempt: (event: AttemptEvent) => Promise<{ sourceSequence: number }>;
  readonly now: () => number;
}

const initialState = (
  childProfileId: string,
  installationId: string,
  clientVersion: string,
  activityPlan: SessionState["activityPlan"],
): SessionState => ({
  childProfileId,
  installationId,
  phase: "playing",
  activityPlan,
  attemptsCommitted: 0,
  lastError: null,
  clientVersion,
});

export const startSession = (
  childProfileId: string,
  installationId: string,
  clientVersion: string,
  activityPlan: SessionState["activityPlan"],
): SessionState => initialState(childProfileId, installationId, clientVersion, activityPlan);

export const commitAttemptThenAdvance = async (
  state: SessionState,
  input: CommitAttemptInput,
  deps: CommitAttemptDependencies,
): Promise<CommitAttemptOutcome> => {
  if (state.phase !== "playing") {
    return {
      nextState: {
        ...state,
        lastError: `cannot-commit-in-phase-${state.phase}`,
      },
      advance: false,
    };
  }
  try {
    await deps.appendAttempt({
      eventId: input.eventId,
      installationId: state.installationId,
      sourceSequence: 0,
      occurredAt: input.occurredAt,
      recordedAt: deps.now(),
      dimension: input.dimension,
      itemId: input.itemId,
      result: input.result,
      hintCount: input.hintCount,
      durationMs: input.durationMs,
      clientVersion: state.clientVersion,
    });
    return {
      nextState: {
        ...state,
        phase: "feedback",
        attemptsCommitted: state.attemptsCommitted + 1,
        lastError: null,
      },
      advance: true,
    };
  } catch (error) {
    return {
      nextState: {
        ...state,
        lastError: error instanceof Error ? error.message : "commit-failed",
      },
      advance: false,
    };
  }
};

export const commitActivityAttemptThenAdvance = async (
  state: SessionState,
  activity: ActivityAttemptPlan,
  input: Omit<CommitAttemptInput, "dimension" | "itemId">,
  deps: CommitAttemptDependencies,
): Promise<CommitAttemptOutcome> =>
  commitAttemptThenAdvance(
    state,
    {
      ...input,
      dimension: activity.dimension,
      itemId: activity.itemId,
    },
    deps,
  );

export const cancelActivityAttempt = (
  state: SessionState,
  _activity: ActivityAttemptPlan,
  reason: "microphone-denied" | "offline" | "child-cancelled",
): CommitAttemptOutcome => ({
  nextState: {
    ...state,
    lastError: `cancelled:${reason}`,
  },
  advance: false,
});

export const completeSession = (state: SessionState): SessionState => ({
  ...state,
  phase: "complete",
});

export const pauseSession = (state: SessionState): SessionState => ({
  ...state,
  phase: "intro",
});