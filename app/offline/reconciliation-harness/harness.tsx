"use client";

import { useMemo, useState } from "react";
import { reconcileCanonicalState, type CanonicalEvent } from "../../../packages/learning-engine/src/reconcile";

const seed: CanonicalEvent[] = [
  { eventId: "a", installationId: "install-1", sourceSequence: 1, occurredAt: 1_700_000_000_000 },
  { eventId: "b", installationId: "install-1", sourceSequence: 2, occurredAt: 1_700_000_001_000 },
  { eventId: "c", installationId: "install-revoked", sourceSequence: 1, occurredAt: 1_700_000_002_000 },
];

export function ReconciliationHarness() {
  const [revoked, setRevoked] = useState<Set<string>>(new Set());
  const [duplicate, setDuplicate] = useState(false);
  const [gap, setGap] = useState(false);

  const batch = useMemo<CanonicalEvent[]>(() => {
    const list = [...seed];
    if (duplicate) list.push({ ...seed[0]! });
    if (gap) list.push({ eventId: "z", installationId: "install-1", sourceSequence: 99, occurredAt: 1_700_000_005_000 });
    return list;
  }, [duplicate, gap]);

  const decision = useMemo(
    () =>
      reconcileCanonicalState({
        batch,
        highestSourceSequenceByInstallation: new Map(),
        revokedInstallationIds: revoked,
        gapThreshold: 5,
      }),
    [batch, revoked],
  );

  return (
    <main className="learner-shell" data-testid="reconciliation-harness">
      <section className="home-card">
        <p className="eyebrow">Reconciliation</p>
        <h1>Revocation-first ordering</h1>
        <p data-testid="reconcile-accepted">Accepted: {decision.accepted.join(", ") || "none"}</p>
        <p data-testid="reconcile-evicted">Evicted: {decision.evicted.join(", ") || "none"}</p>
        <p data-testid="reconcile-dedup">Deduped: {decision.deduped.join(", ") || "none"}</p>
        <p data-testid="reconcile-gap" data-active={decision.gap ? "true" : "false"}>
          Gap detected: {decision.gap ? "yes" : "no"}
        </p>
        <p data-testid="reconcile-revoked" data-active={decision.revokedSeen ? "true" : "false"}>
          Revoked seen: {decision.revokedSeen ? "yes" : "no"}
        </p>
        <div className="form-row">
          <button
            className="link-button"
            type="button"
            onClick={() => setRevoked((prev) => new Set(prev).add("install-revoked"))}
            data-testid="reconcile-mark-revoked"
          >
            Mark install-revoked
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setDuplicate((value) => !value)}
            data-testid="reconcile-toggle-duplicate"
          >
            Toggle duplicate event
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setGap((value) => !value)}
            data-testid="reconcile-toggle-gap"
          >
            Toggle out-of-order gap
          </button>
        </div>
      </section>
    </main>
  );
}
