/**
 * Release evidence manifest builder (SLC-010-T001).
 * Pure. Produces an immutable, schema-versioned manifest that fails
 * closed when any AC row, NFR gate, slice gate, version, or candidate
 * SHA is missing/stale. No child data or secrets are ever carried.
 */
export const RELEASE_EVIDENCE_SCHEMA_VERSION = "1.0.0";
export const MAX_EVIDENCE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface AcceptanceCriterionRow {
  readonly id: string;
  readonly status: "pass" | "fail" | "blocked";
  readonly evidenceRef: string;
  readonly checkedAt: number;
}

export interface NfrGate {
  readonly id: string;
  readonly status: "pass" | "fail";
}

export interface SliceGate {
  readonly slice: string;
  readonly status: "done" | "pending" | "blocked";
}

export interface ReleaseInputs {
  readonly candidateSha: string;
  readonly appVersion: string;
  readonly engineVersion: string;
  readonly curriculumVersion: string;
  readonly contentVersion: string;
  readonly promptVersion: string;
  readonly speechVersion: string;
  readonly generatedAt: number;
  readonly acceptanceCriteria: ReadonlyArray<AcceptanceCriterionRow>;
  readonly nfrs: ReadonlyArray<NfrGate>;
  readonly sliceGates: ReadonlyArray<SliceGate>;
  readonly childDataPresent: boolean;
  readonly secretsPresent: boolean;
}

export interface ReleaseEvidenceManifest {
  readonly schemaVersion: string;
  readonly candidateSha: string;
  readonly generatedAt: number;
  readonly versions: {
    readonly app: string;
    readonly engine: string;
    readonly curriculum: string;
    readonly content: string;
    readonly prompt: string;
    readonly speech: string;
  };
  readonly acceptanceCriteria: ReadonlyArray<AcceptanceCriterionRow>;
  readonly nfrs: ReadonlyArray<NfrGate>;
  readonly sliceGates: ReadonlyArray<SliceGate>;
  readonly gate: { readonly passed: boolean; readonly reasons: ReadonlyArray<string> };
}

export class ReleaseEvidenceError extends Error {}

export const buildReleaseEvidence = (input: ReleaseInputs): ReleaseEvidenceManifest => {
  const reasons: string[] = [];

  if (input.childDataPresent) reasons.push("evidence contains child data");
  if (input.secretsPresent) reasons.push("evidence contains secrets");
  if (!input.candidateSha) reasons.push("missing candidate SHA");

  for (const row of input.acceptanceCriteria) {
    if (row.status !== "pass") reasons.push(`AC ${row.id} not passing (${row.status})`);
    if (input.generatedAt - row.checkedAt > MAX_EVIDENCE_AGE_MS) reasons.push(`AC ${row.id} evidence stale`);
  }
  for (const nfr of input.nfrs) {
    if (nfr.status !== "pass") reasons.push(`NFR ${nfr.id} not passing`);
  }
  for (const gate of input.sliceGates) {
    if (gate.status !== "done") reasons.push(`slice ${gate.slice} not done (${gate.status})`);
  }

  return {
    schemaVersion: RELEASE_EVIDENCE_SCHEMA_VERSION,
    candidateSha: input.candidateSha,
    generatedAt: input.generatedAt,
    versions: {
      app: input.appVersion,
      engine: input.engineVersion,
      curriculum: input.curriculumVersion,
      content: input.contentVersion,
      prompt: input.promptVersion,
      speech: input.speechVersion,
    },
    acceptanceCriteria: input.acceptanceCriteria,
    nfrs: input.nfrs,
    sliceGates: input.sliceGates,
    gate: { passed: reasons.length === 0, reasons },
  };
};
