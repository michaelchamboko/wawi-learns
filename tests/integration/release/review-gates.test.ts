import { describe, expect, it } from "vitest";
import {
  REQUIRED_SCOPES,
  validateReviewSet,
  type ReviewRecord,
} from "../../../packages/learning-engine/src/review-records";

const record = (scope: ReviewRecord["scope"], overrides: Partial<ReviewRecord> = {}): ReviewRecord => ({
  id: `REV-${scope}`,
  scope,
  approver: "Product Owner",
  approvedAt: 1_700_000_000_000,
  findings: [],
  ...overrides,
});

const fullSet = (): ReviewRecord[] =>
  REQUIRED_SCOPES.map((scope) => record(scope));

describe("SLC-010-T002 — human review gates", () => {
  it("passes when all four named reviews are present with no open critical/important findings", () => {
    const result = validateReviewSet(fullSet());
    expect(result.passed).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("fails when a required scope is missing", () => {
    const result = validateReviewSet(fullSet().filter((r) => r.scope !== "privacy-safety"));
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("missing required review for scope privacy-safety");
  });

  it("fails when an approver is not named", () => {
    const result = validateReviewSet(fullSet().map((r) => (r.scope === "curriculum" ? record("curriculum", { approver: "" }) : r)));
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("no named approver"))).toBe(true);
  });

  it("fails when a critical or important finding is open", () => {
    const withOpen = fullSet().map((r) =>
      r.scope === "accessibility"
        ? record("accessibility", { findings: [{ id: "F-1", severity: "high", status: "open" }] })
        : r,
    );
    const result = validateReviewSet(withOpen);
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("Important"))).toBe(true);
  });

  it("allows low/medium findings to remain open without blocking", () => {
    const withLow = fullSet().map((r) =>
      r.scope === "curriculum"
        ? record("curriculum", { findings: [{ id: "F-2", severity: "low", status: "open" }] })
        : r,
    );
    expect(validateReviewSet(withLow).passed).toBe(true);
  });
});
