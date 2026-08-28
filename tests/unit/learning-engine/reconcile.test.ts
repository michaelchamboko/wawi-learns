import { describe, expect, it } from "vitest";
import { reconcileCanonicalState, type CanonicalEvent } from "../../../packages/learning-engine/src/reconcile";

const event = (overrides: Partial<CanonicalEvent>): CanonicalEvent => ({
  eventId: overrides.eventId ?? "e",
  installationId: overrides.installationId ?? "install-1",
  sourceSequence: overrides.sourceSequence ?? 1,
  occurredAt: overrides.occurredAt ?? 1_700_000_000_000,
});

describe("SLC-009-T002 — reconciliation, deletion and withdrawal", () => {
  it("accepts a clean ordered batch without gaps or duplication", () => {
    const batch = [event({ eventId: "a", sourceSequence: 1 }), event({ eventId: "b", sourceSequence: 2 })];
    const decision = reconcileCanonicalState({
      batch,
      highestSourceSequenceByInstallation: new Map(),
      revokedInstallationIds: new Set(),
      gapThreshold: 5,
    });
    expect(decision.accepted).toEqual(["a", "b"]);
    expect(decision.deduped).toEqual([]);
    expect(decision.evicted).toEqual([]);
    expect(decision.gap).toBe(false);
    expect(decision.revokedSeen).toBe(false);
  });

  it("detects sequence gaps beyond the threshold", () => {
    const batch = [event({ eventId: "a", sourceSequence: 1 }), event({ eventId: "b", sourceSequence: 12 })];
    const decision = reconcileCanonicalState({
      batch,
      highestSourceSequenceByInstallation: new Map(),
      revokedInstallationIds: new Set(),
      gapThreshold: 5,
    });
    expect(decision.gap).toBe(true);
  });

  it("evicts every event for a revoked installation before any display", () => {
    const batch = [
      event({ eventId: "a", installationId: "install-revoked", sourceSequence: 1 }),
      event({ eventId: "b", installationId: "install-revoked", sourceSequence: 2 }),
      event({ eventId: "c", installationId: "install-good", sourceSequence: 1 }),
    ];
    const decision = reconcileCanonicalState({
      batch,
      highestSourceSequenceByInstallation: new Map(),
      revokedInstallationIds: new Set(["install-revoked"]),
      gapThreshold: 5,
    });
    expect(decision.evicted).toEqual(["a", "b"]);
    expect(decision.accepted).toEqual(["c"]);
    expect(decision.revokedSeen).toBe(true);
  });

  it("deduplicates repeated event ids from out-of-order sync", () => {
    const batch = [event({ eventId: "a", sourceSequence: 1 }), event({ eventId: "a", sourceSequence: 1 })];
    const decision = reconcileCanonicalState({
      batch,
      highestSourceSequenceByInstallation: new Map(),
      revokedInstallationIds: new Set(),
      gapThreshold: 5,
    });
    expect(decision.accepted).toEqual(["a"]);
    expect(decision.deduped).toEqual(["a"]);
  });
});
