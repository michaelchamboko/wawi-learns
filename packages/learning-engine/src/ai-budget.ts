/**
 * AI cost controls (SLC-006-T005).
 * The cap, circuit breaker, and dedupe key are explicit and deterministic.
 */
export interface AiBudgetDecision {
  readonly allowed: boolean;
  readonly remainingUsd: number;
  readonly reason: "ok" | "cap-exceeded" | "circuit-open" | "duplicate-recent" | "rate-limited";
}

export interface ReserveBudgetInput {
  readonly monthlyCapUsd: number;
  readonly spentUsd: number;
  readonly circuitOpen: boolean;
  readonly consecutiveFailures: number;
  readonly failureThreshold: number;
  readonly recentRequestDigest: string | null;
  readonly candidateDigest: string;
  readonly lastRequestAt: number | null;
  readonly now: number;
  readonly minIntervalMs: number;
}

export const reserveAiBudget = (input: ReserveBudgetInput): AiBudgetDecision => {
  const remaining = Math.max(0, input.monthlyCapUsd - input.spentUsd);
  if (remaining <= 0) {
    return { allowed: false, remainingUsd: 0, reason: "cap-exceeded" };
  }
  if (input.circuitOpen || input.consecutiveFailures >= input.failureThreshold) {
    return { allowed: false, remainingUsd: remaining, reason: "circuit-open" };
  }
  if (
    input.recentRequestDigest === input.candidateDigest &&
    input.lastRequestAt !== null &&
    input.now - input.lastRequestAt < input.minIntervalMs
  ) {
    return { allowed: false, remainingUsd: remaining, reason: "duplicate-recent" };
  }
  if (
    input.lastRequestAt !== null &&
    input.now - input.lastRequestAt < Math.max(50, input.minIntervalMs / 2)
  ) {
    return { allowed: false, remainingUsd: remaining, reason: "rate-limited" };
  }
  return { allowed: true, remainingUsd: remaining, reason: "ok" };
};