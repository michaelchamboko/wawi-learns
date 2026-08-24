import { describe, expect, it } from "vitest";
import {
  MVP_SESSION_PLAN,
  activityProgressLabel,
  nextActivityIndex,
} from "../../../packages/ui/src/mvp-session";

describe("private-beta MVP session", () => {
  it("contains the five approved activities in order", () => {
    expect(MVP_SESSION_PLAN.map((activity) => activity.kind)).toEqual([
      "learn-card",
      "audio-picture",
      "picture-word",
      "letter-tiles",
      "mixed-recap",
    ]);
    expect(MVP_SESSION_PLAN.map((activity) => activity.word)).toEqual([
      "cat",
      "sun",
      "sit",
      "sat",
      "can",
    ]);
  });

  it("advances only after a correct answer and stops after the fifth activity", () => {
    expect(nextActivityIndex(0, "incorrect")).toBe(0);
    expect(nextActivityIndex(0, "correct")).toBe(1);
    expect(nextActivityIndex(4, "correct")).toBeNull();
  });

  it("uses a clear progress label for every child-facing screen", () => {
    expect(activityProgressLabel(0)).toBe("Activity 1 of 5");
    expect(activityProgressLabel(4)).toBe("Activity 5 of 5");
  });
});
