import { describe, expect, it } from "vitest";
import { projectMastery, type MasteryEvent } from "../../../packages/learning-engine/src/mastery";
import {
  dashboardClaimsAreBackedByEvidence,
  projectParentDashboard,
  type DashboardEvidence,
} from "../../../packages/learning-engine/src/parent-dashboard";

const NOW = 1_700_000_000_000;
const ONE_DAY = 24 * 60 * 60 * 1000;

const event = (overrides: Partial<MasteryEvent> & Pick<MasteryEvent, "itemId">): MasteryEvent => ({
  dimension: "phonics",
  result: "correct",
  hintCount: 0,
  occurredAt: NOW,
  modality: "visual",
  ...overrides,
});

const evidence = (overrides: Partial<DashboardEvidence> & Pick<DashboardEvidence, "itemId">): DashboardEvidence => ({
  dimension: "phonics",
  result: "correct",
  occurredAt: NOW,
  hintCount: 0,
  modality: "visual",
  sourceEventId: `src-${overrides.itemId}`,
  ...overrides,
});

describe("SLC-008-T002 — parent dashboard projection", () => {
  it("reports the correct rate, by-dimension totals and weak reasons from evidence", () => {
    const events: MasteryEvent[] = [
      event({ itemId: "phonics-weak", result: "incorrect" }),
      event({ itemId: "phonics-weak", result: "incorrect" }),
      event({ itemId: "phonics-weak", result: "incorrect" }),
      event({ itemId: "phonics-strong", result: "correct" }),
      event({ itemId: "phonics-strong", result: "correct" }),
      event({ itemId: "phonics-strong", result: "correct" }),
    ];
    const projection = projectMastery(events, undefined, NOW);
    const packet: DashboardEvidence[] = events.map((e) =>
      evidence({
        itemId: e.itemId,
        dimension: e.dimension,
        result: e.result,
        occurredAt: e.occurredAt,
        hintCount: e.hintCount,
        modality: e.modality,
      }),
    );
    const dashboard = projectParentDashboard({
      childProfileId: "child-1",
      evidence: packet,
      projections: projection,
      packState: "ok",
      syncState: "ok",
      now: NOW,
    });
    expect(dashboard.totalAttempts).toBe(6);
    expect(dashboard.correctRate).toBe(0.5);
    expect(dashboard.byDimension[0]).toMatchObject({ dimension: "phonics", correct: 3, incorrect: 3 });
    expect(dashboard.uncertainty).toEqual([]);
    expect(dashboard.weakReasons.length).toBeGreaterThan(0);
    expect(dashboard.weakReasons[0]?.itemId).toBe("phonics-weak");
  });

  it("insufficient data, late sync and revoked pack all surface uncertainty", () => {
    const dashboard = projectParentDashboard({
      childProfileId: "child-1",
      evidence: [evidence({ itemId: "phonics-1" })],
      projections: [],
      packState: "revoked",
      syncState: "gap",
      now: NOW,
    });
    expect(dashboard.insufficient).toBe(true);
    expect(dashboard.uncertainty).toEqual(
      expect.arrayContaining(["insufficient-data", "pack-revoked", "sync-gap"]),
    );
    expect(dashboardClaimsAreBackedByEvidence(dashboard)).toBe(false);
  });

  it("baseline window extends to thirty days without losing mastery state", () => {
    const events: MasteryEvent[] = Array.from(
      { length: 8 },
      (_, index) => event({ itemId: "maths-1", dimension: "maths", occurredAt: NOW - index * ONE_DAY }),
    );
    const projections = projectMastery(events, undefined, NOW);
    const packet: DashboardEvidence[] = events.map((e) => evidence({ itemId: e.itemId, dimension: e.dimension, occurredAt: e.occurredAt }));
    const baseline = projectParentDashboard({
      childProfileId: "child-1",
      evidence: packet,
      projections,
      packState: "ok",
      syncState: "ok",
      now: NOW,
      window: "baseline",
    });
    expect(baseline.window).toBe("baseline");
    expect(baseline.totalAttempts).toBe(8);
    expect(baseline.byDimension.find((row) => row.dimension === "maths")?.correct).toBe(8);
  });

  it("a missed day does not generate any false retention claim", () => {
    const dashboard = projectParentDashboard({
      childProfileId: "child-1",
      evidence: [],
      projections: [],
      packState: "ok",
      syncState: "ok",
      now: NOW,
    });
    expect(dashboard.totalAttempts).toBe(0);
    expect(dashboard.correctRate).toBe(0);
    expect(dashboard.weakReasons).toEqual([]);
    expect(dashboard.uncertainty).toContain("insufficient-data");
  });
});
