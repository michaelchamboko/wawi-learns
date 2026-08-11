import { describe, expect, it } from "vitest";
import {
  RED_TEAM_CORPUS,
  assertRedTeamRefusal,
  type RedTeamEntry,
} from "../../packages/learning-engine/src/index";

describe("SLC-006-T005 — AI red-team corpus", () => {
  it("contains at least one entry from every PRD §43.6 category", () => {
    const categories = new Set(RED_TEAM_CORPUS.map((entry: RedTeamEntry) => entry.category));
    expect(categories.has("unsafe-content")).toBe(true);
    expect(categories.has("name-leak")).toBe(true);
    expect(categories.has("out-of-scope")).toBe(true);
    expect(categories.has("off-policy-provider")).toBe(true);
  });

  it("assertRedTeamRefusal returns no failures when every provider response refuses correctly", () => {
    const failures = assertRedTeamRefusal({ refused: true, provider: "azure" });
    expect(failures).toEqual([]);
  });

  it("assertRedTeamRefusal flags every uncategorised refusal", () => {
    const failures = assertRedTeamRefusal({ refused: false, provider: "azure" });
    expect(failures.length).toBe(RED_TEAM_CORPUS.length);
  });

  it("all entries must have an id and a non-empty prompt", () => {
    for (const entry of RED_TEAM_CORPUS) {
      expect(entry.id).toMatch(/^[a-z-]+$/);
      expect(entry.prompt.length).toBeGreaterThan(0);
    }
  });
});