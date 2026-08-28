"use client";

import { useState } from "react";
import { pinSessionVersions, type SessionVersionSet } from "../../../packages/learning-engine/src/version-pin";

const baseSnapshot: SessionVersionSet = {
  shellRevision: "shell-v1",
  engineVersion: "engine-1",
  packVersion: "0.1.0",
  schemaVersion: "1.0.0",
  overlayRevision: null,
};

const presets: Record<string, SessionVersionSet> = {
  canonical: baseSnapshot,
  unknownShell: { ...baseSnapshot, shellRevision: "shell-v2" },
  badEngine: { ...baseSnapshot, engineVersion: "engine-99" },
  badPack: { ...baseSnapshot, packVersion: "0.2.0" },
  badSchema: { ...baseSnapshot, schemaVersion: "1.1.0" },
};

export function VersionActivationHarness() {
  const [snapshot, setSnapshot] = useState<SessionVersionSet>(baseSnapshot);
  const result = pinSessionVersions({ snapshot });

  return (
    <main className="learner-shell" data-testid="version-activation-harness">
      <section className="home-card">
        <p className="eyebrow">Offline activation</p>
        <h1>Version pinning</h1>
        <p data-testid="version-shell">Shell: {snapshot.shellRevision}</p>
        <p data-testid="version-engine">Engine: {snapshot.engineVersion}</p>
        <p data-testid="version-pack">Pack: {snapshot.packVersion}</p>
        <p data-testid="version-schema">Schema: {snapshot.schemaVersion}</p>
        <p data-testid="version-result" data-ok={result.ok ? "true" : "false"}>
          Pin result: {result.ok ? "ok" : result.reason ?? "unknown"}
        </p>
        <div className="form-row">
          {Object.entries(presets).map(([label, next]) => (
            <button
              key={label}
              className="link-button"
              type="button"
              onClick={() => setSnapshot(next)}
              data-testid={`version-preset-${label}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
