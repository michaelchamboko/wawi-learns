import { describe, expect, it } from "vitest";
import {
  CHECKS,
  evaluateAccessibility,
  MIN_TOUCH_SPACING_PX,
  MIN_TOUCH_TARGET_PX,
} from "../../../packages/learning-engine/src/accessibility";

const baseMetrics = {
  touchTargetPx: 48,
  touchSpacingPx: 8,
  contrastRatio: 4.6,
  motionDistance: 0,
};

describe("SLC-009-T003 — accessibility contract", () => {
  it("passes with default metrics and no special settings", () => {
    const report = evaluateAccessibility({ settings: [], ...baseMetrics });
    expect(report.pass).toBe(true);
    expect(report.failures).toEqual([]);
  });

  it("fails when touch targets are smaller than 48px", () => {
    const report = evaluateAccessibility({ settings: [], ...baseMetrics, touchTargetPx: 40 });
    expect(report.pass).toBe(false);
    expect(report.failures).toContain("AC-01");
  });

  it("fails when touch spacing drops below 8px", () => {
    const report = evaluateAccessibility({ settings: [], ...baseMetrics, touchSpacingPx: 4 });
    expect(report.pass).toBe(false);
    expect(report.failures).toContain("AC-02");
  });

  it("high contrast mode requires 7:1", () => {
    const pass = evaluateAccessibility({
      settings: ["high-contrast"],
      ...baseMetrics,
      contrastRatio: 7,
    });
    expect(pass.pass).toBe(true);
    const fail = evaluateAccessibility({
      settings: ["high-contrast"],
      ...baseMetrics,
      contrastRatio: 5,
    });
    expect(fail.pass).toBe(false);
    expect(fail.failures).toContain("AC-04");
  });

  it("reduced motion caps decorative motion at 8px", () => {
    const pass = evaluateAccessibility({
      settings: ["reduced-motion"],
      ...baseMetrics,
      motionDistance: 8,
    });
    expect(pass.pass).toBe(true);
    const fail = evaluateAccessibility({
      settings: ["reduced-motion"],
      ...baseMetrics,
      motionDistance: 32,
    });
    expect(fail.pass).toBe(false);
    expect(fail.failures).toContain("AC-05");
  });

  it("exposes the documented touch target and spacing minimums", () => {
    expect(MIN_TOUCH_TARGET_PX).toBe(48);
    expect(MIN_TOUCH_SPACING_PX).toBe(8);
    expect(CHECKS.length).toBeGreaterThanOrEqual(5);
  });
});
