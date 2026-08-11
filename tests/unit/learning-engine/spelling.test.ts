import { describe, expect, it } from "vitest";
import { analyseSpelling } from "../../../packages/learning-engine/src/index";

describe("SLC-005-T002 — spelling analysis", () => {
  it("returns correct=true for an exact match", () => {
    const result = analyseSpelling("cat", { spelling: "cat", graphemes: ["c", "a", "t"] });
    expect(result.correct).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("flags a missing letter", () => {
    const result = analyseSpelling("ct", { spelling: "cat", graphemes: ["c", "a", "t"] });
    expect(result.correct).toBe(false);
    expect(result.errors).toContain("missing-letter");
  });

  it("flags an extra letter", () => {
    const result = analyseSpelling("cats", { spelling: "cat", graphemes: ["c", "a", "t"] });
    expect(result.errors).toContain("extra-letter");
  });

  it("flags a substitution (wrong-letter)", () => {
    const result = analyseSpelling("bat", { spelling: "cat", graphemes: ["c", "a", "t"] });
    expect(result.errors).toContain("wrong-letter");
  });

  it("flags b/d reversal", () => {
    const result = analyseSpelling("dat", { spelling: "bat", graphemes: ["b", "a", "t"] });
    expect(result.errors).toContain("reversal");
  });

  it("flags capitalisation", () => {
    const result = analyseSpelling("Cat", { spelling: "cat", graphemes: ["c", "a", "t"] });
    expect(result.errors).toContain("capitalisation");
  });

  it("ignores surrounding whitespace", () => {
    const result = analyseSpelling("  cat  ", { spelling: "cat", graphemes: ["c", "a", "t"] });
    expect(result.correct).toBe(true);
  });

  it("produces a phonics-linked hint referencing the first grapheme", () => {
    const result = analyseSpelling("ct", { spelling: "cat", graphemes: ["c", "a", "t"] });
    expect(result.hint).toMatch(/first sound/);
  });
});