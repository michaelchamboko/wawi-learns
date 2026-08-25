import { describe, expect, it } from "vitest";
import {
  RECENT_VERIFICATION_WINDOW_MS,
  requireParent,
} from "../../../convex/lib/requireParent";

const NOW = 1_700_000_000_000;

describe("SLC-002-T002 — parent auth guards", () => {
  it("denies missing identity, cross-parent identity and stale verification", () => {
    const parent = { _id: "parent-1", userId: "user-1", verifiedAt: NOW };

    expect(() => requireParent({ identity: null, parentRow: parent, now: () => NOW }))
      .toThrowError(/sign-in required/);
    expect(() => requireParent({ identity: { userId: "user-2" }, parentRow: parent, now: () => NOW }))
      .toThrowError(/identity mismatch/);
    expect(() => requireParent({
      identity: { userId: "user-1" },
      parentRow: { ...parent, verifiedAt: NOW - RECENT_VERIFICATION_WINDOW_MS - 1 },
      now: () => NOW,
    })).toThrowError(/re-enter password/);
  });
});
