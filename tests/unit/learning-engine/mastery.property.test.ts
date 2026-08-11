import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  DEFAULT_THRESHOLDS,
  projectMastery,
  type MasteryEvent,
} from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;

const arbEvent = (): fc.Arbitrary<MasteryEvent> =>
  fc.record({
    itemId: fc.constantFrom("w-cat", "w-sun", "w-sat"),
    dimension: fc.constantFrom("phonics", "spelling"),
    result: fc.constantFrom("correct", "incorrect", "partial", "skipped") as fc.Arbitrary<MasteryEvent["result"]>,
    hintCount: fc.integer({ min: 0, max: 4 }),
    occurredAt: fc.integer({ min: NOW - 60 * 60 * 1000, max: NOW }),
    modality: fc.constantFrom("visual", "audio", "tile", "tracing", "speech") as fc.Arbitrary<MasteryEvent["modality"]>,
  });

describe("SLC-004-T001 — mastery property", () => {
  it("projection is idempotent over the same event set", () => {
    fc.assert(
      fc.property(fc.array(arbEvent(), { maxLength: 50 }), (events) => {
        const a = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
        const b = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
        expect(a.map((p) => p.state).join(",")).toBe(b.map((p) => p.state).join(","));
      }),
      { numRuns: 100 },
    );
  });

  it("projection is independent of event order", () => {
    fc.assert(
      fc.property(fc.array(arbEvent(), { maxLength: 50 }), (events) => {
        const a = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
        const b = projectMastery([...events].reverse(), DEFAULT_THRESHOLDS, NOW);
        expect(a.map((p) => p.state).join(",")).toBe(b.map((p) => p.state).join(","));
      }),
      { numRuns: 100 },
    );
  });

  it("projection only counts non-skipped events for mastery thresholds", () => {
    fc.assert(
      fc.property(fc.array(arbEvent(), { maxLength: 30 }), (events) => {
        const projection = projectMastery(events, DEFAULT_THRESHOLDS, NOW);
        for (const p of projection) {
          const itemEvents = events.filter((e) => e.itemId === p.itemId);
          const effectiveCorrect = itemEvents.filter(
            (e) => e.result === "correct" && e.hintCount < 3,
          ).length;
          expect(p.correctCount).toBe(effectiveCorrect);
        }
      }),
      { numRuns: 100 },
    );
  });
});