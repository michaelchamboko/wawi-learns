/**
 * Generated revision state machine (SLC-006-T002).
 * The state transitions are compare-and-set: the caller must pass the
 * expected current digest; any mismatch returns a typed error.
 */
import { z } from "zod";

export const GeneratedRevisionStateSchema = z.enum([
  "draft",
  "validated",
  "approved",
  "withdrawn",
]);

export type GeneratedRevisionState = z.infer<typeof GeneratedRevisionStateSchema>;

export const ALLOWED_TRANSITIONS: Record<GeneratedRevisionState, readonly GeneratedRevisionState[]> = {
  draft: ["validated", "withdrawn"],
  validated: ["draft", "approved", "withdrawn"],
  approved: ["withdrawn"],
  withdrawn: [],
};

export interface RevisionTransitionInput {
  readonly revisionId: string;
  readonly expectedDigest: string;
  readonly nextDigest: string;
  readonly toState: GeneratedRevisionState;
}

export type TransitionError =
  | "unknown-revision"
  | "digest-mismatch"
  | "transition-not-allowed";

export interface RevisionRecord {
  readonly revisionId: string;
  readonly digest: string;
  readonly state: GeneratedRevisionState;
}

export interface TransitionResult {
  readonly ok: boolean;
  readonly next: RevisionRecord | null;
  readonly error: TransitionError | null;
}

const areDigestsEqual = (a: string, b: string): boolean =>
  a.length === b.length && a === b;

export const transitionRevision = (
  record: RevisionRecord | undefined,
  input: RevisionTransitionInput,
): TransitionResult => {
  if (!record) {
    return { ok: false, next: null, error: "unknown-revision" };
  }
  if (!areDigestsEqual(record.digest, input.expectedDigest)) {
    return { ok: false, next: null, error: "digest-mismatch" };
  }
  if (!ALLOWED_TRANSITIONS[record.state].includes(input.toState)) {
    return { ok: false, next: null, error: "transition-not-allowed" };
  }
  return {
    ok: true,
    next: {
      revisionId: record.revisionId,
      digest: input.nextDigest,
      state: input.toState,
    },
    error: null,
  };
};

export const approveRevision = (
  record: RevisionRecord,
  nextDigest: string,
): TransitionResult =>
  transitionRevision(record, {
    revisionId: record.revisionId,
    expectedDigest: record.digest,
    nextDigest,
    toState: "approved",
  });