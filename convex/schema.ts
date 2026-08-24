/**
 * Convex schema (SLC-002 production boundary).
 * The spike convex/spikes/sync.ts reads the same field names; production mutations
 * additionally call `requireParent(ctx)`.
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
  }).index("byParent", ["parentId"]),

  installations: defineTable({
    parentId: v.id("parents"),
    childProfileId: v.id("childProfiles"),
    installationId: v.string(),
    lastSeenAt: v.number(),
    packVersion: v.string(),
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
});