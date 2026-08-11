/**
 * Spike contract: immutable AttemptEvent and SyncReceipt types.
 * SLC-001-T003 owns these definitions as the local-sync spike boundary.
 * The production contract in SLC-002 is additive on top of these types.
 */
export type AttemptDimension = "phonics" | "spelling" | "reading" | "maths" | "tracing" | "speech";

export type AttemptResult = "correct" | "incorrect" | "partial" | "skipped";

export interface AttemptEvent {
  readonly eventId: string;
  readonly installationId: string;
  readonly sourceSequence: number;
  readonly occurredAt: number;
  readonly recordedAt: number;
  readonly dimension: AttemptDimension;
  readonly itemId: string;
  readonly result: AttemptResult;
  readonly hintCount: number;
  readonly durationMs: number;
  readonly clientVersion: string;
}

export interface SyncReceipt {
  readonly acceptedEventIds: readonly string[];
  readonly dedupedEventIds: readonly string[];
  readonly gapDetected: boolean;
  readonly highestSourceSequence: number;
  readonly canonicalProjectionDigest: string;
}

export interface SyncConflictError {
  readonly code:
    | "duplicate-event"
    | "out-of-order-gap"
    | "implausible-time"
    | "deleted-profile"
    | "schema-mismatch";
  readonly eventId: string;
  readonly detail: string;
}