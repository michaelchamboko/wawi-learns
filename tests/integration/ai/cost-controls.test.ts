import { describe, expect, it } from "vitest";
import { reserveAiBudget } from "../../../packages/learning-engine/src/index";

const NOW = 1_700_000_000_000;

describe("SLC-006-T005 — AI cost controls", () => {
  it("denies when the monthly cap has been exceeded", () => {
    const decision = reserveAiBudget({
      monthlyCapUsd: 10,
      spentUsd: 10,
      circuitOpen: false,
      consecutiveFailures: 0,
      failureThreshold: 5,
      recentRequestDigest: null,
      candidateDigest: "d1",
      lastRequestAt: null,
      now: NOW,
      minIntervalMs: 1000,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("cap-exceeded");
  });

  it("denies when the circuit breaker is open", () => {
    const decision = reserveAiBudget({
      monthlyCapUsd: 100,
      spentUsd: 0,
      circuitOpen: true,
      consecutiveFailures: 0,
      failureThreshold: 5,
      recentRequestDigest: null,
      candidateDigest: "d1",
      lastRequestAt: null,
      now: NOW,
      minIntervalMs: 1000,
    });
    expect(decision.reason).toBe("circuit-open");
  });

  it("opens the circuit after the consecutive-failure threshold", () => {
    const decision = reserveAiBudget({
      monthlyCapUsd: 100,
      spentUsd: 0,
      circuitOpen: false,
      consecutiveFailures: 5,
      failureThreshold: 5,
      recentRequestDigest: null,
      candidateDigest: "d1",
      lastRequestAt: null,
      now: NOW,
      minIntervalMs: 1000,
    });
    expect(decision.reason).toBe("circuit-open");
  });

  it("dedupes an identical request digest inside the debounce window", () => {
    const decision = reserveAiBudget({
      monthlyCapUsd: 100,
      spentUsd: 0,
      circuitOpen: false,
      consecutiveFailures: 0,
      failureThreshold: 5,
      recentRequestDigest: "d1",
      candidateDigest: "d1",
      lastRequestAt: NOW - 100,
      now: NOW,
      minIntervalMs: 1000,
    });
    expect(decision.reason).toBe("duplicate-recent");
  });

  it("allows a fresh request after the debounce window", () => {
    const decision = reserveAiBudget({
      monthlyCapUsd: 100,
      spentUsd: 0,
      circuitOpen: false,
      consecutiveFailures: 0,
      failureThreshold: 5,
      recentRequestDigest: "d1",
      candidateDigest: "d2",
      lastRequestAt: NOW - 5000,
      now: NOW,
      minIntervalMs: 1000,
    });
    expect(decision.allowed).toBe(true);
  });
});