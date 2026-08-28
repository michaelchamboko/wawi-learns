/**
 * Accessibility contract (SLC-009-T003).
 * Pure, declarative. UI components must satisfy the resulting matrix
 * before they ship; the harness asserts the visible contract end-to-end.
 */
export type AccessibilitySetting =
  | "default"
  | "high-contrast"
  | "greyscale"
  | "reduced-motion"
  | "captions-on"
  | "touch-spacing-large"
  | "long-copy";

export const MIN_TOUCH_TARGET_PX = 48;
export const MIN_TOUCH_SPACING_PX = 8;
export const MIN_CONTRAST_RATIO = 4.5;

export interface AccessibilityCheck {
  readonly id: string;
  readonly description: string;
  readonly applies: (settings: readonly AccessibilitySetting[]) => boolean;
  readonly evaluate: (params: { touchTargetPx: number; touchSpacingPx: number; contrastRatio: number; motionDistance: number }) => boolean;
}

export const CHECKS: readonly AccessibilityCheck[] = [
  {
    id: "AC-01",
    description: "Touch targets are at least 48px tall",
    applies: () => true,
    evaluate: ({ touchTargetPx }) => touchTargetPx >= MIN_TOUCH_TARGET_PX,
  },
  {
    id: "AC-02",
    description: "Touch targets are spaced at least 8px apart",
    applies: () => true,
    evaluate: ({ touchSpacingPx }) => touchSpacingPx >= MIN_TOUCH_SPACING_PX,
  },
  {
    id: "AC-03",
    description: "Body copy meets the WCAG 2.2 AA contrast minimum",
    applies: (settings) => !settings.includes("high-contrast"),
    evaluate: ({ contrastRatio }) => contrastRatio >= MIN_CONTRAST_RATIO,
  },
  {
    id: "AC-04",
    description: "High contrast mode reaches 7:1",
    applies: (settings) => settings.includes("high-contrast"),
    evaluate: ({ contrastRatio }) => contrastRatio >= 7,
  },
  {
    id: "AC-05",
    description: "Reduced motion keeps decorative motion under 8px",
    applies: (settings) => settings.includes("reduced-motion"),
    evaluate: ({ motionDistance }) => motionDistance <= 8,
  },
];

export interface AccessibilityReport {
  readonly pass: boolean;
  readonly failures: readonly string[];
}

export const evaluateAccessibility = (params: {
  settings: readonly AccessibilitySetting[];
  touchTargetPx: number;
  touchSpacingPx: number;
  contrastRatio: number;
  motionDistance: number;
}): AccessibilityReport => {
  const failures: string[] = [];
  for (const check of CHECKS) {
    if (!check.applies(params.settings)) continue;
    if (!check.evaluate(params)) failures.push(check.id);
  }
  return { pass: failures.length === 0, failures };
};

export const describeAccessibilitySettings = (
  settings: readonly AccessibilitySetting[],
): string => (settings.length === 0 ? "default" : settings.join(","));
