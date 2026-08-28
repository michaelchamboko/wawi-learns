"use client";

import { useState } from "react";
import {
  beginRollback,
  finishRollback,
  initialRollbackState,
  promote,
  runSmoke,
  type RollbackState,
} from "../../../packages/learning-engine/src/rollback";

export function ReleaseRollbackHarness() {
  const [state, setState] = useState<RollbackState>(initialRollbackState("1.0.0"));
  const [candidate, setCandidate] = useState("1.1.0");

  const promoteCandidate = () => setState((s) => promote(s, candidate));
  const smokePass = () => setState((s) => runSmoke(s, true));
  const smokeFail = () => setState((s) => runSmoke(s, false));
  const rollback = () => setState((s) => finishRollback(beginRollback(s)));

  return (
    <main className="learner-shell" data-testid="release-rollback-harness">
      <section className="home-card">
        <p className="eyebrow">Release</p>
        <h1>Rollback and smoke</h1>
        <p data-testid="release-stage" data-stage={state.stage}>
          Stage: {state.stage}
        </p>
        <p data-testid="release-active">Active: {state.activeVersion}</p>
        <p data-testid="release-good">Last known good: {state.lastKnownGood}</p>
        <p data-testid="release-preserved" data-preserved={state.attemptsPreserved ? "true" : "false"}>
          Attempts preserved: {state.attemptsPreserved ? "yes" : "no"}
        </p>
        <div className="form-row">
          <input
            aria-label="candidate version"
            data-testid="release-candidate"
            value={candidate}
            onChange={(event) => setCandidate(event.target.value)}
            className="text-field"
          />
          <button className="link-button" type="button" onClick={promoteCandidate} data-testid="release-promote">
            Promote
          </button>
          <button className="link-button" type="button" onClick={smokePass} data-testid="release-smoke-pass">
            Smoke pass
          </button>
          <button className="link-button" type="button" onClick={smokeFail} data-testid="release-smoke-fail">
            Smoke fail
          </button>
          <button className="primary-button" type="button" onClick={rollback} data-testid="release-rollback">
            Roll back
          </button>
        </div>
      </section>
    </main>
  );
}
