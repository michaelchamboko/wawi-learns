import { describe, expect, it } from "vitest";
import {
  transitionRevision,
  approveRevision,
  ALLOWED_TRANSITIONS,
  type RevisionRecord,
} from "../../../packages/learning-engine/src/index";

const rec = (state: RevisionRecord["state"], digest = "d0"): RevisionRecord => ({
  revisionId: "rev-1",
  digest,
  state,
});

describe("SLC-006-T002 — generated revision state (integration)", () => {
  it("allows the full happy-path lifecycle draft -> validated -> approved -> withdrawn", () => {
    let r = rec("draft", "d0");
    const v = transitionRevision(r, { revisionId: r.revisionId, expectedDigest: "d0", nextDigest: "d1", toState: "validated" });
    expect(v.ok).toBe(true);
    r = v.next!;
    const a = approveRevision(r, "d2");
    expect(a.ok).toBe(true);
    expect(a.next!.state).toBe("approved");
    const w = transitionRevision(a.next!, { revisionId: "rev-1", expectedDigest: "d2", nextDigest: "d3", toState: "withdrawn" });
    expect(w.ok).toBe(true);
    expect(w.next!.state).toBe("withdrawn");
  });

  it("rejects any transition outside ALLOWED_TRANSITIONS (fail-closed)", () => {
    for (const from of Object.keys(ALLOWED_TRANSITIONS) as RevisionRecord["state"][]) {
      for (const to of ["draft", "validated", "approved", "withdrawn"] as const) {
        if (ALLOWED_TRANSITIONS[from].includes(to)) continue;
        const r = rec(from, "d0");
        const out = transitionRevision(r, { revisionId: "rev-1", expectedDigest: "d0", nextDigest: "d1", toState: to });
        expect(out.ok).toBe(false);
        expect(out.error).toBe("transition-not-allowed");
        expect(out.next).toBeNull();
      }
    }
  });

  it("rejects an edit-after-approval as not allowed (immutable published revision)", () => {
    const r = rec("approved", "d2");
    const out = transitionRevision(r, { revisionId: "rev-1", expectedDigest: "d2", nextDigest: "d3", toState: "draft" });
    expect(out.ok).toBe(false);
    expect(out.error).toBe("transition-not-allowed");
  });

  it("enforces compare-and-set: a stale expected digest is rejected", () => {
    const r = rec("draft", "d0");
    const out = transitionRevision(r, { revisionId: "rev-1", expectedDigest: "STALE", nextDigest: "d1", toState: "validated" });
    expect(out.ok).toBe(false);
    expect(out.error).toBe("digest-mismatch");
    expect(out.next).toBeNull();
  });

  it("rejects an unknown revision id", () => {
    const out = transitionRevision(undefined, { revisionId: "missing", expectedDigest: "d0", nextDigest: "d1", toState: "validated" });
    expect(out.ok).toBe(false);
    expect(out.error).toBe("unknown-revision");
  });

  it("withdrawn is terminal: no further transitions permitted", () => {
    const r = rec("withdrawn", "d3");
    const out = transitionRevision(r, { revisionId: "rev-1", expectedDigest: "d3", nextDigest: "d4", toState: "draft" });
    expect(out.ok).toBe(false);
    expect(out.error).toBe("transition-not-allowed");
  });
});
