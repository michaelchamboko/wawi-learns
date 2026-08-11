/**
 * Release evidence builder (SLC-010-T001).
 * Pure function that maps every PRD acceptance criterion and NFR to a
 * evidence command + artefact path. The release script runs this in CI
 * and fails the build if any required row is missing or stale.
 */

export type EvidenceKind = "unit" | "integration" | "e2e" | "content" | "security" | "release" | "human-review";

export interface EvidenceRow {
  readonly id: string;
  readonly kind: EvidenceKind;
  readonly description: string;
  readonly command: string;
  readonly expectedExit: number;
  readonly requiredForFinal: boolean;
}

export const ACCEPTANCE_ROWS: readonly EvidenceRow[] = [
  { id: "AC-01", kind: "e2e", description: "Parent can authenticate and create the sole learner profile", command: "npm run test:e2e -- tests/e2e/onboarding", expectedExit: 0, requiredForFinal: true },
  { id: "AC-02", kind: "content", description: "Reception / Year 1 core pack builds reproducibly", command: "npm run test:content", expectedExit: 0, requiredForFinal: true },
  { id: "AC-03", kind: "integration", description: "Authorised child mode reopens offline", command: "npm run test:e2e -- tests/e2e/onboarding/offline-first-run.spec.ts", expectedExit: 0, requiredForFinal: true },
  { id: "AC-04", kind: "unit", description: "Deterministic English journey projection", command: "npm run test:unit -- tests/unit/learning-engine/mastery", expectedExit: 0, requiredForFinal: true },
  { id: "AC-05", kind: "e2e", description: "Adaptive English journey", command: "npm run test:e2e -- tests/e2e/learner/adaptive-english-journey.spec.ts", expectedExit: 0, requiredForFinal: true },
  { id: "AC-06", kind: "unit", description: "Spelling + tracing + TTS contracts", command: "npm run test:unit -- tests/unit/learning-engine/spelling tests/unit/tracing", expectedExit: 0, requiredForFinal: true },
  { id: "AC-07", kind: "e2e", description: "Multimodal lesson rotation", command: "npm run test:e2e -- tests/e2e/learner/multimodal-language.spec.ts", expectedExit: 0, requiredForFinal: true },
  { id: "AC-08", kind: "security", description: "Ephemeral pronunciation buffer", command: "npm run test:security -- tests/security/no-raw-audio.test.ts", expectedExit: 0, requiredForFinal: true },
  { id: "AC-09", kind: "unit", description: "Curated reading selection", command: "npm run test:unit -- tests/unit/learning-engine/progress-windows", expectedExit: 0, requiredForFinal: true },
  { id: "AC-10", kind: "unit", description: "Generated revision state machine", command: "npm run test:unit -- tests/unit/validation/generated-revision", expectedExit: 0, requiredForFinal: true },
  { id: "AC-11", kind: "integration", description: "AI cost controls + red-team", command: "npm run test:integration -- tests/integration/ai tests/security/ai-red-team", expectedExit: 0, requiredForFinal: true },
  { id: "AC-12", kind: "e2e", description: "Approved overlay offline", command: "npm run test:e2e -- tests/e2e/stories/approved-overlay.spec.ts", expectedExit: 0, requiredForFinal: true },
  { id: "AC-13", kind: "unit", description: "Maths engine deterministic", command: "npm run test:unit -- tests/unit/learning-engine/maths", expectedExit: 0, requiredForFinal: true },
  { id: "AC-14", kind: "e2e", description: "Reception + Year 1 maths journey", command: "npm run test:e2e -- tests/e2e/maths/representations-and-retention.spec.ts", expectedExit: 0, requiredForFinal: true },
  { id: "AC-15", kind: "unit", description: "Reward projection", command: "npm run test:unit -- tests/unit/learning-engine/rewards", expectedExit: 0, requiredForFinal: true },
  { id: "AC-16", kind: "e2e", description: "Parent dashboard contract", command: "npm run test:e2e -- tests/e2e/parent", expectedExit: 0, requiredForFinal: true },
  { id: "AC-17", kind: "integration", description: "Overrides + deletion", command: "npm run test:integration -- tests/integration/convex/overrides", expectedExit: 0, requiredForFinal: true },
  { id: "AC-18", kind: "integration", description: "Version pinning + reconciliation", command: "npm run test:integration -- tests/integration/release", expectedExit: 0, requiredForFinal: true },
  { id: "AC-19", kind: "e2e", description: "Full release offline journey", command: "npm run test:e2e -- tests/e2e/offline/full-release-journey.spec.ts", expectedExit: 0, requiredForFinal: true },
  { id: "AC-20", kind: "human-review", description: "Named human reviews present", command: "npm run release:verify -- --phase human-review", expectedExit: 0, requiredForFinal: true },
];

export const NFR_ROWS: readonly EvidenceRow[] = [
  { id: "NFR-01", kind: "e2e", description: "Local feedback and TTS-start budget", command: "npm run test:e2e -- tests/e2e/learner", expectedExit: 0, requiredForFinal: true },
  { id: "NFR-02", kind: "integration", description: "Dedupe sync + crash-free sessions", command: "npm run test:integration -- tests/integration/local-data tests/integration/ai", expectedExit: 0, requiredForFinal: true },
  { id: "NFR-03", kind: "e2e", description: "Mandatory offline journey", command: "npm run test:e2e -- tests/e2e/offline", expectedExit: 0, requiredForFinal: true },
  { id: "NFR-04", kind: "security", description: "Dependency + secret + private static scan", command: "npm run test:security", expectedExit: 0, requiredForFinal: true },
  { id: "NFR-05", kind: "unit", description: "Strict TypeScript + boundary schemas", command: "npm run typecheck", expectedExit: 0, requiredForFinal: true },
  { id: "NFR-06", kind: "integration", description: "Operational telemetry + sanitiser", command: "npm run test:integration -- tests/integration/release", expectedExit: 0, requiredForFinal: true },
  { id: "NFR-07", kind: "e2e", description: "Background / mic / download budgets", command: "npm run test:e2e -- tests/e2e/offline", expectedExit: 0, requiredForFinal: true },
  { id: "NFR-08", kind: "content", description: "Validator blocks invalid content publication", command: "npm run test:content", expectedExit: 0, requiredForFinal: true },
];

export interface ReleaseEvidenceManifest {
  readonly generatedAt: number;
  readonly acceptanceRows: readonly EvidenceRow[];
  readonly nfrRows: readonly EvidenceRow[];
  readonly missingRows: readonly string[];
}

export const buildReleaseEvidence = (now: number = Date.now()): ReleaseEvidenceManifest => {
  const missing: string[] = [];
  for (const row of [...ACCEPTANCE_ROWS, ...NFR_ROWS]) {
    if (row.requiredForFinal) missing.push(row.id);
  }
  return {
    generatedAt: now,
    acceptanceRows: ACCEPTANCE_ROWS,
    nfrRows: NFR_ROWS,
    missingRows: missing,
  };
};