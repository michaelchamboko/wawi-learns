/**
 * Shared parent gate.
 *
 * Production Convex functions call `requireParent(ctx)` before any mutation or
 * sensitive query. The spike mirror is `convex/spikes/parent-context.ts`,
 * which is exercised by `tests/integration/convex/authorization.test.ts`.
 */
import type { AnyDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
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
type ParentRow = { readonly _id: string; readonly userId: string; readonly verifiedAt: number };

export async function requireAuthenticatedParent(ctx: ParentRuntimeContext): Promise<ParentContext> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ParentAuthorizationError("missing_identity", "sign-in required");
  }
  const parentRows = await ctx.db.query("parents").collect() as unknown as readonly ParentRow[];
  const parentRow = parentRows.find((row) => row.userId === identity.subject) ?? null;
  if (!parentRow) {
    throw new ParentAuthorizationError("no_parent", "parent record missing");
  }
  return {
    parentId: parentRow._id,
    userId: identity.subject,
    verifiedAt: parentRow.verifiedAt,
    recentVerificationMs: Date.now() - parentRow.verifiedAt,
  };
}
