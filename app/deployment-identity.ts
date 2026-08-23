export interface DeploymentIdentity {
  readonly project: "wawi-learns";
  readonly environment: string;
  readonly gitSha: string;
  readonly deploymentId: string;
}

const resolveEnvValue = (value: string | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback;

export function readDeploymentIdentity(
  env: NodeJS.ProcessEnv = process.env,
): DeploymentIdentity {
  return {
    project: "wawi-learns",
    environment: resolveEnvValue(env.VERCEL_ENV, "local"),
    gitSha: resolveEnvValue(env.VERCEL_GIT_COMMIT_SHA, resolveEnvValue(env.NEXT_PUBLIC_GIT_SHA, "development")),
    deploymentId: resolveEnvValue(env.VERCEL_DEPLOYMENT_ID, "local"),
  };
}
