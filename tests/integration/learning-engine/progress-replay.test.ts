import { describe, expect, it } from "vitest";
import {
  buildProgressWindows,
  classifyProgress,
  type MasteryEvent,
  type BuildProgressWindowsInput,
} from "../../../packages/learning-engine/src/index";

// Africa/Johannesburg is UTC+2. A fixed deterministic date mapper for fixtures.
const day = (ms: number): string => {
  const d = new Date(ms + 2 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const NOW = Date.UTC(2026, 7, 20, 10, 0, 0); // 2026-08-20T10:00:00Z
const BASELINE = Date.UTC(2026, 7, 6, 10, 0, 0);

const ev = (
  overrides: Partial<MasteryEvent> & Pick<MasteryEvent, "itemId" | "dimension">,
): MasteryEvent => ({
  result: "correct",
  hintCount: 0,
  occurredAt: NOW - 1000,
  modality: "visual",
  ...overrides,
});

const input = (
  events: MasteryEvent[],
  over: Partial<BuildProgressWindowsInput> = {},
): BuildProgressWindowsInput => ({
  baselineAt: BASELINE,
  events,
  now: () => NOW,
  toJohannesburgDate: day,
  ...over,
});

describe("SLC-004-T003 — progress windows (replay integration)", () => {
  it("returns all-dimensions no-baseline windows when baseline is absent", () => {
    const windows = buildProgressWindows(input([], { baselineAt: null }));
    expect(windows.every((w) => w.fromDay === "(no-baseline)")).toBe(true);
  });

  it("builds anchored windows only for dimensions with eligible events", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-1", dimension: "phonics", occurredAt: BASELINE + 1000 }),
      ev({ itemId: "w-2", dimension: "phonics", occurredAt: BASELINE + 2000 }),
      ev({ itemId: "s-1", dimension: "reading", occurredAt: BASELINE + 3000 }),
    ];
    const windows = buildProgressWindows(input(events));
    const dims = windows.map((w) => w.dimension).sort();
    expect(dims).toEqual(["phonics", "reading"]);
    expect(windows[0]?.fromDay).toBe(day(BASELINE));
  });

  it("classifies a high-accuracy window set as maintenance, never fabricated trend", () => {
    const events: MasteryEvent[] = Array.from({ length: 10 }, (_, i) =>
      ev({
        itemId: `w-${i}`,
        dimension: "phonics",
        occurredAt: BASELINE + i * ONE_DAY_MS,
        result: i < 9 ? "correct" : "incorrect",
      }),
    );
    const windows = buildProgressWindows(input(events));
    expect(classifyProgress(windows)).toBe("maintenance");
  });

  it("classifies a low-accuracy window set as intervention", () => {
    const events: MasteryEvent[] = Array.from({ length: 10 }, (_, i) =>
      ev({
        itemId: `w-${i}`,
        dimension: "phonics",
        occurredAt: BASELINE + i * ONE_DAY_MS,
        result: i < 2 ? "correct" : "incorrect",
      }),
    );
    const windows = buildProgressWindows(input(events));
    expect(classifyProgress(windows)).toBe("intervention");
  });

  it("returns insufficient rather than a false trend when below the session minimum", () => {
    const events: MasteryEvent[] = [
      ev({ itemId: "w-1", dimension: "phonics", occurredAt: BASELINE + 1000 }),
      ev({ itemId: "w-2", dimension: "phonics", occurredAt: BASELINE + 2000 }),
    ];
    const windows = buildProgressWindows(input(events, { minimumSessions: 7 }));
    expect(classifyProgress(windows)).toBe("insufficient");
  });

  it("never double-counts an event across overlapping windows (windows are non-overlapping)", () => {
    const events: MasteryEvent[] = Array.from({ length: 14 }, (_, i) =>
      ev({ itemId: `w-${i}`, dimension: "phonics", occurredAt: BASELINE + i * 60_000 }),
    );
    const windows = buildProgressWindows(input(events));
    const totalCounted = windows.reduce(
      (acc, w) => acc + w.correctCount + w.incorrectCount + w.partialCount + w.skippedCount,
      0,
    );
    expect(totalCounted).toBe(events.length);
  });
});
