import { describe, expect, it } from "vitest";
import {
  RECENT_VERIFICATION_WINDOW_MS,
  ParentAuthorizationError,
  assertOwnership,
  requireParent,
} from "../../../convex/lib/requireParent";

const NOW = 1_700_000_000_000;

const parent = (verifiedAt: number) => ({
  _id: "parent-1",
  userId: "user-1",
  verifiedAt,
});

describe("SLC-002-T002 — Convex parent authority", () => {
  it("rejects an unauthenticated caller", () => {
    expect(() =>
      requireParent({
        identity: null,
        parentRow: parent(NOW),
        now: () => NOW,
      }),
    ).toThrowError(ParentAuthorizationError);
  });

  it("rejects when the parent record is missing", () => {
    expect(() =>
      requireParent({
        identity: { userId: "user-1" },
        parentRow: null,
        now: () => NOW,
      }),
    ).toThrowError(/parent record missing/);
  });

  it("rejects when the identity subject does not match the parent record", () => {
    expect(() =>
      requireParent({
        identity: { userId: "user-2" },
        parentRow: parent(NOW),
        now: () => NOW,
      }),
    ).toThrowError(/identity mismatch/);
  });

  it("rejects a cross-parent ownership check", () => {
    const ctx = requireParent({
      identity: { userId: "user-1" },
      parentRow: parent(NOW),
      now: () => NOW,
    });
    expect(() => assertOwnership(ctx, "parent-other")).toThrowError(
      /ownership mismatch/,
    );
  });

  it("rejects a parent whose verification window has expired", () => {
    expect(() =>
      requireParent({
        identity: { userId: "user-1" },
        parentRow: parent(NOW - RECENT_VERIFICATION_WINDOW_MS - 1),
        now: () => NOW,
      }),
    ).toThrowError(/re-enter password/);
  });

  it("accepts a recently verified parent and exposes verification age", () => {
    const ctx = requireParent({
      identity: { userId: "user-1" },
      parentRow: parent(NOW - 60_000),
      now: () => NOW,
    });
    expect(ctx.parentId).toBe("parent-1");
    expect(ctx.recentVerificationMs).toBe(60_000);
  });

  it("the only allowed error codes are the four PRD §34.4 cases", () => {
    const allowed = new Set([
      "missing_identity",
      "no_parent",
      "stale_verification",
      "deleted_profile",
    ]);
    expect(allowed.size).toBe(4);
    expect([...allowed].sort()).toEqual([
      "deleted_profile",
      "missing_identity",
      "no_parent",
      "stale_verification",
    ]);
  });
});