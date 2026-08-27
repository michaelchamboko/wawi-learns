import { describe, expect, it } from "vitest";
import {
  MVP_SESSION_PLAN,
  activityProgressLabel,
  nextActivityIndex,
  restoredActivityIndex,
} from "../../../packages/ui/src/mvp-session";

describe("private-beta MVP session", () => {
  it("contains the six approved multimodal activities in order with derived evidence dimensions", () => {
    expect(MVP_SESSION_PLAN.map((activity) => activity.kind)).toEqual([
      "learn-card",
      "audio-picture",
      "picture-word",
      "trace",
      "spell",
      "say-word",
    ]);
    expect(MVP_SESSION_PLAN.map((activity) => activity.dimension)).toEqual([
      "phonics",
      "phonics",
      "reading",
      "tracing",
      "spelling",
      "speech",
    ]);
    expect(MVP_SESSION_PLAN.map((activity) => activity.word)).toEqual([
      "cat",
      "sun",
      "sit",
      "sat",
      "can",
      "cat",
    ]);
  });

  it("advances only after a correct answer and stops after the fifth activity", () => {
    expect(nextActivityIndex(0, "incorrect")).toBe(0);
    expect(nextActivityIndex(0, "correct")).toBe(1);
    expect(nextActivityIndex(5, "correct")).toBeNull();
  });

  it("uses a clear progress label for every child-facing screen", () => {
    expect(activityProgressLabel(0)).toBe("Activity 1 of 6");
    expect(activityProgressLabel(5)).toBe("Activity 6 of 6");
  });

  it("restores an open checkpoint after offline reload instead of returning home", () => {
    expect(restoredActivityIndex(null)).toBeNull();
    expect(restoredActivityIndex("2")).toBe(2);
    expect(restoredActivityIndex("99")).toBe(5);
    expect(restoredActivityIndex("malformed")).toBe(0);
  });
});
