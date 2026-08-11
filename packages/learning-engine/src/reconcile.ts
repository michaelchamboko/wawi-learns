/**
 * Reconciliation (SLC-009-T002).
 * Revocation-first ordering: server withdrawal is applied before display.
 * Eviction + upload decisions are pure.
 */

export interface CanonicalEvent {
  readonly eventId: string;
  readonly installationId: string;
  readonly sourceSequence: number;
  readonly occurredAt: number;
}

export interface ReconcileDecision {
  readonly accepted: readonly string[];
  readonly deduped: readonly string[];
  readonly gap: boolean;
  readonly evicted: readonly string[];
  readonly revokedSeen: boolean;
}

export interface ReconcileInput {
  readonly batch: readonly CanonicalEvent[];
  readonly highestSourceSequenceByInstallation: ReadonlyMap<string, number>;
  readonly revokedInstallationIds: ReadonlySet<string>;
  readonly gapThreshold: number;
}

export const reconcileCanonicalState = (input: ReconcileInput): ReconcileDecision => {
  const sorted = [...input.batch].sort((a, b) => a.sourceSequence - b.sourceSequence);
  const accepted: string[] = [];
  const deduped: string[] = [];
  const evicted: string[] = [];
  let revokedSeen = false;
  let gap = false;
  const seen = new Set<string>();

  for (const event of sorted) {
    if (input.revokedInstallationIds.has(event.installationId)) {
      evicted.push(event.eventId);
      revokedSeen = true;
      continue;
    }
    if (seen.has(event.eventId)) {
      deduped.push(event.eventId);
      continue;
    }
    seen.add(event.eventId);
    const prior = input.highestSourceSequenceByInstallation.get(event.installationId) ?? 0;
    if (event.sourceSequence > prior + input.gapThreshold) {
      gap = true;
    }
    accepted.push(event.eventId);
  }

  return { accepted, deduped, gap, evicted, revokedSeen };
};