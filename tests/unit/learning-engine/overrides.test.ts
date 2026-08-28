import { describe, expect, it } from "vitest";
import { applyOverrides, overrideGrantsEvidence, type ParentOverride } from "../../../packages/learning-engine/src/overrides";

const NOW = 1_700_000_000_000;
const override = (overrides: Partial<ParentOverride> & Pick<ParentOverride, "kind">): ParentOverride => ({
  id: `o-${Math.random().toString(36).slice(2)}`,
  childProfileId: "child-1",
  parentId: "parent-1",
  value: "true",
  recordedAt: NOW,
  audit: "parent-verified-2025",
  ...overrides,
});

describe("SLC-008-T003 — audited parent controls", () => {
  it("applies the latest valid override per kind without granting evidence", () => {
    const overrides: ParentOverride[] = [
      override({ kind: "target-minutes", value: "30", recordedAt: NOW - 1000 }),
      override({ kind: "target-minutes", value: "45", recordedAt: NOW - 500 }),
      override({ kind: "subject-balance", value: "balanced", recordedAt: NOW - 500 }),
      override({ kind: "difficulty", value: "stretch", recordedAt: NOW - 200 }),
    ];
    const applied = applyOverrides({ childProfileId: "child-1", overrides, now: NOW });
    expect(applied.targetDailyMinutes).toBe(45);
    expect(applied.subjectBalance).toBe("balanced");
    expect(applied.difficulty).toBe("stretch");
    for (const o of overrides) {
      expect(overrideGrantsEvidence(o)).toBe(false);
    }
  });

  it("rejects out-of-range target minutes and falls back to default", () => {
    const overrides: ParentOverride[] = [
      override({ kind: "target-minutes", value: "200" }),
      override({ kind: "target-minutes", value: "abc" }),
    ];
    const applied = applyOverrides({ childProfileId: "child-1", overrides, now: NOW });
    expect(applied.targetDailyMinutes).toBe(20);
  });

  it("activity-disable accumulates distinct values and never allows mic-disable to re-enable", () => {
    const overrides: ParentOverride[] = [
      override({ kind: "activity-disable", value: "speech" }),
      override({ kind: "activity-disable", value: "speech" }),
      override({ kind: "activity-disable", value: "tracing" }),
      override({ kind: "mic-disable", value: "true" }),
    ];
    const applied = applyOverrides({ childProfileId: "child-1", overrides, now: NOW });
    expect(applied.activityDisabled).toEqual(["speech", "tracing"]);
    expect(applied.micEnabled).toBe(false);
  });

  it("ignores overrides for a different child profile", () => {
    const overrides: ParentOverride[] = [
      override({ kind: "subject-balance", value: "balanced", childProfileId: "child-2" }),
    ];
    const applied = applyOverrides({ childProfileId: "child-1", overrides, now: NOW });
    expect(applied.subjectBalance).toBe("english-only");
  });
});
