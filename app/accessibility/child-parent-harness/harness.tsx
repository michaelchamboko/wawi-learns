"use client";

import { useMemo, useState } from "react";
import {
  evaluateAccessibility,
  type AccessibilitySetting,
} from "../../../packages/learning-engine/src/accessibility";

const settingButtons: AccessibilitySetting[] = [
  "high-contrast",
  "greyscale",
  "reduced-motion",
  "captions-on",
  "touch-spacing-large",
  "long-copy",
];

export function AccessibilityHarness() {
  const [settings, setSettings] = useState<AccessibilitySetting[]>([]);
  const [touchTargetPx, setTouchTargetPx] = useState(48);
  const [touchSpacingPx, setTouchSpacingPx] = useState(8);
  const [motionDistance, setMotionDistance] = useState(0);

  const contrastRatio = settings.includes("high-contrast") ? 7.2 : 4.6;

  const report = useMemo(
    () =>
      evaluateAccessibility({
        settings,
        touchTargetPx,
        touchSpacingPx,
        contrastRatio,
        motionDistance,
      }),
    [settings, touchTargetPx, touchSpacingPx, contrastRatio, motionDistance],
  );

  const toggle = (setting: AccessibilitySetting) => {
    setSettings((prev) => (prev.includes(setting) ? prev.filter((s) => s !== setting) : [...prev, setting]));
  };

  return (
    <main className="learner-shell" data-testid="accessibility-harness">
      <section className="home-card">
        <p className="eyebrow">Accessibility</p>
        <h1>Child and parent contract</h1>
        <p data-testid="a11y-settings">Settings: {settings.join(", ") || "default"}</p>
        <p data-testid="a11y-touch-target" data-active={String(touchTargetPx)}>
          Touch target: {touchTargetPx}px
        </p>
        <p data-testid="a11y-touch-spacing" data-active={String(touchSpacingPx)}>
          Touch spacing: {touchSpacingPx}px
        </p>
        <p data-testid="a11y-motion">Motion distance: {motionDistance}px</p>
        <p data-testid="a11y-report" data-pass={report.pass ? "true" : "false"}>
          Report: {report.pass ? "pass" : `fail (${report.failures.join(", ")})`}
        </p>
        <div className="form-row">
          {settingButtons.map((setting) => (
            <button
              key={setting}
              className="link-button"
              type="button"
              onClick={() => toggle(setting)}
              data-testid={`a11y-toggle-${setting}`}
            >
              Toggle {setting}
            </button>
          ))}
          <button
            className="link-button"
            type="button"
            onClick={() => setTouchTargetPx(40)}
            data-testid="a11y-touch-target-40"
          >
            Shrink touch target to 40
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setTouchSpacingPx(4)}
            data-testid="a11y-touch-spacing-4"
          >
            Shrink touch spacing to 4
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => setMotionDistance(32)}
            data-testid="a11y-motion-32"
          >
            Add 32px motion
          </button>
        </div>
      </section>
    </main>
  );
}
