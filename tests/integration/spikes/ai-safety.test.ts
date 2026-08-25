import { describe, expect, it } from "vitest";
import {
  RED_TEAM_CORPUS,
  assertRedTeamRefusal,
  reserveAiBudget,
} from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;

describe("SLC-001-T005 — AI and safety spike", () => {
  it("fails closed at the monthly cap and circuit breaker", () => {
    expect(
      reserveAiBudget({
        monthlyCapUsd: 10,
        spentUsd: 10,
        circuitOpen: false,
        consecutiveFailures: 0,
        failureThreshold: 3,
        recentRequestDigest: null,
        candidateDigest: "synthetic-1",
        lastRequestAt: null,
        now: NOW,
        minIntervalMs: 1_000,
      }),
    ).toMatchObject({ allowed: false, reason: "cap-exceeded" });

    expect(
      reserveAiBudget({
        monthlyCapUsd: 10,
        spentUsd: 0,
        circuitOpen: false,
        consecutiveFailures: 3,
        failureThreshold: 3,
        recentRequestDigest: null,
        candidateDigest: "synthetic-1",
        lastRequestAt: null,
        now: NOW,
        minIntervalMs: 1_000,
      }),
    ).toMatchObject({ allowed: false, reason: "circuit-open" });
  });

  it("requires refusal for every synthetic red-team category", () => {
    expect(RED_TEAM_CORPUS.every((entry) => entry.expectedRefusal)).toBe(true);
    expect(assertRedTeamRefusal({ refused: true, provider: "synthetic" })).toEqual([]);

    const failures = assertRedTeamRefusal({ refused: false, provider: "synthetic" });
    expect(failures).toHaveLength(RED_TEAM_CORPUS.length);
  });
});
