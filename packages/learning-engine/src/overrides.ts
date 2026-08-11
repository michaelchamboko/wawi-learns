/**
 * Parent override contract (SLC-008-T003).
 * Overrides never grant evidence and are always reconciled through the
 * engine's latest-valid settings.
 */
export type OverrideKind =
  | "focus"
  | "target-minutes"
  | "difficulty"
  | "pace"
  | "word-pack"
  | "activity-disable"
  | "mic-disable"
  | "strictness"
  | "subject-balance"
  | "story-pack"
  | "reward-preset";

export interface ParentOverride {
  readonly id: string;
  readonly kind: OverrideKind;
  readonly childProfileId: string;
  readonly parentId: string;
  readonly value: string;
  readonly recordedAt: number;
  readonly audit: string;
}

export interface ApplyOverridesInput {
  readonly childProfileId: string;
  readonly overrides: readonly ParentOverride[];
  readonly now: number;
}

export interface LessonContextOverrides {
  targetDailyMinutes: number;
  activityDisabled: string[];
  micEnabled: boolean;
  difficulty: "gentle" | "standard" | "stretch";
  pace: "slow" | "standard" | "fast";
  subjectBalance: "english-only" | "balanced";
}

const DEFAULT_OVERRIDES: LessonContextOverrides = {
  targetDailyMinutes: 20,
  activityDisabled: [],
  micEnabled: true,
  difficulty: "standard",
  pace: "standard",
  subjectBalance: "english-only",
};

export const applyOverrides = (
  input: ApplyOverridesInput,
): LessonContextOverrides => {
  const sorted = [...input.overrides].sort((a, b) => a.recordedAt - b.recordedAt);
  const out: LessonContextOverrides = { ...DEFAULT_OVERRIDES };
  for (const override of sorted) {
    if (override.childProfileId !== input.childProfileId) continue;
    switch (override.kind) {
      case "target-minutes": {
        const n = Number(override.value);
        if (Number.isFinite(n) && n >= 5 && n <= 60) {
          out.targetDailyMinutes = n;
        }
        break;
      }
      case "activity-disable":
        out.activityDisabled = Array.from(new Set([...out.activityDisabled, override.value]));
        break;
      case "mic-disable":
        if (override.value === "true") out.micEnabled = false;
        break;
      case "difficulty":
        if (override.value === "gentle" || override.value === "standard" || override.value === "stretch") {
          out.difficulty = override.value;
        }
        break;
      case "pace":
        if (override.value === "slow" || override.value === "standard" || override.value === "fast") {
          out.pace = override.value;
        }
        break;
      case "subject-balance":
        if (override.value === "english-only" || override.value === "balanced") {
          out.subjectBalance = override.value;
        }
        break;
    }
  }
  return out;
};

export const overrideGrantsEvidence = (_override: ParentOverride): boolean => false;