"use client";

import { useState } from "react";
import { initialDeletionState, nextDeletionStep, type DeletionState } from "../../../packages/learning-engine/src/deletion";

const order: Array<Parameters<typeof nextDeletionStep>[1]> = [
  "consent-revoked",
  "pending-events-cancelled",
  "server-marked",
  "local-purged",
  "queue-evicted",
  "overlay-evicted",
  "complete",
];

export function DataRightsHarness() {
  const [state, setState] = useState<DeletionState>(initialDeletionState("child-1"));

  const advance = (step: Parameters<typeof nextDeletionStep>[1]) => {
    setState((prev) => nextDeletionStep(prev, step));
  };

  const jumpToLocalPurged = () => {
    let next = state;
    next = nextDeletionStep(next, "local-purged");
    setState(next);
  };

  return (
    <main className="learner-shell" data-testid="data-rights-harness">
      <section className="home-card">
        <p className="eyebrow">Data rights</p>
        <h1>Verified deletion</h1>
        <p data-testid="data-rights-steps">Steps: {state.steps.join(" → ") || "none"}</p>
        <p data-testid="data-rights-completed" data-active={state.completedAt ? "true" : "false"}>
          Completed: {state.completedAt ? new Date(state.completedAt).toISOString() : "no"}
        </p>
        <p data-testid="data-rights-failure" data-failure={state.failureReason ?? "none"}>
          Failure: {state.failureReason ?? "none"}
        </p>
        <div className="form-row">
          {order.map((step) => (
            <button
              key={step}
              className="link-button"
              type="button"
              onClick={() => advance(step)}
              data-testid={`data-rights-step-${step}`}
            >
              {step}
            </button>
          ))}
          <button
            className="primary-button"
            type="button"
            onClick={jumpToLocalPurged}
            data-testid="data-rights-jump-local"
          >
            Jump to local-purged (out of order)
          </button>
        </div>
      </section>
    </main>
  );
}
