import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { requireAuthenticatedParent } from "./lib/requireParent";

export const registerInstallation = mutationGeneric({
  args: { installationId: v.string() },
  handler: async (ctx, args) => {
    const parent = await requireAuthenticatedParent(ctx);
    const profile = await ctx.db.query("childProfiles").withIndex("byParent", (query) => query.eq("parentId", parent.parentId)).first();
    if (!profile) throw new Error("child profile missing");
    const existing = await ctx.db.query("installations").withIndex("byInstallation", (query) => query.eq("installationId", args.installationId)).unique();
    if (existing && (existing.parentId !== parent.parentId || existing.childProfileId !== profile._id)) throw new Error("installation ownership mismatch");
    if (existing) { await ctx.db.patch(existing._id, { lastSeenAt: Date.now(), revokedAt: undefined }); return existing.installationId; }
    await ctx.db.insert("installations", { parentId: parent.parentId, childProfileId: profile._id, installationId: args.installationId, lastSeenAt: Date.now(), packVersion: "mvp-1" });
    return args.installationId;
  },
});
