import { describe, expect, it } from "vitest";
import { verifyProductionCandidate } from "../../../packages/learning-engine/src/production-candidate";

describe("SLC-010-T004 — production candidate verification", () => {
  it("verifies when the live SHA matches the approved candidate and all smoke probes pass", () => {
    const result = verifyProductionCandidate({
      approvedSha: "sha-1",
      liveDeploymentSha: "sha-1",
      isPreview: false,
      smokeProbes: [{ id: "health", passed: true }, { id: "offline", passed: true }],
    });
    expect(result.verified).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects a preview deployment as production", () => {
    const result = verifyProductionCandidate({
      approvedSha: "sha-1",
      liveDeploymentSha: "sha-1",
      isPreview: true,
      smokeProbes: [{ id: "health", passed: true }],
    });
    expect(result.verified).toBe(false);
    expect(result.reasons).toContain("preview deployment cannot be promoted to production");
  });

  it("rejects when the live SHA does not match the approved candidate", () => {
    const result = verifyProductionCandidate({
      approvedSha: "sha-1",
      liveDeploymentSha: "sha-2",
      isPreview: false,
      smokeProbes: [{ id: "health", passed: true }],
    });
    expect(result.verified).toBe(false);
    expect(result.reasons.some((r) => r.includes("does not match"))).toBe(true);
  });

  it("rejects when a smoke probe fails", () => {
    const result = verifyProductionCandidate({
      approvedSha: "sha-1",
      liveDeploymentSha: "sha-1",
      isPreview: false,
      smokeProbes: [{ id: "health", passed: true }, { id: "rollback", passed: false }],
    });
    expect(result.verified).toBe(false);
    expect(result.reasons).toContain("smoke probe rollback failed");
  });

  it("rejects when no live deployment SHA is reported", () => {
    const result = verifyProductionCandidate({
      approvedSha: "sha-1",
      liveDeploymentSha: null,
      isPreview: false,
      smokeProbes: [{ id: "health", passed: true }],
    });
    expect(result.verified).toBe(false);
    expect(result.reasons).toContain("no live deployment SHA reported");
  });
});
