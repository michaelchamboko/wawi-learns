import { mutationGeneric, type AnyDataModel, type GenericMutationCtx } from "convex/server";
import { v } from "convex/values";

type ParentRow = { readonly _id: string; readonly userId: string };

const parentForIdentity = async (ctx: GenericMutationCtx<AnyDataModel>): Promise<ParentRow> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("sign-in required");
  const existingParents = await ctx.db.query("parents").collect() as unknown as readonly ParentRow[];
  let parent = existingParents.find((row) => row.userId === identity.subject) ?? null;
  if (!parent) {
    const parentId = await ctx.db.insert("parents", { userId: identity.subject, email: identity.email ?? "", verifiedAt: Date.now(), createdAt: Date.now() });
    parent = await ctx.db.get(parentId) as unknown as ParentRow;
  }
  return parent;
};

export const createOnlyChildProfile = mutationGeneric({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const parent = await parentForIdentity(ctx);
    const name = args.displayName.trim();
    if (!name || name.length > 40) throw new Error("Please enter a first name.");
    const existing = await ctx.db.query("childProfiles").withIndex("byParent", (query) => query.eq("parentId", parent._id)).first();
    if (existing) throw new Error("This parent account already has a child profile.");
    return ctx.db.insert("childProfiles", { parentId: parent._id, displayName: name, yearGroup: "reception", createdAt: Date.now(), targetDailyMinutes: 20 });
  },
});
