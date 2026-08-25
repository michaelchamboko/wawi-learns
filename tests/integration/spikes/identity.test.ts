import { describe, expect, it } from "vitest";
import {
  RECENT_VERIFICATION_WINDOW_MS,
  ParentAuthorizationError,
  requireParent,
} from "../../../convex/lib/requireParent";

const NOW = 1_700_000_000_000;

const parent = (verifiedAt: number) => ({
  _id: "parent-1",
  userId: "user-1",
  verifiedAt,
});

describe("SLC-001-T004 — identity spike", () => {
  it("accepts a matching recently verified parent", () => {
    const context = requireParent({
      identity: { userId: "user-1" },
      parentRow: parent(NOW - 1_000),
      now: () => NOW,
    });

    expect(context).toMatchObject({
      parentId: "parent-1",
      userId: "user-1",
      recentVerificationMs: 1_000,
    });
  });

  it("fails closed at the recent-verification boundary", () => {
    expect(() =>
      requireParent({
        identity: { userId: "user-1" },
        parentRow: parent(NOW - RECENT_VERIFICATION_WINDOW_MS - 1),
        now: () => NOW,
      }),
    ).toThrowError(/re-enter password/);
  });

  it("rejects missing identity without a network dependency", () => {
    expect(() =>
      requireParent({
        identity: null,
        parentRow: parent(NOW),
        now: () => NOW,
      }),
    ).toThrowError(ParentAuthorizationError);
  });
});
