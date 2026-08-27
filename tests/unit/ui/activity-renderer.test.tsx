import { describe, expect, it } from "vitest";
import {
  pickFeedback,
  statusBadge,
  RETRY_PHRASE,
  CELEBRATE_PHRASES,
} from "../../../packages/ui/src/feedback";

// SLC-004-T004 — reviewed feedback rotation + no-punishment states (pure unit).
describe("SLC-004-T004 — activity feedback", () => {
  it("returns a no-punishment retry phrase on an incorrect attempt", () => {
    const sel = pickFeedback("incorrect", 0);
    expect(sel.message).toBe(RETRY_PHRASE);
    expect(sel.tone).toBe("retry");
    expect(sel.reason).toBe("no-punishment-retry");
  });

  it("never labels a miss as 'wrong' or comparative", () => {
    for (let i = 0; i < 5; i++) {
      const sel = pickFeedback("incorrect", i);
      expect(sel.message).not.toMatch(/wrong|fail|bad/i);
      expect(sel.tone).toBe("retry");
    }
  });

  it("celebrates the first correct attempt and rotates the phrase on the next", () => {
    const first = pickFeedback("correct", 0);
    expect(first.tone).toBe("celebrate");
    const second = pickFeedback("correct", 1);
    expect(second.tone).toBe("celebrate");
    expect(second.message).not.toBe(first.message);
  });

  it("rotates celebration phrases so the same one is not repeated back-to-back", () => {
    const a = pickFeedback("correct", 0); // celebrate[0]
    const b = pickFeedback("correct", CELEBRATE_PHRASES.length); // celebrate wraps back to [0]
    expect(b.message).toBe(a.message);
    const c = pickFeedback("correct", 1); // celebrate[1]
    expect(c.message).not.toBe(a.message);
  });

  it("maps mastery states to the public status badge without leaking item text", () => {
    expect(statusBadge("new")).toBe("introduced");
    expect(statusBadge("learning")).toBe("introduced");
    expect(statusBadge("relearning")).toBe("introduced");
    expect(statusBadge("practising")).toBe("practising");
    expect(statusBadge("strong")).toBe("strong");
    expect(statusBadge("mastered")).toBe("mastered");
  });
});
