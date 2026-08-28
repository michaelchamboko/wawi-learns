/**
 * Parent dashboard projection (SLC-008-T002).
 *
 * Pure, deterministic. Combines mastery projections, reward events and
 * sync/pack state into a ParentDashboard packet that the UI can render
 * without ever having to invent numbers. The AI summary path is left to
 * the content engine; this module only prepares the facts the summary
 * must remain faithful to.
 */
import type { MasteryDimension, MasteryProjection } from "./mastery";

export type DashboardDimension = MasteryDimension;
export type DashboardWindow = "baseline" | "week" | "month";

export interface DashboardEvidence {
  readonly itemId: string;
  readonly dimension: DashboardDimension;
  readonly result: "correct" | "incorrect" | "partial" | "skipped";
  readonly occurredAt: number;
  readonly hintCount: number;
  readonly modality: "visual" | "audio" | "tracing" | "speech" | "tile";
  readonly sourceEventId: string;
}

export interface DashboardWeakReason {
  readonly itemId: string;
  readonly dimension: DashboardDimension;
  readonly reason: string;
  readonly recentIncorrect: number;
  readonly recentCorrect: number;
}

export interface DashboardSummary {
  readonly childProfileId: string;
  readonly generatedAt: number;
  readonly window: DashboardWindow;
  readonly totalAttempts: number;
  readonly correctRate: number;
  readonly byDimension: readonly { dimension: DashboardDimension; correct: number; incorrect: number; mastery: string }[];
  readonly weakReasons: readonly DashboardWeakReason[];
  readonly projections: readonly MasteryProjection[];
  readonly packState: "ok" | "missing" | "stale" | "revoked";
  readonly syncState: "ok" | "gap" | "out-of-order" | "stale";
  readonly evidence: readonly DashboardEvidence[];
  readonly insufficient: boolean;
  readonly uncertainty: readonly string[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS: Record<DashboardWindow, number> = {
  baseline: 30 * ONE_DAY_MS,
  week: 7 * ONE_DAY_MS,
  month: 30 * ONE_DAY_MS,
};

const RECENT_WINDOW_MS = 7 * ONE_DAY_MS;
const WEAK_REASON_INCORRECT_THRESHOLD = 2;

const uniqueReasons = (reasons: readonly string[]): string[] => Array.from(new Set(reasons));

export const projectParentDashboard = (params: {
  childProfileId: string;
  evidence: readonly DashboardEvidence[];
  projections: readonly MasteryProjection[];
  packState: DashboardSummary["packState"];
  syncState: DashboardSummary["syncState"];
  now?: number;
  window?: DashboardWindow;
}): DashboardSummary => {
  const now = params.now ?? Date.now();
  const window = params.window ?? "week";
  const cutoff = now - WINDOW_MS[window];

  const inWindow = params.evidence.filter((event) => event.occurredAt >= cutoff);
  const totalAttempts = inWindow.length;
  const correct = inWindow.filter((event) => event.result === "correct" && event.hintCount < 3).length;
  const incorrect = inWindow.filter((event) => event.result === "incorrect").length;
  const correctRate = totalAttempts === 0 ? 0 : correct / totalAttempts;

  const byDimension = (
    ["phonics", "spelling", "reading", "maths", "tracing", "speech"] as DashboardDimension[]
  ).map((dimension) => {
    const events = inWindow.filter((event) => event.dimension === dimension);
    const dimCorrect = events.filter((event) => event.result === "correct" && event.hintCount < 3).length;
    const dimIncorrect = events.filter((event) => event.result === "incorrect").length;
    const mastery = params.projections.find((p) => p.itemId.startsWith(dimension))?.state ?? "new";
    return { dimension, correct: dimCorrect, incorrect: dimIncorrect, mastery };
  });

  const weakReasons: DashboardWeakReason[] = [];
  for (const projection of params.projections) {
    if (projection.state !== "learning" && projection.state !== "relearning") continue;
    const itemEvents = inWindow.filter((event) => event.itemId === projection.itemId);
    if (itemEvents.length === 0) continue;
    const recentIncorrect = itemEvents.filter(
      (event) => event.result === "incorrect" && now - event.occurredAt <= RECENT_WINDOW_MS,
    ).length;
    if (recentIncorrect < WEAK_REASON_INCORRECT_THRESHOLD) continue;
    const recentCorrect = itemEvents.filter(
      (event) => event.result === "correct" && now - event.occurredAt <= RECENT_WINDOW_MS,
    ).length;
    weakReasons.push({
      itemId: projection.itemId,
      dimension: (itemEvents[0]?.dimension ?? "phonics") as DashboardDimension,
      reason: projection.reason,
      recentIncorrect,
      recentCorrect,
    });
  }

  const uncertainty: string[] = [];
  if (params.packState === "missing") uncertainty.push("pack-missing");
  if (params.packState === "stale") uncertainty.push("pack-stale");
  if (params.packState === "revoked") uncertainty.push("pack-revoked");
  if (params.syncState !== "ok") uncertainty.push(`sync-${params.syncState}`);
  if (totalAttempts < 5) uncertainty.push("insufficient-data");

  return {
    childProfileId: params.childProfileId,
    generatedAt: now,
    window,
    totalAttempts,
    correctRate,
    byDimension,
    weakReasons,
    projections: params.projections,
    packState: params.packState,
    syncState: params.syncState,
    evidence: inWindow,
    insufficient: totalAttempts < 5,
    uncertainty: uniqueReasons(uncertainty),
  };
};

export const dashboardClaimsAreBackedByEvidence = (summary: DashboardSummary): boolean => {
  if (summary.uncertainty.length > 0) return false;
  if (summary.evidence.length < 5) return false;
  return summary.projections.every((projection) => {
    if (projection.state === "mastered") {
      return summary.evidence.some(
        (event) => event.itemId === projection.itemId && event.result === "correct" && event.hintCount < 3,
      );
    }
    return true;
  });
};
