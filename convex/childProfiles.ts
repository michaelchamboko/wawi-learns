import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { findAuthenticatedParent, requireRecentlyVerifiedParent } from "./lib/requireParent";
import { getAuthUserId } from "@convex-dev/auth/server";

type ParentRow = { readonly _id: string; readonly userId: string };
type ParentContext = { readonly parentId: string; readonly userId: string };

const getOrCreateParent = async (ctx: Parameters<typeof requireRecentlyVerifiedParent>[0]) => {
  const existingParent = await findAuthenticatedParent(ctx);
  if (existingParent) {
    await requireRecentlyVerifiedParent(ctx);
    return { parentId: existingParent.parentId, userId: existingParent.userId } as const satisfies ParentContext;
  }
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("sign-in required");
  }
  const identity = await ctx.auth.getUserIdentity();
  const parentId = await ctx.db.insert("parents", {
    userId,
    email: identity?.email ?? "",
    verifiedAt: Date.now(),
    createdAt: Date.now(),
  });
  const parent = await ctx.db.get(parentId) as unknown as ParentRow;
  return { parentId: parent._id, userId } as const satisfies ParentContext;
};

export const createOnlyChildProfile = mutationGeneric({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const parent = await getOrCreateParent(ctx);
    const name = args.displayName.trim();
    if (!name || name.length > 40) throw new Error("Please enter a first name.");
    const existing = await ctx.db.query("childProfiles").withIndex("byParent", (query) => query.eq("parentId", parent.parentId)).first();
    if (existing) throw new Error("This parent account already has a child profile.");
    return ctx.db.insert("childProfiles", { parentId: parent.parentId, displayName: name, yearGroup: "reception", createdAt: Date.now(), targetDailyMinutes: 20 });
  },
});
