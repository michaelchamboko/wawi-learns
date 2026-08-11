import { describe, expect, it } from "vitest";
import {
  ACCEPTANCE_ROWS,
  NFR_ROWS,
  buildReleaseEvidence,
} from "../../../packages/learning-engine/src/index";

describe("SLC-010-T001 — release evidence", () => {
  it("the release manifest maps 20 PRD AC rows", () => {
    expect(ACCEPTANCE_ROWS).toHaveLength(20);
  });

  it("the release manifest maps every NFR row", () => {
    expect(NFR_ROWS.length).toBeGreaterThanOrEqual(8);
  });

  it("every row declares a non-empty command and an expected exit code", () => {
    for (const row of [...ACCEPTANCE_ROWS, ...NFR_ROWS]) {
      expect(row.command.length).toBeGreaterThan(0);
      expect(row.expectedExit).toBe(0);
    }
  });

  it("the builder records every required row in missingRows", () => {
    const manifest = buildReleaseEvidence();
    expect(manifest.missingRows).toContain("AC-01");
    expect(manifest.missingRows).toContain("NFR-01");
  });

  it("the manifest is deterministic for the same now() value", () => {
    const a = buildReleaseEvidence(1_700_000_000_000);
    const b = buildReleaseEvidence(1_700_000_000_000);
    expect(a.generatedAt).toBe(b.generatedAt);
    expect(a.acceptanceRows).toEqual(b.acceptanceRows);
  });
});