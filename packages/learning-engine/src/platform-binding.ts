/**
 * Platform binding (SLC-010-T003).
 * Verifies the local repository is bound to the canonical GitHub
 * repository and Vercel project. Hosted-only checks (vercel project
 * inspect, github actions receipts) live in the deployment pipeline.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "..", "..", "..");

export interface PlatformBinding {
  readonly repo: string;
  readonly vercelProject: string;
  readonly vercelRoot: string;
  readonly productionBranch: string;
  readonly nodeVersion: string;
  readonly hasCiWorkflow: boolean;
}

const required = (key: string, value: string | undefined): string => {
  if (!value) throw new Error(`missing-binding:${key}`);
  return value;
};

export const readPlatformBinding = (): PlatformBinding => {
  const manifestRaw = readFileSync(resolve(repoRoot, ".specify/specs/wawi-learns/000-spec-of-specs/manifest.yml"), "utf-8");
  const repo = required("repository.remote", /remote:\s*"([^"]+)"/.exec(manifestRaw)?.[1]);
  const vercelProject = required("vercel.project", /vercel_project:\s*"([^"]+)"/.exec(manifestRaw)?.[1]);
  const vercelRoot = required("vercel.root", /vercel_root_directory:\s*"([^"]+)"/.exec(manifestRaw)?.[1]);
  const productionBranch = required("branch", /production_branch:\s*"([^"]+)"/.exec(manifestRaw)?.[1]);
  const nodeVersion = required("node", /vercel_node_version:\s*"([^"]+)"/.exec(manifestRaw)?.[1]);
  const hasCiWorkflow = existsSync(resolve(repoRoot, ".github/workflows/ci.yml"));
  return {
    repo,
    vercelProject,
    vercelRoot,
    productionBranch,
    nodeVersion,
    hasCiWorkflow,
  };
};