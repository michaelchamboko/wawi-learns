import { describe, expect, it } from "vitest";
import {
  selectNextActivity,
  type ActivityCandidate,
  type LessonContext,
} from "../../../packages/learning-engine/src/scheduler";

const context = (recent: LessonContext["recentModalityByDimension"]): LessonContext => ({
  childProfileId: "child-1",
  yearGroup: "reception",
  targetDailyMinutes: 10,
  backlogByDimension: {},
  recentModalityByDimension: recent,
  dailyCompletedByDimension: {},
});

const candidate = (
  modality: ActivityCandidate["modality"],
  over: Partial<Pick<ActivityCandidate, "isWeak" | "isNew" | "state">> = {},
): ActivityCandidate => ({
  itemId: `w-${modality}`,
  dimension: modality === "trace" ? "tracing" : modality === "spell" ? "spelling" : modality === "say-word" ? "speech" : "phonics",
  modality,
  state: over.state ?? "learning",
  isWeak: over.isWeak ?? true,
  isNew: over.isNew ?? false,
});

describe("SLC-005-T005 — multimodal scheduler rotation", () => {
  it("does not schedule microphone practice three times in a row", () => {
    const plan = selectNextActivity({
      context: context({ speech: ["say-word", "say-word"] }),
      candidates: [candidate("say-word"), candidate("spell", { isWeak: false, state: "strong" }), candidate("trace", { isWeak: false, state: "strong" })],
      rng: () => 0,
    });

    expect(plan.modality).not.toBe("say-word");
    expect(plan.reason).toBe("modality-fatigue-rotation");
  });

  it("does not schedule handwriting/tracing three times in a row", () => {
    const plan = selectNextActivity({
      context: context({ tracing: ["trace", "trace"] }),
      candidates: [candidate("trace"), candidate("say-word", { isWeak: false, state: "strong" }), candidate("spell", { isWeak: false, state: "strong" })],
      rng: () => 0,
    });

    expect(plan.modality).not.toBe("trace");
    expect(plan.reason).toBe("modality-fatigue-rotation");
  });
});
