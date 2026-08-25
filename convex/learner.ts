import { queryGeneric } from "convex/server";
import { findAuthenticatedParent } from "./lib/requireParent";
type ProfileRow = { readonly _id: string; readonly displayName: string };
type InstallationRow = { readonly childProfileId: string; readonly installationId: string };
type AttemptRow = { readonly result: string };
export const getCurrentLearnerHome = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const parent = await findAuthenticatedParent(ctx);
    if (!parent) return { profile: null, completedCount: 0 };
    const profile = await ctx.db.query("childProfiles").withIndex("byParent", (query) => query.eq("parentId", parent.parentId)).first() as unknown as ProfileRow | null;
    if (!profile) return { profile: null, completedCount: 0 };
    const installations = await ctx.db.query("installations").withIndex("byParent", (query) => query.eq("parentId", parent.parentId)).collect() as unknown as readonly InstallationRow[];
    const attempts = await Promise.all(installations.filter((installation) => installation.childProfileId === profile._id).map((installation) => ctx.db.query("attempts").withIndex("byInstallation", (query) => query.eq("installationId", installation.installationId)).collect() as unknown as Promise<readonly AttemptRow[]>));
    const completedCount = Math.min(attempts.flat().filter((attempt) => attempt.result === "correct").length, 5);
    return { profile: { _id: profile._id, displayName: profile.displayName }, completedCount };
  },
});
