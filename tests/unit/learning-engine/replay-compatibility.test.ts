import { describe, expect, it } from "vitest";
import {
  DEFAULT_THRESHOLDS,
  projectMastery,
  type MasteryEvent,
} from "../../../packages/learning-engine/src/index";
import { pinSessionVersions } from "../../../packages/learning-engine/src/version-pin";

/**
 * SLC-004-T001 — migration / replay compatibility.
 *
 * Old persisted event fixtures must replay to identical projections under the
 * current engine version. This guards against silently changing mastery
 * semantics on a rule/engine-version bump: a re-cutover over historical events
 * must not fabricate or erase mastery states.
 */

const NOW = 1_700_000_000_000;

// A fixed "old" event log, as it would be persisted by an earlier engine build.
const LEGACY_FIXTURE: readonly MasteryEvent[] = [
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 9_000, modality: "visual" },
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 8_000, modality: "visual" },
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 1, occurredAt: NOW - 7_000, modality: "audio" },
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 6_000, modality: "tile" },
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 5_000, modality: "speech" },
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 4_000, modality: "tracing" },
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 3_000, modality: "visual" },
  { itemId: "w-cat", dimension: "phonics", result: "correct", hintCount: 0, occurredAt: NOW - 2_000, modality: "audio" },
  { itemId: "w-cat", dimension: "phonics", result: "skipped", hintCount: 0, occurredAt: NOW - 1_000, modality: "visual" },
  { itemId: "s-sun", dimension: "reading", result: "correct", hintCount: 0, occurredAt: NOW - 9_000, modality: "visual" },
  { itemId: "s-sun", dimension: "reading", result: "correct", hintCount: 0, occurredAt: NOW - 8_000, modality: "audio" },
  { itemId: "m-add", dimension: "maths", result: "incorrect", hintCount: 0, occurredAt: NOW - 9_000, modality: "visual" },
  { itemId: "m-add", dimension: "maths", result: "correct", hintCount: 0, occurredAt: NOW - 8_000, modality: "visual" },
  { itemId: "m-add", dimension: "maths", result: "correct", hintCount: 0, occurredAt: NOW - 7_000, modality: "tile" },
  { itemId: "m-add", dimension: "maths", result: "correct", hintCount: 0, occurredAt: NOW - 6_000, modality: "visual" },
];

const expectedProjection = () =>
  projectMastery(LEGACY_FIXTURE, DEFAULT_THRESHOLDS, NOW);

describe("SLC-004-T001 — replay-compatibility / migration", () => {
  it("replays the legacy fixture to a stable, expected projection", () => {
    const p = expectedProjection();
    const byItem = new Map(p.map((x) => [x.itemId, x]));
    expect(byItem.get("w-cat")?.state).toBe("mastered");
    expect(byItem.get("s-sun")?.state).toBe("practising");
    expect(byItem.get("m-add")?.state).toBe("practising");
  });

  it("replays identically regardless of input ordering (no migration drift)", () => {
    const base = expectedProjection();
    const reordered = [...LEGACY_FIXTURE].reverse();
    expect(projectMastery(reordered, DEFAULT_THRESHOLDS, NOW)).toEqual(base);
  });

  it("old events never fabricate mastery under the current engine pin", () => {
    const result = pinSessionVersions({
      snapshot: {
        shellRevision: "shell-v1",
        engineVersion: "engine-1",
        packVersion: "0.1.0",
        schemaVersion: "1.0.0",
        overlayRevision: null,
      },
    });
    expect(result.ok).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("preserves evidence immutability: replay does not mutate or drop events", () => {
    const before = JSON.stringify(LEGACY_FIXTURE);
    projectMastery(LEGACY_FIXTURE, DEFAULT_THRESHOLDS, NOW);
    expect(JSON.stringify(LEGACY_FIXTURE)).toBe(before);
  });
});
