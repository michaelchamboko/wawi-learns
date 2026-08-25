/**
 * Shared parent gate.
 *
 * Production Convex functions call `requireParent(ctx)` before any mutation or
 * sensitive query. The spike mirror is `convex/spikes/parent-context.ts`,
 * which is exercised by `tests/integration/convex/authorization.test.ts`.
 */
import type { AnyDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
export interface ParentContext {
  readonly parentId: string;
  readonly userId: string;
  readonly verifiedAt: number;
  readonly recentVerificationMs: number;
}

export const RECENT_VERIFICATION_WINDOW_MS = 10 * 60 * 1000;

export interface ParentAuthInput {
  readonly identity: { userId: string } | null;
  readonly parentRow: { _id: string; userId: string; verifiedAt: number } | null;
  readonly now?: () => number;
}

export class ParentAuthorizationError extends Error {
  readonly code:
    | "missing_identity"
    | "no_parent"
    | "stale_verification"
    | "deleted_profile";
  constructor(code: ParentAuthorizationError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export function requireParent(input: ParentAuthInput): ParentContext {
  if (!input.identity) {
    throw new ParentAuthorizationError("missing_identity", "sign-in required");
  }
  if (!input.parentRow) {
    throw new ParentAuthorizationError("no_parent", "parent record missing");
  }
  if (input.parentRow.userId !== input.identity.userId) {
    throw new ParentAuthorizationError("no_parent", "identity mismatch");
  }
  const now = input.now?.() ?? Date.now();
  if (now - input.parentRow.verifiedAt > RECENT_VERIFICATION_WINDOW_MS) {
    throw new ParentAuthorizationError(
      "stale_verification",
      "re-enter password to continue",
    );
  }
  return {
    parentId: input.parentRow._id,
    userId: input.parentRow.userId,
    verifiedAt: input.parentRow.verifiedAt,
    recentVerificationMs: now - input.parentRow.verifiedAt,
  };
}

export function assertOwnership(
  context: ParentContext,
  parentId: string,
): void {
  if (context.parentId !== parentId) {
    throw new ParentAuthorizationError("no_parent", "ownership mismatch");
  }
}

/** Runtime Convex gate used by the private-beta functions. */
type ParentRuntimeContext = GenericMutationCtx<AnyDataModel> | GenericQueryCtx<AnyDataModel>;
type ParentWriteRuntimeContext = GenericMutationCtx<AnyDataModel>;
type ParentId = Parameters<GenericMutationCtx<AnyDataModel>["db"]["patch"]>[0];
type ParentRow = { readonly _id: ParentId; readonly userId: string; readonly verifiedAt: number };
type ParentMatch = {
  readonly parentId: ParentId;
  readonly stableUserId: string;
  readonly existingUserId: string;
  readonly verifiedAt: number;
};

const buildParentMatchCandidates = async (
  ctx: ParentRuntimeContext,
): Promise<readonly ParentMatch[]> => {
  const stableUserId = await getAuthUserId(ctx);
  if (!stableUserId) {
    return [];
  }
  const parentRows = await ctx.db.query("parents").collect() as unknown as readonly ParentRow[];
  const legacyPattern = `${stableUserId}|`;
  return parentRows
    .filter((row) => row.userId === stableUserId || row.userId.startsWith(legacyPattern))
    .map((row) => ({
      parentId: row._id,
      stableUserId,
      existingUserId: row.userId,
      verifiedAt: row.verifiedAt,
    }));
};

export async function findAuthenticatedParent(
  ctx: ParentRuntimeContext,
): Promise<ParentContext | null> {
  const stableUserId = await getAuthUserId(ctx);
  if (!stableUserId) {
    throw new ParentAuthorizationError("missing_identity", "sign-in required");
  }
  const matches = await buildParentMatchCandidates(ctx);
  if (matches.length === 0) {
    return null;
  }
  if (matches.length > 1) {
    throw new ParentAuthorizationError("no_parent", `ambiguous parent records for user ${stableUserId}`);
  }
  const match = matches[0];
  const now = Date.now();
  return {
    parentId: match.parentId,
    userId: match.stableUserId,
    verifiedAt: match.verifiedAt,
    recentVerificationMs: now - match.verifiedAt,
  };
}

export async function requireAuthenticatedParent(ctx: ParentWriteRuntimeContext): Promise<ParentContext> {
  const stableUserId = await getAuthUserId(ctx);
  if (!stableUserId) {
    throw new ParentAuthorizationError("missing_identity", "sign-in required");
  }
  const matches = await buildParentMatchCandidates(ctx);
  if (matches.length === 0) {
    throw new ParentAuthorizationError("no_parent", "parent record missing");
  }
  if (matches.length > 1) {
    throw new ParentAuthorizationError("no_parent", `ambiguous parent records for user ${stableUserId}`);
  }
  const match = matches[0];
  if (match.existingUserId !== match.stableUserId) {
    await ctx.db.patch(match.parentId, { userId: stableUserId } as const);
  }
  return {
    parentId: match.parentId,
    userId: match.stableUserId,
    verifiedAt: match.verifiedAt,
    recentVerificationMs: Date.now() - match.verifiedAt,
  };
}

export async function requireRecentlyVerifiedParent(ctx: ParentWriteRuntimeContext): Promise<ParentContext> {
  const parent = await requireAuthenticatedParent(ctx);
  return requireParent({
    identity: { userId: parent.userId },
    parentRow: {
      _id: parent.parentId,
      userId: parent.userId,
      verifiedAt: parent.verifiedAt,
    },
    now: () => Date.now(),
  });
}
