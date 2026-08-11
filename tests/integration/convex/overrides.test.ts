import { describe, expect, it } from "vitest";
import {
  applyOverrides,
  overrideGrantsEvidence,
  type ParentOverride,
} from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;

const override = (overrides: Partial<ParentOverride> & Pick<ParentOverride, "kind">): ParentOverride => ({
  id: "ov-1",
  childProfileId: "child-1",
  parentId: "parent-1",
  value: "true",
  recordedAt: NOW,
  audit: "set by parent",
  ...overrides,
});

describe("SLC-008-T003 — parent overrides", () => {
  it("applies the latest override per kind", () => {
    const out = applyOverrides({
      childProfileId: "child-1",
      now: NOW,
      overrides: [
        override({ kind: "target-minutes", value: "15", recordedAt: NOW - 1000 }),
        override({ kind: "target-minutes", value: "25", recordedAt: NOW }),
      ],
    });
    expect(out.targetDailyMinutes).toBe(25);
  });

  it("rejects an out-of-range target minutes override", () => {
    const out = applyOverrides({
      childProfileId: "child-1",
      now: NOW,
      overrides: [override({ kind: "target-minutes", value: "0" })],
    });
    expect(out.targetDailyMinutes).toBe(20);
  });

  it("mic-disable only reduces permissions", () => {
    const out = applyOverrides({
      childProfileId: "child-1",
      now: NOW,
      overrides: [override({ kind: "mic-disable", value: "true" })],
    });
    expect(out.micEnabled).toBe(false);
  });

  it("never grants evidence from any override", () => {
    expect(overrideGrantsEvidence(override({ kind: "difficulty", value: "stretch" }))).toBe(false);
    expect(overrideGrantsEvidence(override({ kind: "target-minutes", value: "30" }))).toBe(false);
  });

  it("ignores overrides that target a different child profile", () => {
    const out = applyOverrides({
      childProfileId: "child-1",
      now: NOW,
      overrides: [override({ kind: "target-minutes", value: "10", childProfileId: "child-other" })],
    });
    expect(out.targetDailyMinutes).toBe(20);
  });

  it("disabling all activities leaves the lesson context with empty activity list", () => {
    const out = applyOverrides({
      childProfileId: "child-1",
      now: NOW,
      overrides: [
        override({ kind: "activity-disable", value: "picture-word" }),
        override({ kind: "activity-disable", value: "tile" }),
      ],
    });
    expect(out.activityDisabled).toEqual(["picture-word", "tile"]);
  });
});