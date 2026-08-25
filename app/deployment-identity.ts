export interface DeploymentIdentity {
  readonly project: "wawi-learns";
  readonly environment: string;
  readonly gitSha: string;
  readonly deploymentId: string;
  readonly convexDeployment: string;
}

const resolveEnvValue = (value: string | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback;

const resolveConvexDeployment = (value: string | undefined): string => {
  if (!value || !value.trim()) return "unconfigured";
  try {
    const url = new URL(value);
    const suffix = ".convex.cloud";
    const hostname = url.hostname.toLowerCase();
    const deployment = hostname.endsWith(suffix) ? hostname.slice(0, -suffix.length) : "";
    return url.protocol === "https:" && /^[a-z0-9-]+$/.test(deployment) ? deployment : "unconfigured";
  } catch {
    return "unconfigured";
  }
};

export function readDeploymentIdentity(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentIdentity {
  return {
    project: "wawi-learns",
    environment: resolveEnvValue(env.VERCEL_ENV, "local"),
    gitSha: resolveEnvValue(env.VERCEL_GIT_COMMIT_SHA, resolveEnvValue(env.NEXT_PUBLIC_GIT_SHA, "development")),
    deploymentId: resolveEnvValue(env.VERCEL_DEPLOYMENT_ID, "local"),
    convexDeployment: resolveConvexDeployment(env.NEXT_PUBLIC_CONVEX_URL),
  };
}
