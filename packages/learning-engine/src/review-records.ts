/**
 * Human review records (SLC-010-T002).
 * Pure validation for named approvals. The actual approvals are produced
 * by review processes; this module only asserts the required records are
 * present and well-formed — it never self-approves or invents sessions.
 */
export type ReviewScope = "curriculum" | "privacy-safety" | "accessibility" | "supervised-usability";

export interface ReviewRecord {
  readonly id: string;
  readonly scope: ReviewScope;
  readonly approver: string;
  readonly approvedAt: number;
  readonly findings: ReadonlyArray<{ id: string; severity: "low" | "medium" | "high" | "critical"; status: "open" | "resolved" }>;
  readonly notesRef?: string;
}

export const REQUIRED_SCOPES: ReadonlyArray<ReviewScope> = [
  "curriculum",
  "privacy-safety",
  "accessibility",
  "supervised-usability",
];

export class ReviewGateError extends Error {}

export const validateReviewSet = (records: ReadonlyArray<ReviewRecord>): { passed: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  const byScope = new Map<ReviewScope, ReviewRecord>();

  for (const record of records) {
    if (!record.approver || record.approver.trim().length === 0) {
      reasons.push(`review ${record.id} (${record.scope}) has no named approver`);
      continue;
    }
    if (record.approvedAt <= 0) reasons.push(`review ${record.id} has an invalid approval date`);
    const openCritical = record.findings.some((f) => f.severity === "critical" && f.status === "open");
    const openImportant = record.findings.some(
      (f) => (f.severity === "high" || f.severity === "critical") && f.status === "open",
    );
    if (openCritical) reasons.push(`review ${record.id} has an open Critical finding`);
    if (openImportant) reasons.push(`review ${record.id} has an open Important finding`);
    byScope.set(record.scope, record);
  }

  for (const scope of REQUIRED_SCOPES) {
    if (!byScope.has(scope)) reasons.push(`missing required review for scope ${scope}`);
  }

  return { passed: reasons.length === 0, reasons };
};
