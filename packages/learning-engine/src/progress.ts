import { type MasteryEvent, type MasteryProjection, type MasteryDimension } from "./mastery";

export type ProgressClassification =
  | "insufficient"
  | "maintenance"
  | "improving"
  | "intervention";

export interface ProgressWindow {
  readonly dimension: MasteryDimension;
  readonly fromDay: string; // ISO date in Africa/Johannesburg
  readonly toDay: string;
  readonly eligibleSessionCount: number;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly partialCount: number;
  readonly skippedCount: number;
}

export interface BuildProgressWindowsInput {
  readonly baselineAt: number | null;
  readonly events: readonly MasteryEvent[];
  readonly now: () => number;
  /** Returns the ISO date for a given UTC ms timestamp, in Africa/Johannesburg. */
  readonly toJohannesburgDate: (timestamp: number) => string;
  readonly minimumSessions?: number;
  readonly minimumEligibleEvents?: number;
  readonly windowDays?: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const windowDaysConst = 14;

export const buildProgressWindows = (
  input: BuildProgressWindowsInput,
): readonly ProgressWindow[] => {
  const minimumSessions = input.minimumSessions ?? 7;
  const minimumEligibleEvents = input.minimumEligibleEvents ?? 7;
  const windowDays = input.windowDays ?? 14;
  const dimensions: MasteryDimension[] = [
    "phonics",
    "spelling",
    "reading",
    "maths",
    "tracing",
    "speech",
  ];

  if (!input.baselineAt) {
    return dimensions.map((d) => ({
      dimension: d,
      fromDay: "(no-baseline)",
      toDay: "(no-baseline)",
      eligibleSessionCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      partialCount: 0,
      skippedCount: 0,
    }));
  }

  const now = input.now();
  const eligible = input.events.filter((e) => e.occurredAt >= input.baselineAt!);

  return dimensions.map((d) => {
    const events = eligible.filter((e) => e.dimension === d);
    const sessions = new Set(
      events.map((e) => input.toJohannesburgDate(e.occurredAt)),
    );

    return {
      dimension: d,
      fromDay: input.toJohannesburgDate(input.baselineAt!),
      toDay: input.toJohannesburgDate(now),
      eligibleSessionCount: sessions.size,
      correctCount: events.filter((e) => e.result === "correct").length,
      incorrectCount: events.filter((e) => e.result === "incorrect").length,
      partialCount: events.filter((e) => e.result === "partial").length,
      skippedCount: events.filter((e) => e.result === "skipped").length,
    };
  }).filter((w) => w.eligibleSessionCount > 0);
};

export const classifyProgress = (windows: readonly ProgressWindow[]): ProgressClassification => {
  if (windows.length === 0) return "insufficient";
  const totalEligible = windows.reduce((acc, w) => acc + w.eligibleSessionCount, 0);
  if (totalEligible < 7) return "insufficient";

  const totalCorrect = windows.reduce((acc, w) => acc + w.correctCount, 0);
  const totalAttempts = windows.reduce(
    (acc, w) => acc + w.correctCount + w.incorrectCount + w.partialCount,
    0,
  );
  if (totalAttempts === 0) return "maintenance";

  const accuracy = totalCorrect / totalAttempts;
  if (accuracy >= 0.85) return "maintenance";
  if (accuracy >= 0.6) return "improving";
  return "intervention";
};

export const progressFromProjections = (
  projections: readonly MasteryProjection[],
): Readonly<Partial<Record<MasteryDimension, ProgressClassification>>> => {
  const result: Partial<Record<MasteryDimension, ProgressClassification>> = {};
  for (const projection of projections) {
    const dimension = "phonics" as MasteryDimension;
    const total = projection.correctCount + projection.incorrectCount;
    if (total === 0) {
      result[dimension] = "insufficient";
      continue;
    }
    const accuracy = projection.correctCount / total;
    result[dimension] = accuracy >= 0.85
      ? "maintenance"
      : accuracy >= 0.6
        ? "improving"
        : "intervention";
  }
  return result;
};

void ONE_DAY_MS;
void windowDaysConst;