import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { requireAuthenticatedParent } from "./lib/requireParent";

export const installationSnapshotFor = (parentId: string, childProfileId: string, installationId: string, issuedAt: number) => ({
  parentId,
  childProfileId,
  installationId,
  packVersion: "1.0.0",
  packDigest: "0000000000000000000000000000000000000000000000000000000000000000",
  issuedAt,
});

export const registerInstallation = mutationGeneric({
  args: { installationId: v.string() },
  handler: async (ctx, args) => {
    const parent = await requireAuthenticatedParent(ctx);
    const profile = await ctx.db.query("childProfiles").withIndex("byParent", (query) => query.eq("parentId", parent.parentId)).first();
    if (!profile) throw new Error("child profile missing");
    const existing = await ctx.db.query("installations").withIndex("byInstallation", (query) => query.eq("installationId", args.installationId)).unique();
    if (existing && (existing.parentId !== parent.parentId || existing.childProfileId !== profile._id)) throw new Error("installation ownership mismatch");
    const snapshot = installationSnapshotFor(parent.parentId, profile._id, args.installationId, Date.now());
    if (existing) { await ctx.db.patch(existing._id, { lastSeenAt: Date.now(), revokedAt: undefined, packVersion: snapshot.packVersion, packDigest: snapshot.packDigest }); return snapshot; }
    await ctx.db.insert("installations", { ...snapshot, lastSeenAt: Date.now() });
    return snapshot;
  },
});
