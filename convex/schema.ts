/**
 * Convex schema (SLC-002 production boundary).
 * The spike convex/spikes/sync.ts reads the same field names; production mutations
 * additionally call `requireParent(ctx)`.
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  parents: defineTable({
    userId: v.string(),
    email: v.string(),
    verifiedAt: v.number(),
    createdAt: v.number(),
  }).index("byUserId", ["userId"]),

  childProfiles: defineTable({
    parentId: v.id("parents"),
    displayName: v.string(),
    yearGroup: v.union(v.literal("reception"), v.literal("year1")),
    createdAt: v.number(),
    targetDailyMinutes: v.number(),
    activeAssessmentCandidateId: v.optional(v.id("assessmentCandidates")),
  }).index("byParent", ["parentId"]),

  installations: defineTable({
    parentId: v.id("parents"),
    childProfileId: v.id("childProfiles"),
    installationId: v.string(),
    lastSeenAt: v.number(),
    packVersion: v.string(),
    packDigest: v.string(),
    revokedAt: v.optional(v.number()),
  })
    .index("byInstallation", ["installationId"])
    .index("byParent", ["parentId"]),

  attempts: defineTable({
    installationId: v.string(),
    eventId: v.string(),
    sourceSequence: v.number(),
    occurredAt: v.number(),
    recordedAt: v.number(),
    dimension: v.string(),
    itemId: v.string(),
    result: v.string(),
    hintCount: v.number(),
    durationMs: v.number(),
    clientVersion: v.string(),
  })
    .index("byInstallation", ["installationId"])
    .index("byEventId", ["eventId"]),

  assessmentCandidates: defineTable({
    parentId: v.id("parents"),
    childProfileId: v.id("childProfiles"),
    version: v.number(),
    baselineVersion: v.string(),
    status: v.union(v.literal("open"), v.literal("completed"), v.literal("incomplete")),
    parentEstimate: v.union(v.literal("new"), v.literal("some"), v.literal("unsure")),
    targetItems: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("byChild", ["childProfileId"])
    .index("byParentChild", ["parentId", "childProfileId"]),

  assessmentAttempts: defineTable({
    candidateId: v.id("assessmentCandidates"),
    parentId: v.id("parents"),
    childProfileId: v.id("childProfiles"),
    sequence: v.number(),
    dimension: v.string(),
    itemId: v.string(),
    result: v.union(v.literal("correct"), v.literal("incorrect"), v.literal("partial"), v.literal("skipped")),
    occurredAt: v.number(),
  })
    .index("byCandidate", ["candidateId"]),
});
