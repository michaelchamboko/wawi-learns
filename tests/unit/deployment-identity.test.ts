import { describe, expect, it } from "vitest";

import { readDeploymentIdentity } from "../../app/deployment-identity";

describe("SLC-001-T001 — deployment identity", () => {
  it("uses Vercel environment values when present", () => {
    const identity = readDeploymentIdentity({
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_SHA: "vercel-sha-123",
      VERCEL_DEPLOYMENT_ID: "dep-999",
      NEXT_PUBLIC_GIT_SHA: "ci-sha-ignored",
      NODE_ENV: "test",
    } as unknown as NodeJS.ProcessEnv);

    expect(identity).toEqual({
      project: "wawi-learns",
      environment: "preview",
      gitSha: "vercel-sha-123",
      deploymentId: "dep-999",
    });
  });

  it("falls back to CI git sha when commit SHA is not present", () => {
    const identity = readDeploymentIdentity({
      NEXT_PUBLIC_GIT_SHA: "ci-sha-456",
      VERCEL_ENV: "production",
      VERCEL_DEPLOYMENT_ID: "dep-100",
      NODE_ENV: "test",
    } as unknown as NodeJS.ProcessEnv);

    expect(identity.gitSha).toBe("ci-sha-456");
  });

  it("uses local defaults when deployment values are unavailable", () => {
    const identity = readDeploymentIdentity({ NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv);

    expect(identity).toEqual({
      project: "wawi-learns",
      environment: "local",
      gitSha: "development",
      deploymentId: "local",
    });
  });

  it("returns exactly the deployed identity contract shape", () => {
    const identity = readDeploymentIdentity({ VERCEL_ENV: "test", VERCEL_DEPLOYMENT_ID: "dep-local", NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv);

    expect(Object.keys(identity).sort()).toEqual(["project", "environment", "deploymentId", "gitSha"].sort());
    expect(identity.project).toBe("wawi-learns");
  });
});
