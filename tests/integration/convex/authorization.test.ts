import { describe, expect, it } from "vitest";
import {
  RECENT_VERIFICATION_WINDOW_MS,
  ParentAuthorizationError,
  assertOwnership,
  requireAuthenticatedParent,
  requireParent,
  requireRecentlyVerifiedParent,
} from "../../../convex/lib/requireParent";

const NOW = 1_700_000_000_000;

const parent = (verifiedAt: number) => ({
  _id: "parent-1",
  userId: "user-1",
  verifiedAt,
});

type ParentRow = { readonly _id: string; readonly userId: string; readonly verifiedAt: number };

const createAuthContext = (userIdentitySubject: string, parentRows: readonly ParentRow[]) => {
  const patches: Array<{ id: string; patch: Partial<ParentRow> }> = [];
  return {
    context: {
      auth: {
        getUserIdentity: async () => ({ subject: userIdentitySubject, email: null }),
      },
      db: {
        query: () => ({
          collect: async () => parentRows,
        }),
        patch: async (id: string, patch: Partial<ParentRow>) => {
          patches.push({ id, patch });
        },
      },
    },
    getPatches: () => patches,
  };
};

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

  it("migrates a unique legacy session-based parent record to stable user ownership", async () => {
    const { context, getPatches } = createAuthContext("stable-user|new-session", [
      { _id: "parent-1", userId: "stable-user|old-session", verifiedAt: NOW },
    ]);
    const result = await requireAuthenticatedParent(
      context as unknown as Parameters<typeof requireAuthenticatedParent>[0],
    );
    expect(result.userId).toBe("stable-user");
    expect(getPatches()).toHaveLength(1);
    expect(getPatches()[0]).toMatchObject({
      id: "parent-1",
      patch: { userId: "stable-user" },
    });
  });

  it("rejects ambiguous legacy parent rows instead of choosing one", async () => {
    const { context } = createAuthContext("stable-user|new-session", [
      { _id: "parent-1", userId: "stable-user|old-session", verifiedAt: NOW },
      { _id: "parent-2", userId: "stable-user|other-session", verifiedAt: NOW },
    ]);
    await expect(
      requireAuthenticatedParent(context as unknown as Parameters<typeof requireAuthenticatedParent>[0]),
    ).rejects.toThrowError(/ambiguous/i);
  });

  it("requires a recent parent verification for sensitive paths", async () => {
    const { context } = createAuthContext("stable-user|new-session", [
      { _id: "parent-1", userId: "stable-user", verifiedAt: NOW - RECENT_VERIFICATION_WINDOW_MS - 1 },
    ]);
    await expect(
      requireRecentlyVerifiedParent(context as unknown as Parameters<typeof requireAuthenticatedParent>[0]),
    ).rejects.toThrowError(/re-enter password/);
  });
});
