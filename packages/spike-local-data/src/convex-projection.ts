/**
 * In-memory Convex-style dedupe projection used by the SLC-001-T003 spike.
 * Mirrors what the real Convex function will do server-side: keyed deduplication,
 * source-sequence gap detection, occurrence-time preservation, and an opaque
 * digest of the canonical projection so a client can compare canonical state.
 */
import type { AttemptEvent, SyncReceipt } from "./types.js";

export interface ProjectCanonicalOptions {
  readonly now?: () => number;
  readonly maxSkewMs?: number;
}

const DEFAULT_MAX_SKEW_MS = 5 * 60 * 1000;

export class InMemoryConvexProjection {
  private readonly canonical = new Map<string, AttemptEvent>();
  private readonly accepted = new Set<string>();
  private readonly highestByInstallation = new Map<string, number>();
  private readonly now: () => number;
  private readonly maxSkewMs: number;

  constructor(options: ProjectCanonicalOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.maxSkewMs = options.maxSkewMs ?? DEFAULT_MAX_SKEW_MS;
  }

  async reconcile(batch: readonly AttemptEvent[]): Promise<SyncReceipt> {
    const sorted = [...batch].sort((a, b) => a.sourceSequence - b.sourceSequence);
    const accepted: string[] = [];
    const deduped: string[] = [];
    let gap = false;
    let highest = 0;

    for (const event of sorted) {
      if (this.accepted.has(event.eventId)) {
        deduped.push(event.eventId);
        continue;
      }
      const prior = this.highestByInstallation.get(event.installationId) ?? 0;
      if (event.sourceSequence > prior + 1) {
        gap = true;
      }
      const skew = Math.abs(event.occurredAt - this.now());
      if (skew > this.maxSkewMs) {
        throw new Error(
          `reconcile: event ${event.eventId} occurredAt=${event.occurredAt} skew=${skew}ms exceeds ${this.maxSkewMs}ms`,
        );
      }
      this.canonical.set(event.eventId, event);
      this.accepted.add(event.eventId);
      this.highestByInstallation.set(event.installationId, Math.max(prior, event.sourceSequence));
      highest = Math.max(highest, event.sourceSequence);
      accepted.push(event.eventId);
    }

    const digest = await canonicalDigest(this.canonical);
    return {
      acceptedEventIds: accepted,
      dedupedEventIds: deduped,
      gapDetected: gap,
      highestSourceSequence: highest,
      canonicalProjectionDigest: digest,
    };
  }

  snapshot(): readonly AttemptEvent[] {
    return [...this.canonical.values()].sort((a, b) => a.sourceSequence - b.sourceSequence);
  }
}

export async function canonicalDigest(
  events: ReadonlyMap<string, AttemptEvent> | readonly AttemptEvent[],
): Promise<string> {
  const list = events instanceof Map ? [...events.values()] : [...events];
  list.sort((a, b) => a.sourceSequence - b.sourceSequence);
  const text = JSON.stringify(list, (_key, value) => value);
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(hash);
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}