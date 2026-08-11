import { describe, expect, it } from "vitest";
import {
  buildProgressWindows,
  classifyProgress,
  type MasteryEvent,
} from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;
const BASELINE = NOW - 14 * 24 * 60 * 60 * 1000;

const toDate = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

const ev = (overrides: Partial<MasteryEvent> & Pick<MasteryEvent, "itemId" | "dimension">): MasteryEvent => ({
  result: "correct",
  hintCount: 0,
  occurredAt: NOW - 1000,
  modality: "visual",
  ...overrides,
});

describe("SLC-004-T003 — progress windows", () => {
  it("returns 'insufficient' when no baseline exists", () => {
    const windows = buildProgressWindows({
      baselineAt: null,
      events: [],
      now: () => NOW,
      toJohannesburgDate: toDate,
    });
    expect(windows.every((w) => w.eligibleSessionCount === 0)).toBe(true);
  });

  it("counts eligible sessions by unique calendar days", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: NOW - 1000 }),
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: NOW - 2000 }),
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: NOW - 24 * 60 * 60 * 1000 }),
    ];
    const windows = buildProgressWindows({
      baselineAt: BASELINE,
      events,
      now: () => NOW,
      toJohannesburgDate: toDate,
    });
    const phonics = windows.find((w) => w.dimension === "phonics");
    expect(phonics?.eligibleSessionCount).toBe(2);
  });

  it("classifies 'maintenance' when accuracy is high across windows", () => {
    const windows = [
      { dimension: "phonics", fromDay: "d1", toDay: "d14", eligibleSessionCount: 8, correctCount: 30, incorrectCount: 1, partialCount: 0, skippedCount: 0 },
      { dimension: "spelling", fromDay: "d1", toDay: "d14", eligibleSessionCount: 8, correctCount: 28, incorrectCount: 2, partialCount: 0, skippedCount: 0 },
    ] as const;
    expect(classifyProgress(windows)).toBe("maintenance");
  });

  it("classifies 'improving' when accuracy is between 60% and 85%", () => {
    const windows = [
      { dimension: "phonics", fromDay: "d1", toDay: "d14", eligibleSessionCount: 8, correctCount: 18, incorrectCount: 6, partialCount: 0, skippedCount: 0 },
    ] as const;
    expect(classifyProgress(windows)).toBe("improving");
  });

  it("classifies 'intervention' when accuracy is below 60%", () => {
    const windows = [
      { dimension: "phonics", fromDay: "d1", toDay: "d14", eligibleSessionCount: 8, correctCount: 8, incorrectCount: 12, partialCount: 0, skippedCount: 0 },
    ] as const;
    expect(classifyProgress(windows)).toBe("intervention");
  });

  it("classifies 'insufficient' when fewer than 7 eligible sessions exist", () => {
    const windows = [
      { dimension: "phonics", fromDay: "d1", toDay: "d14", eligibleSessionCount: 4, correctCount: 10, incorrectCount: 0, partialCount: 0, skippedCount: 0 },
    ] as const;
    expect(classifyProgress(windows)).toBe("insufficient");
  });

  it("non-overlapping windows: events outside the baseline are not counted", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-cat", dimension: "phonics", occurredAt: BASELINE - 1000 }),
    ];
    const windows = buildProgressWindows({
      baselineAt: BASELINE,
      events,
      now: () => NOW,
      toJohannesburgDate: toDate,
    });
    expect(windows.find((w) => w.dimension === "phonics")).toBeUndefined();
  });
});