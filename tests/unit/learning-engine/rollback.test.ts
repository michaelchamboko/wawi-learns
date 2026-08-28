import { describe, expect, it } from "vitest";
import {
  beginRollback,
  finishRollback,
  initialRollbackState,
  promote,
  runSmoke,
} from "../../../packages/learning-engine/src/rollback";

describe("SLC-009-T005 — release rollback state machine", () => {
  it("promotes a candidate and records the prior active version as last known good", () => {
    const state = initialRollbackState("1.0.0");
    const promoted = promote(state, "1.1.0");
    expect(promoted.stage).toBe("promoting");
    expect(promoted.activeVersion).toBe("1.1.0");
    expect(promoted.lastKnownGood).toBe("1.0.0");
  });

  it("goes live only after a passing smoke gate", () => {
    const promoted = promote(initialRollbackState("1.0.0"), "1.1.0");
    const failed = runSmoke(promoted, false);
    expect(failed.stage).toBe("smoke-pending");
    expect(failed.smokePassed).toBe(false);
    const live = runSmoke(promoted, true);
    expect(live.stage).toBe("live");
    expect(live.smokePassed).toBe(true);
  });

  it("rolls back to the last known good without losing attempts", () => {
    const promoted = promote(initialRollbackState("1.0.0"), "1.1.0");
    const live = runSmoke(promoted, true);
    const rollingBack = beginRollback(live);
    expect(rollingBack.stage).toBe("rollback-pending");
    const back = finishRollback(rollingBack);
    expect(back.stage).toBe("rolled-back");
    expect(back.activeVersion).toBe("1.0.0");
    expect(back.attemptsPreserved).toBe(true);
  });
});
