"use client";

import { useMemo, useState } from "react";
import { applyOverrides, overrideGrantsEvidence, type ParentOverride } from "../../../packages/learning-engine/src/overrides";

const NOW = Date.now();

const baseOverrides: ParentOverride[] = [
  {
    id: "o-1",
    childProfileId: "child-1",
    parentId: "parent-1",
    kind: "target-minutes",
    value: "20",
    recordedAt: NOW - 1_000_000,
    audit: "parent-verified-2025",
  },
  {
    id: "o-2",
    childProfileId: "child-1",
    parentId: "parent-1",
    kind: "subject-balance",
    value: "english-only",
    recordedAt: NOW - 500_000,
    audit: "parent-verified-2025",
  },
];

export function OverridesHarness() {
  const [overrides, setOverrides] = useState<ParentOverride[]>(baseOverrides);

  const applied = useMemo(
    () => applyOverrides({ childProfileId: "child-1", overrides, now: NOW }),
    [overrides],
  );
  const anyGrantEvidence = overrides.some((override) => overrideGrantsEvidence(override));

  const setTarget = (value: string) => {
    setOverrides((prev) => [
      ...prev,
      {
        id: `o-${prev.length + 1}-${Date.now()}`,
        childProfileId: "child-1",
        parentId: "parent-1",
        kind: "target-minutes",
        value,
        recordedAt: Date.now(),
        audit: "parent-verified-2025",
      },
    ]);
  };

  const enableBalanced = () => {
    setOverrides((prev) => [
      ...prev,
      {
        id: `o-${prev.length + 1}-${Date.now()}`,
        childProfileId: "child-1",
        parentId: "parent-1",
        kind: "subject-balance",
        value: "balanced",
        recordedAt: Date.now(),
        audit: "parent-verified-2025",
      },
    ]);
  };

  const disableMic = () => {
    setOverrides((prev) => [
      ...prev,
      {
        id: `o-${prev.length + 1}-${Date.now()}`,
        childProfileId: "child-1",
        parentId: "parent-1",
        kind: "mic-disable",
        value: "true",
        recordedAt: Date.now(),
        audit: "parent-verified-2025",
      },
    ]);
  };

  return (
    <main className="learner-shell" data-testid="overrides-harness">
      <section className="home-card">
        <p className="eyebrow">Audited controls</p>
        <h1>Parent overrides never grant evidence</h1>
        <p data-testid="overrides-target">Target minutes: {applied.targetDailyMinutes}</p>
        <p data-testid="overrides-subject">Subject balance: {applied.subjectBalance}</p>
        <p data-testid="overrides-mic">Mic enabled: {applied.micEnabled ? "yes" : "no"}</p>
        <p data-testid="overrides-disabled">Activities disabled: {applied.activityDisabled.join(", ") || "none"}</p>
        <p data-testid="overrides-difficulty">Difficulty: {applied.difficulty}</p>
        <p data-testid="overrides-pace">Pace: {applied.pace}</p>
        <p data-testid="overrides-audit" data-grant={anyGrantEvidence ? "true" : "false"}>
          Audit: {overrides.length} override(s); evidence granted: {anyGrantEvidence ? "yes" : "no"}
        </p>
        <div className="form-row">
          <button className="link-button" type="button" onClick={() => setTarget("45")} data-testid="overrides-set-target">
            Set target to 45 minutes
          </button>
          <button className="link-button" type="button" onClick={enableBalanced} data-testid="overrides-enable-balanced">
            Enable balanced subjects
          </button>
          <button className="link-button" type="button" onClick={disableMic} data-testid="overrides-disable-mic">
            Disable microphone
          </button>
        </div>
      </section>
    </main>
  );
}
