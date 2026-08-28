/**
 * Platform binding validation (SLC-010-T003).
 * Pure. Verifies the direct-main delivery configuration: the exact repo,
 * the Vercel `wawi-learns` project, root `.`, production branch `main`, and
 * a vercel/Convex receipt bound to the exact candidate SHA. No secrets.
 */
export interface PlatformBinding {
  readonly repository: string;
  readonly vercelProject: string;
  readonly vercelRoot: string;
  readonly branch: string;
  readonly candidateSha: string;
  readonly githubActionsRunSha: string | null;
  readonly vercelDeploymentSha: string | null;
  readonly convexDeploymentSha: string | null;
}

export const EXPECTED = {
  repository: "michaelchamboko/wawi-learns",
  vercelProject: "wawi-learns",
  vercelRoot: ".",
  branch: "main",
} as const;

export const validatePlatformBinding = (
  binding: PlatformBinding,
): { passed: boolean; reasons: string[] } => {
  const reasons: string[] = [];

  if (binding.repository !== EXPECTED.repository) {
    reasons.push(`repository mismatch: expected ${EXPECTED.repository}, got ${binding.repository}`);
  }
  if (binding.vercelProject !== EXPECTED.vercelProject) {
    reasons.push(`vercel project mismatch: expected ${EXPECTED.vercelProject}, got ${binding.vercelProject}`);
  }
  if (binding.vercelRoot !== EXPECTED.vercelRoot) {
    reasons.push(`vercel root mismatch: expected ${EXPECTED.vercelRoot}, got ${binding.vercelRoot}`);
  }
  if (binding.branch !== EXPECTED.branch) {
    reasons.push(`branch mismatch: expected ${EXPECTED.branch}, got ${binding.branch}`);
  }

  const receipts = [binding.githubActionsRunSha, binding.vercelDeploymentSha, binding.convexDeploymentSha].filter(
    (s): s is string => s !== null,
  );
  if (receipts.length === 0) {
    reasons.push("no immutable deployment receipts present");
  }
  for (const receipt of receipts) {
    if (receipt !== binding.candidateSha) {
      reasons.push(`receipt SHA ${receipt} does not match candidate ${binding.candidateSha}`);
    }
  }

  return { passed: reasons.length === 0, reasons };
};
