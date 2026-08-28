"use client";

import { useMemo, useState } from "react";
import { projectMastery, type MasteryEvent } from "../../../packages/learning-engine/src/mastery";
import {
  dashboardClaimsAreBackedByEvidence,
  projectParentDashboard,
  type DashboardEvidence,
  type DashboardWindow,
} from "../../../packages/learning-engine/src/parent-dashboard";

const NOW = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;

const seedEvents: MasteryEvent[] = [
  { itemId: "phonics-cvc", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 4 * ONE_DAY, modality: "visual" },
  { itemId: "phonics-cvc", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 3 * ONE_DAY, modality: "audio" },
  { itemId: "phonics-cvc", dimension: "phonics", result: "incorrect", hintCount: 0, occurredAt: NOW - 2 * ONE_DAY, modality: "visual" },
  { itemId: "phonics-cvc", dimension: "phonics", result: "incorrect", hintCount: 0, occurredAt: NOW - 1 * ONE_DAY, modality: "visual" },
  { itemId: "phonics-cvc", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW, modality: "tracing" },
  { itemId: "maths-count", dimension: "maths", result: "correct", hintCount: 0, occurredAt: NOW, modality: "tile" },
];

const seedEvidence: DashboardEvidence[] = seedEvents.map((event) => ({
  itemId: event.itemId,
  dimension: event.dimension,
  result: event.result,
  occurredAt: event.occurredAt,
  hintCount: event.hintCount,
  modality: event.modality,
  sourceEventId: `seed-${event.itemId}-${event.occurredAt}`,
}));

export function ParentDashboardHarness() {
  const [window, setWindow] = useState<DashboardWindow>("week");
  const [packState, setPackState] = useState<"ok" | "missing" | "stale" | "revoked">("ok");
  const [syncState, setSyncState] = useState<"ok" | "gap" | "out-of-order" | "stale">("ok");

  const projections = useMemo(() => projectMastery(seedEvents, undefined, NOW), []);
  const dashboard = useMemo(
    () =>
      projectParentDashboard({
        childProfileId: "child-1",
        evidence: seedEvidence,
        projections,
        packState,
        syncState,
        now: NOW,
        window,
      }),
    [projections, packState, syncState, window],
  );

  return (
    <main className="learner-shell" data-testid="parent-dashboard">
      <section className="home-card">
        <p className="eyebrow">Parent dashboard</p>
        <h1>Evidence-backed progress</h1>
        <p data-testid="parent-dashboard-window">Window: {dashboard.window}</p>
        <p data-testid="parent-dashboard-attempts">Total attempts: {dashboard.totalAttempts}</p>
        <p data-testid="parent-dashboard-correct-rate">Correct rate: {Math.round(dashboard.correctRate * 100)}%</p>
        <p data-testid="parent-dashboard-insufficient" data-active={dashboard.insufficient ? "true" : "false"}>
          Insufficient data: {dashboard.insufficient ? "yes" : "no"}
        </p>
        <p data-testid="parent-dashboard-uncertainty">Uncertainty: {dashboard.uncertainty.join(", ") || "none"}</p>
        <p data-testid="parent-dashboard-pack">Pack: {dashboard.packState}</p>
        <p data-testid="parent-dashboard-sync">Sync: {dashboard.syncState}</p>
        <ul data-testid="parent-dashboard-weak">
          {dashboard.weakReasons.length === 0 ? <li>No weak reasons flagged.</li> : null}
          {dashboard.weakReasons.map((weak) => (
            <li key={weak.itemId} data-testid={`parent-dashboard-weak-${weak.itemId}`}>
              {weak.itemId} — {weak.reason} ({weak.recentCorrect} correct, {weak.recentIncorrect} incorrect in last 7 days)
            </li>
          ))}
        </ul>
        <p data-testid="parent-dashboard-backed" data-active={dashboardClaimsAreBackedByEvidence(dashboard) ? "true" : "false"}>
          Claims backed by evidence: {dashboardClaimsAreBackedByEvidence(dashboard) ? "yes" : "no"}
        </p>
        <div className="form-row">
          <button
            className="link-button"
            type="button"
            onClick={() => setWindow("baseline")}
            data-testid="parent-dashboard-window-baseline"
          >
            Show baseline window
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setPackState("revoked")}
            data-testid="parent-dashboard-pack-revoked"
          >
            Mark pack revoked
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setSyncState("gap")}
            data-testid="parent-dashboard-sync-gap"
          >
            Mark sync gap
          </button>
        </div>
      </section>
    </main>
  );
}
