import { describe, expect, it } from "vitest";
import {
  scoreTrace,
  DEFAULT_TRACE_TOLERANCE,
  type FormationCorridor,
  type TraceSample,
} from "../../../packages/tracing/src/index";

// A simple horizontal corridor: bbox 0..100 x 0..40, mask a row of points.
const formation: FormationCorridor = {
  bbox: { x: 0, y: 0, width: 100, height: 40 },
  mask: Array.from({ length: 21 }, (_, i) => ({ x: i * 5, y: 20 })),
};

const trace = (points: Array<[number, number]>): TraceSample[] =>
  points.map(([x, y], i) => ({ x, y, timestamp: i * 16 }));

describe("SLC-005-T001 — tracing score", () => {
  it("returns no-pass with too few samples", () => {
    const score = scoreTrace([{ x: 0, y: 20, timestamp: 0 }], formation);
    expect(score.passed).toBe(false);
    expect(score.reason).toBe("too-few-samples");
    expect(score.completion).toBe(false);
  });

  it("passes a clean trace that covers and stays in the corridor", () => {
    // Dense samples filling the bbox (100x40 -> 9x4 = 36 cells of 12px),
    // beginning on the corridor near the first waypoint [0,20].
    const points: Array<[number, number]> = [[2, 20]];
    for (let x = 2; x <= 98; x += 8) {
      for (let y = 4; y <= 36; y += 10) points.push([x, y]);
    }
    const samples = trace(points);
    const score = scoreTrace(samples, formation);
    expect(score.coverage).toBeGreaterThanOrEqual(DEFAULT_TRACE_TOLERANCE.coverageFloor);
    expect(score.corridor).toBeGreaterThanOrEqual(DEFAULT_TRACE_TOLERANCE.corridorFloor);
    expect(score.start).toBeGreaterThanOrEqual(DEFAULT_TRACE_TOLERANCE.startFloor);
    expect(score.passed).toBe(true);
    expect(score.reason).toBe("passed");
  });

  it("fails a trace that starts far from the first waypoint", () => {
    // Covers the corridor well (so completion passes) but begins at the far end.
    const points: Array<[number, number]> = [];
    for (let x = 98; x >= 2; x -= 8) for (let y = 4; y <= 36; y += 10) points.push([x, y]);
    const samples = trace(points);
    const score = scoreTrace(samples, formation);
    expect(score.completion).toBe(true); // coverage + corridor met
    expect(score.start).toBeLessThan(DEFAULT_TRACE_TOLERANCE.startFloor);
    expect(score.passed).toBe(false);
    expect(score.reason).toBe("wrong-start");
  });

  it("fails a trace with poor coverage (skips most of the bbox)", () => {
    const samples = trace([
      [2, 20],
      [4, 20],
      [6, 20],
      [8, 20],
      [10, 20],
      [12, 20],
    ]);
    const score = scoreTrace(samples, formation);
    expect(score.coverage).toBeLessThan(DEFAULT_TRACE_TOLERANCE.coverageFloor);
    expect(score.passed).toBe(false);
  });

  it("never returns negative components (safe for downstream rendering)", () => {
    const samples = trace([
      [0, 20],
      [100, 20],
    ]);
    const score = scoreTrace(samples, formation);
    for (const v of [score.coverage, score.corridor, score.start, score.direction]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
