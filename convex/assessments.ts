import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { findAuthenticatedParent, requireAuthenticatedParent } from "./lib/requireParent";

const estimate = v.union(v.literal("new"), v.literal("some"), v.literal("unsure"));
const result = v.union(v.literal("correct"), v.literal("incorrect"), v.literal("partial"), v.literal("skipped"));

const REQUIRED_DIMENSIONS = new Set(["phonics", "spelling", "reading", "maths"]);

export const assessmentHasRequiredCoverage = (dimensions: readonly string[]) =>
  [...REQUIRED_DIMENSIONS].every((dimension) => dimensions.includes(dimension));

export const getCurrentAssessment = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const parent = await findAuthenticatedParent(ctx);
    if (!parent) return { profile: null, candidate: null, attempts: [] };
    const child = await ctx.db.query("childProfiles").withIndex("byParent", (q) => q.eq("parentId", parent.parentId)).first();
    if (!child) return { profile: null, candidate: null, attempts: [] };
    const candidate = await ctx.db.query("assessmentCandidates").withIndex("byChild", (q) => q.eq("childProfileId", child._id)).collect();
    const current = [...candidate].sort((a, b) => b.version - a.version)[0] ?? null;
    const attempts = current
      ? await ctx.db.query("assessmentAttempts").withIndex("byCandidate", (q) => q.eq("candidateId", current._id)).collect()
      : [];
    return { profile: { _id: child._id, displayName: child.displayName }, candidate: current, attempts };
  },
});

export const startAssessment = mutationGeneric({
  args: { childProfileId: v.id("childProfiles"), parentEstimate: estimate },
  handler: async (ctx, args) => {
    const parent = await requireAuthenticatedParent(ctx);
    const child = await ctx.db.get(args.childProfileId);
    if (!child || child.parentId !== parent.parentId) throw new Error("child ownership mismatch");
    const prior = await ctx.db.query("assessmentCandidates").withIndex("byChild", (q) => q.eq("childProfileId", args.childProfileId)).collect();
    return ctx.db.insert("assessmentCandidates", {
      parentId: parent.parentId,
      childProfileId: args.childProfileId,
      version: prior.length + 1,
      baselineVersion: "baseline-1",
      status: "open",
      parentEstimate: args.parentEstimate,
      targetItems: 20,
      startedAt: Date.now(),
    });
  },
});

export const recordAssessmentAttempt = mutationGeneric({
  args: { candidateId: v.id("assessmentCandidates"), dimension: v.string(), itemId: v.string(), result },
  handler: async (ctx, args) => {
    const parent = await requireAuthenticatedParent(ctx);
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate || candidate.parentId !== parent.parentId || candidate.status !== "open") throw new Error("assessment ownership mismatch");
    const attempts = await ctx.db.query("assessmentAttempts").withIndex("byCandidate", (q) => q.eq("candidateId", args.candidateId)).collect();
    await ctx.db.insert("assessmentAttempts", {
      candidateId: candidate._id,
      parentId: parent.parentId,
      childProfileId: candidate.childProfileId,
      sequence: attempts.length + 1,
      dimension: args.dimension,
      itemId: args.itemId,
      result: args.result,
      occurredAt: Date.now(),
    });
    const dimensions = [...attempts.map((attempt) => attempt.dimension), args.dimension];
    if (assessmentHasRequiredCoverage(dimensions)) {
      await ctx.db.patch(candidate._id, { status: "completed", completedAt: Date.now() });
      await ctx.db.patch(candidate.childProfileId, { activeAssessmentCandidateId: candidate._id });
    }
    return { sequence: attempts.length + 1 };
  },
});

export const skipAssessment = mutationGeneric({
  args: { candidateId: v.id("assessmentCandidates") },
  handler: async (ctx, args) => {
    const parent = await requireAuthenticatedParent(ctx);
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate || candidate.parentId !== parent.parentId || candidate.status !== "open") throw new Error("assessment ownership mismatch");
    await ctx.db.patch(candidate._id, { status: "incomplete", completedAt: Date.now() });
  },
});
