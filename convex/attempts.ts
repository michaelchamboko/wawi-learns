import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import { requireAuthenticatedParent } from "./lib/requireParent";

type InstallationRow = { readonly parentId: string; readonly revokedAt?: number };
type AttemptRow = { readonly installationId: string; readonly eventId: string; readonly sourceSequence: number };

const attemptEvent = v.object({
  eventId: v.string(), installationId: v.string(), sourceSequence: v.number(), occurredAt: v.number(), recordedAt: v.number(),
  dimension: v.string(), itemId: v.string(), result: v.string(), hintCount: v.number(), durationMs: v.number(), clientVersion: v.string(),
});

export const ingestAttempts = mutationGeneric({
  args: { events: v.array(attemptEvent) },
  handler: async (ctx, args) => {
    const parent = await requireAuthenticatedParent(ctx);
    const acceptedEventIds: string[] = [];
    const dedupedEventIds: string[] = [];
    let highestSourceSequence = 0;
    let gapDetected = false;
    for (const event of [...args.events].sort((left, right) => left.sourceSequence - right.sourceSequence)) {
      const installation = await ctx.db.query("installations").withIndex("byInstallation", (query) => query.eq("installationId", event.installationId)).unique() as unknown as InstallationRow | null;
      if (!installation || installation.parentId !== parent.parentId || installation.revokedAt) throw new Error("installation ownership mismatch");
      const known = await ctx.db.query("attempts").withIndex("byEventId", (query) => query.eq("eventId", event.eventId)).unique() as unknown as AttemptRow | null;
      if (known) { if (known.installationId !== event.installationId) throw new Error("event ownership mismatch"); dedupedEventIds.push(event.eventId); highestSourceSequence = Math.max(highestSourceSequence, known.sourceSequence); continue; }
      const prior = await ctx.db.query("attempts").withIndex("byInstallation", (query) => query.eq("installationId", event.installationId)).collect() as unknown as readonly AttemptRow[];
      const expected = prior.reduce((max, item) => Math.max(max, item.sourceSequence), 0) + 1;
      if (event.sourceSequence !== expected) { gapDetected = true; continue; }
      await ctx.db.insert("attempts", event);
      acceptedEventIds.push(event.eventId);
      highestSourceSequence = Math.max(highestSourceSequence, event.sourceSequence);
    }
    return { acceptedEventIds, dedupedEventIds, gapDetected, highestSourceSequence, canonicalProjectionDigest: `mvp-${highestSourceSequence}` };
  },
});
