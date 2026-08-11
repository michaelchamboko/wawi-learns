import { describe, expect, it } from "vitest";
import {
  COMPATIBILITY_GRAPH,
  pinSessionVersions,
  reconcileCanonicalState,
  sanitizeOperationalEvent,
  type CanonicalEvent,
  type SessionVersionSet,
} from "../../../packages/learning-engine/src/index";

const snapshot = (overrides: Partial<SessionVersionSet> = {}): SessionVersionSet => ({
  shellRevision: "shell-v1",
  engineVersion: "engine-1",
  packVersion: "0.1.0",
  schemaVersion: "1.0.0",
  overlayRevision: null,
  ...overrides,
});

describe("SLC-009-T001 — version pinning", () => {
  it("accepts a snapshot that matches the compatibility graph", () => {
    expect(pinSessionVersions({ snapshot: snapshot() }).ok).toBe(true);
  });

  it("rejects an unknown shell revision", () => {
    expect(pinSessionVersions({ snapshot: snapshot({ shellRevision: "shell-unknown" }) }).reason).toBe(
      "unknown-shell-revision",
    );
  });

  it("rejects an incompatible engine version", () => {
    expect(
      pinSessionVersions({ snapshot: snapshot({ engineVersion: "engine-2" }) }).reason,
    ).toBe("incompatible-engine");
  });

  it("rejects an incompatible pack version", () => {
    expect(
      pinSessionVersions({ snapshot: snapshot({ packVersion: "9.9.9" }) }).reason,
    ).toBe("incompatible-pack");
  });
});

describe("SLC-009-T002 — reconciliation", () => {
  const event = (overrides: Partial<CanonicalEvent> & Pick<CanonicalEvent, "eventId" | "installationId" | "sourceSequence">): CanonicalEvent => ({
    occurredAt: 1_700_000_000_000,
    ...overrides,
  });

  it("accepts unique events in order", () => {
    const decision = reconcileCanonicalState({
      batch: [
        event({ eventId: "e1", installationId: "i1", sourceSequence: 1 }),
        event({ eventId: "e2", installationId: "i1", sourceSequence: 2 }),
      ],
      highestSourceSequenceByInstallation: new Map(),
      revokedInstallationIds: new Set(),
      gapThreshold: 10,
    });
    expect(decision.accepted).toEqual(["e1", "e2"]);
    expect(decision.deduped).toEqual([]);
    expect(decision.evicted).toEqual([]);
    expect(decision.gap).toBe(false);
    expect(decision.revokedSeen).toBe(false);
  });

  it("events from a revoked installation are evicted before display", () => {
    const decision = reconcileCanonicalState({
      batch: [event({ eventId: "e1", installationId: "i-revoked", sourceSequence: 1 })],
      highestSourceSequenceByInstallation: new Map(),
      revokedInstallationIds: new Set(["i-revoked"]),
      gapThreshold: 10,
    });
    expect(decision.evicted).toEqual(["e1"]);
    expect(decision.revokedSeen).toBe(true);
  });

  it("dedupes a repeated event", () => {
    const decision = reconcileCanonicalState({
      batch: [
        event({ eventId: "e1", installationId: "i1", sourceSequence: 1 }),
        event({ eventId: "e1", installationId: "i1", sourceSequence: 1 }),
      ],
      highestSourceSequenceByInstallation: new Map(),
      revokedInstallationIds: new Set(),
      gapThreshold: 10,
    });
    expect(decision.accepted).toEqual(["e1"]);
    expect(decision.deduped).toEqual(["e1"]);
  });

  it("detects a sequence gap that exceeds the threshold", () => {
    const decision = reconcileCanonicalState({
      batch: [event({ eventId: "e1", installationId: "i1", sourceSequence: 100 })],
      highestSourceSequenceByInstallation: new Map([["i1", 0]]),
      revokedInstallationIds: new Set(),
      gapThreshold: 5,
    });
    expect(decision.gap).toBe(true);
  });
});

describe("SLC-009-T004 — sanitiser", () => {
  it("redacts forbidden keys", () => {
    const safe = sanitizeOperationalEvent({
      childProfileId: "child-1",
      audio: { pcm: "blob" },
      voice: "wav-blob",
      parentEmail: "p@example.com",
      durationMs: 1500,
      result: "correct",
    }) as Record<string, unknown>;
    expect(safe.childProfileId).toBe("[redacted]");
    expect(safe.audio).toBe("[redacted]");
    expect(safe.voice).toBe("[redacted]");
    expect(safe.parentEmail).toBe("[redacted]");
    expect(safe.durationMs).toBe(1500);
  });

  it("truncates oversized strings", () => {
    const big = "x".repeat(2000);
    const result = sanitizeOperationalEvent({ note: big });
    expect(JSON.stringify(result).length).toBeLessThan(2000);
  });

  it("truncates the entire payload when JSON exceeds the cap", () => {
    const huge = Array.from({ length: 2000 }, (_, i) => ({ id: i, payload: "x".repeat(200) }));
    const result = sanitizeOperationalEvent(huge) as { truncated: boolean };
    expect(result.truncated).toBe(true);
  });
});

describe("SLC-009-T001 — compatibility graph is declared", () => {
  it("contains at least one rule for shell-v1", () => {
    expect(COMPATIBILITY_GRAPH.find((r) => r.shellRevision === "shell-v1")).toBeDefined();
  });
});