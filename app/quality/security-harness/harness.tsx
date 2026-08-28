"use client";

import { useState } from "react";
import { sanitizeOperationalEvent } from "../../../packages/learning-engine/src/sanitize";

const allowedTelemetryKinds = ["schedule", "render", "tts", "tracing", "sync", "validation", "provider", "cost", "pack"];

const baseEvent = (): Record<string, unknown> => ({
  childProfileId: "child-1234",
  parentEmail: "[email protected]",
  audio: "base64-raw-audio",
  pcm: "raw-pcm",
  strokePath: ["m0,0"],
  durationMs: 1500,
  eventId: "ev-1",
  kind: "schedule",
});

export function QualitySecurityHarness() {
  const [output, setOutput] = useState<unknown>(null);
  const [kind, setKind] = useState(allowedTelemetryKinds[0]!);

  const run = () => {
    const event: Record<string, unknown> = { ...baseEvent(), kind };
    setOutput(sanitizeOperationalEvent(event));
  };

  return (
    <main className="learner-shell" data-testid="quality-security-harness">
      <section className="home-card">
        <p className="eyebrow">Quality and security</p>
        <h1>Telemetry sanitiser</h1>
        <p data-testid="quality-output" data-raw={JSON.stringify(output)}>
          Output: {output ? JSON.stringify(output) : "no run yet"}
        </p>
        <p data-testid="quality-kind">Kind: {kind}</p>
        <div className="form-row">
          {allowedTelemetryKinds.map((k) => (
            <button
              key={k}
              className="link-button"
              type="button"
              onClick={() => setKind(k)}
              data-testid={`quality-kind-${k}`}
            >
              {k}
            </button>
          ))}
          <button className="primary-button" type="button" onClick={run} data-testid="quality-run">
            Run sanitiser
          </button>
        </div>
      </section>
    </main>
  );
}
