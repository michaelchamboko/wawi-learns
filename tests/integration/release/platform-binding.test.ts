import { describe, expect, it } from "vitest";
import {
  EXPECTED,
  validatePlatformBinding,
  type PlatformBinding,
} from "../../../packages/learning-engine/src/platform-binding";

const binding = (overrides: Partial<PlatformBinding> = {}): PlatformBinding => ({
  repository: EXPECTED.repository,
  vercelProject: EXPECTED.vercelProject,
  vercelRoot: EXPECTED.vercelRoot,
  branch: EXPECTED.branch,
  candidateSha: "sha-1",
  githubActionsRunSha: "sha-1",
  vercelDeploymentSha: "sha-1",
  convexDeploymentSha: "sha-1",
  ...overrides,
});

describe("SLC-010-T003 — platform binding", () => {
  it("passes when repo, project, root, branch and all receipts match the candidate SHA", () => {
    const result = validatePlatformBinding(binding());
    expect(result.passed).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("fails on repository, project, root or branch mismatch", () => {
    expect(validatePlatformBinding(binding({ repository: "other/repo" })).passed).toBe(false);
    expect(validatePlatformBinding(binding({ vercelProject: "other" })).passed).toBe(false);
    expect(validatePlatformBinding(binding({ vercelRoot: "/app" })).passed).toBe(false);
    expect(validatePlatformBinding(binding({ branch: "develop" })).passed).toBe(false);
  });

  it("fails when any immutable receipt is missing", () => {
    const result = validatePlatformBinding(
      binding({ githubActionsRunSha: null, vercelDeploymentSha: null, convexDeploymentSha: null }),
    );
    expect(result.passed).toBe(false);
    expect(result.reasons).toContain("no immutable deployment receipts present");
  });

  it("fails when a receipt SHA does not match the candidate", () => {
    const result = validatePlatformBinding(binding({ vercelDeploymentSha: "sha-2" }));
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("receipt SHA"))).toBe(true);
  });
});
