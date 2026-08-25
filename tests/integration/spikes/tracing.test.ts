import { describe, expect, it } from "vitest";
import {
  scoreTrace,
  type FormationCorridor,
  type TraceSample,
} from "../../../packages/tracing/src/index";

const formation: FormationCorridor = {
  mask: [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 30, y: 10 },
    { x: 40, y: 10 },
  ],
  bbox: { x: 0, y: 0, width: 50, height: 30 },
};

const samples = (points: Array<[number, number]>): TraceSample[] =>
  points.map(([x, y], timestamp) => ({ x, y, timestamp }));

describe("SLC-001-T004 — tracing spike", () => {
  it("rejects an incomplete stroke instead of treating it as completed", () => {
    const result = scoreTrace([], formation);

    expect(result).toMatchObject({
      passed: false,
      completion: false,
      reason: "too-few-samples",
    });
  });

  it("rejects a stroke that starts away from the first waypoint", () => {
    const result = scoreTrace(
      samples([
        [45, 25],
        [40, 10],
        [30, 10],
        [20, 10],
      ]),
      formation,
    );

    expect(result.passed).toBe(false);
    expect(["wrong-start", "below-coverage-or-corridor"]).toContain(result.reason);
  });

  it("keeps the score unchanged when stylus metadata is absent", () => {
    const withoutMetadata = samples([
      [10, 10],
      [20, 10],
      [30, 10],
      [40, 10],
    ]);
    const withMetadata = withoutMetadata.map((sample) => ({
      ...sample,
      pressure: 0.5,
      handedness: "left" as const,
    }));

    expect(scoreTrace(withoutMetadata, formation)).toEqual(
      scoreTrace(withMetadata, formation),
    );
  });
});
