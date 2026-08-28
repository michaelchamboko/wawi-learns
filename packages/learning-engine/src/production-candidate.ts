/**
 * Production candidate verification (SLC-010-T004).
 * Pure. A production candidate is only considered verified when the live
 * deployment SHA matches the approved candidate SHA exactly and every
 * smoke probe passes. No preview URL is ever accepted as production.
 */
export interface ProductionCandidate {
  readonly approvedSha: string;
  readonly liveDeploymentSha: string | null;
  readonly isPreview: boolean;
  readonly smokeProbes: ReadonlyArray<{ id: string; passed: boolean }>;
}

export const verifyProductionCandidate = (
  candidate: ProductionCandidate,
): { verified: boolean; reasons: string[] } => {
  const reasons: string[] = [];

  if (candidate.liveDeploymentSha === null) {
    reasons.push("no live deployment SHA reported");
  } else if (candidate.liveDeploymentSha !== candidate.approvedSha) {
    reasons.push(
      `live deployment ${candidate.liveDeploymentSha} does not match approved candidate ${candidate.approvedSha}`,
    );
  }
  if (candidate.isPreview) reasons.push("preview deployment cannot be promoted to production");
  for (const probe of candidate.smokeProbes) {
    if (!probe.passed) reasons.push(`smoke probe ${probe.id} failed`);
  }

  return { verified: reasons.length === 0, reasons };
};
