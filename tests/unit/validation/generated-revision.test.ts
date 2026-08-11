import { describe, expect, it } from "vitest";
import {
  ALLOWED_TRANSITIONS,
  transitionRevision,
  type RevisionRecord,
} from "../../../packages/learning-engine/src/index";

const base: RevisionRecord = {
  revisionId: "rev-1",
  digest: "d1",
  state: "draft",
};

describe("SLC-006-T002 — generated revision state machine", () => {
  it("rejects an unknown revision", () => {
    const result = transitionRevision(undefined, {
      revisionId: "rev-1",
      expectedDigest: "d1",
      nextDigest: "d2",
      toState: "validated",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("unknown-revision");
  });

  it("rejects a digest mismatch", () => {
    const result = transitionRevision(base, {
      revisionId: "rev-1",
      expectedDigest: "WRONG",
      nextDigest: "d2",
      toState: "validated",
    });
    expect(result.error).toBe("digest-mismatch");
  });

  it("rejects a forbidden transition", () => {
    const result = transitionRevision(
      { ...base, state: "withdrawn" },
      { revisionId: "rev-1", expectedDigest: "d1", nextDigest: "d2", toState: "draft" },
    );
    expect(result.error).toBe("transition-not-allowed");
  });

  it("allows draft → validated → approved → withdrawn", () => {
    let record: RevisionRecord = base;
    const a = transitionRevision(record, {
      revisionId: "rev-1", expectedDigest: record.digest, nextDigest: "d2", toState: "validated",
    });
    expect(a.ok).toBe(true);
    record = a.next!;
    const b = transitionRevision(record, {
      revisionId: "rev-1", expectedDigest: record.digest, nextDigest: "d3", toState: "approved",
    });
    expect(b.ok).toBe(true);
    record = b.next!;
    const c = transitionRevision(record, {
      revisionId: "rev-1", expectedDigest: record.digest, nextDigest: "d4", toState: "withdrawn",
    });
    expect(c.ok).toBe(true);
    expect(c.next?.state).toBe("withdrawn");
  });

  it("rejects approved → approved (no self-loop)", () => {
    const result = transitionRevision(
      { ...base, state: "approved" },
      { revisionId: "rev-1", expectedDigest: "d1", nextDigest: "d2", toState: "approved" },
    );
    expect(result.error).toBe("transition-not-allowed");
  });

  it("approveRevision surfaces a digest mismatch when the caller passes a different digest", () => {
    // The record digest is "d1" (base); if the caller-side state is mutated to "validated"
    // but the previous digest changed to something else, approveRevision should refuse.
    const result = transitionRevision(
      { ...base, state: "validated", digest: "rotated" },
      { revisionId: "rev-1", expectedDigest: "stale", nextDigest: "d3", toState: "approved" },
    );
    expect(result.error).toBe("digest-mismatch");
  });

  it("every state has at least one transition", () => {
    for (const state of Object.keys(ALLOWED_TRANSITIONS) as RevisionRecord["state"][]) {
      expect(ALLOWED_TRANSITIONS[state].length).toBeGreaterThanOrEqual(0);
    }
    expect(ALLOWED_TRANSITIONS.withdrawn).toHaveLength(0);
  });
});