import { describe, expect, it } from "vitest";
import { assessmentHasRequiredCoverage } from "../../../convex/assessments";

type Candidate = { id: string; version: number; status: "open" | "completed" | "incomplete" };

const createAssessmentHistory = () => {
  const candidates: Candidate[] = [];
  let activeId: string | undefined;
  return {
    start: () => {
      const candidate = { id: `candidate-${candidates.length + 1}`, version: candidates.length + 1, status: "open" as const };
      candidates.push(candidate);
      return candidate;
    },
    skip: (candidate: Candidate) => { candidate.status = "incomplete"; },
    complete: (candidate: Candidate, dimensions: string[]) => {
      if (assessmentHasRequiredCoverage(dimensions)) {
        candidate.status = "completed";
        activeId = candidate.id;
      }
    },
    candidates,
    active: () => activeId,
  };
};

describe("SLC-002-T004 — assessment candidate lifecycle", () => {
  it("requires all dimensions before activating a candidate", () => {
    expect(assessmentHasRequiredCoverage(["phonics", "spelling", "reading"])).toBe(false);
    expect(assessmentHasRequiredCoverage(["phonics", "spelling", "reading", "maths"])).toBe(true);
  });

  it("retains versions, preserves the active baseline on restart, and activates only completion", () => {
    const history = createAssessmentHistory();
    const first = history.start();
    history.complete(first, ["phonics", "spelling", "reading", "maths"]);
    expect(history.active()).toBe(first.id);
    const restarted = history.start();
    expect(restarted.version).toBe(2);
    expect(history.candidates).toHaveLength(2);
    expect(history.active()).toBe(first.id);
    history.skip(restarted);
    expect(restarted.status).toBe("incomplete");
    expect(history.active()).toBe(first.id);
  });
});
