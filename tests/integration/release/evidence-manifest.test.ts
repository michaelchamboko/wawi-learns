import { describe, expect, it } from "vitest";
import {
  buildReleaseEvidence,
  MAX_EVIDENCE_AGE_MS,
  RELEASE_EVIDENCE_SCHEMA_VERSION,
  type ReleaseInputs,
} from "../../../packages/learning-engine/src/release-evidence";

const NOW = 1_700_000_000_000;

const baseInput = (overrides: Partial<ReleaseInputs> = {}): ReleaseInputs => ({
  candidateSha: "abc123",
  appVersion: "1.0.0",
  engineVersion: "1.0.0",
  curriculumVersion: "1.0.0",
  contentVersion: "1.0.0",
  promptVersion: "1.0.0",
  speechVersion: "1.0.0",
  generatedAt: NOW,
  acceptanceCriteria: [
    { id: "AC-01", status: "pass", evidenceRef: "tests/unit/x", checkedAt: NOW },
    { id: "AC-36", status: "pass", evidenceRef: "tests/unit/y", checkedAt: NOW },
  ],
  nfrs: [{ id: "NFR-001", status: "pass" }],
  sliceGates: [{ slice: "SLC-001", status: "done" }],
  childDataPresent: false,
  secretsPresent: false,
  ...overrides,
});

describe("SLC-010-T001 — release evidence gate", () => {
  it("passes when every AC, NFR and slice gate is green and fresh", () => {
    const manifest = buildReleaseEvidence(baseInput());
    expect(manifest.gate.passed).toBe(true);
    expect(manifest.gate.reasons).toEqual([]);
    expect(manifest.schemaVersion).toBe(RELEASE_EVIDENCE_SCHEMA_VERSION);
  });

  it("fails closed when an AC is not passing", () => {
    const manifest = buildReleaseEvidence(
      baseInput({ acceptanceCriteria: [{ id: "AC-01", status: "fail", evidenceRef: "x", checkedAt: NOW }] }),
    );
    expect(manifest.gate.passed).toBe(false);
    expect(manifest.gate.reasons).toContain("AC AC-01 not passing (fail)");
  });

  it("fails closed when an AC is stale", () => {
    const manifest = buildReleaseEvidence(
      baseInput({ acceptanceCriteria: [{ id: "AC-01", status: "pass", evidenceRef: "x", checkedAt: NOW - MAX_EVIDENCE_AGE_MS - 1 }] }),
    );
    expect(manifest.gate.passed).toBe(false);
    expect(manifest.gate.reasons.some((r) => r.includes("stale"))).toBe(true);
  });

  it("fails closed on child data or secrets", () => {
    expect(buildReleaseEvidence(baseInput({ childDataPresent: true })).gate.passed).toBe(false);
    expect(buildReleaseEvidence(baseInput({ secretsPresent: true })).gate.passed).toBe(false);
  });

  it("fails closed when an NFR or slice gate is not done", () => {
    expect(buildReleaseEvidence(baseInput({ nfrs: [{ id: "NFR-001", status: "fail" }] })).gate.passed).toBe(false);
    expect(
      buildReleaseEvidence(baseInput({ sliceGates: [{ slice: "SLC-001", status: "pending" }] })).gate.passed,
    ).toBe(false);
  });

  it("carries the exact candidate SHA and all six version coordinates", () => {
    const manifest = buildReleaseEvidence(baseInput({ candidateSha: "sha-xyz" }));
    expect(manifest.candidateSha).toBe("sha-xyz");
    expect(Object.keys(manifest.versions)).toEqual([
      "app",
      "engine",
      "curriculum",
      "content",
      "prompt",
      "speech",
    ]);
  });

  it("collects every failing reason rather than stopping at the first", () => {
    const manifest = buildReleaseEvidence(
      baseInput({
        childDataPresent: true,
        secretsPresent: true,
        nfrs: [{ id: "NFR-001", status: "fail" }],
      }),
    );
    expect(manifest.gate.reasons.length).toBeGreaterThanOrEqual(3);
  });
});
