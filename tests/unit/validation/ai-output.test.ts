import { describe, expect, it } from "vitest";
import {
  validateAiOutput,
  generateContent,
  contentCacheKey,
  type AiContentInput,
} from "../../../packages/learning-engine/src/index";

const remediation: AiContentInput = {
  kind: "remediation",
  wordId: "w1",
  spelling: "cat",
  graphemeSegments: ["c", "a", "t"],
  curriculumBand: "reception",
};

const example: AiContentInput = {
  kind: "example_sentence",
  wordId: "w2",
  spelling: "dog",
  curriculumBand: "reception",
};

const summary: AiContentInput = {
  kind: "parent_summary",
  childProfileId: "child-opaque-1",
  itemsAttempted: 10,
  itemsCorrect: 7,
  dimension: "reading",
};

describe("SLC-006-T003 — AI output validation", () => {
  it("accepts a valid remediation hint", () => {
    expect(validateAiOutput("remediation", "Sound out c-a-t.", remediation)).toBe(true);
  });

  it("rejects empty or over-long output (fail closed)", () => {
    expect(validateAiOutput("remediation", "", remediation)).toBe(false);
    expect(validateAiOutput("remediation", "x".repeat(281), remediation)).toBe(false);
  });

  it("rejects output that leaks a child name or stable id", () => {
    expect(validateAiOutput("parent_summary", "Malachi did well today.", summary)).toBe(false);
    expect(validateAiOutput("parent_summary", "profile-9f2 is progressing.", summary)).toBe(false);
  });

  it("requires the target word to appear in an example sentence", () => {
    expect(validateAiOutput("example_sentence", "The dog ran fast.", example)).toBe(true);
    expect(validateAiOutput("example_sentence", "A pet was happy.", example)).toBe(false);
  });

  it("produces a deterministic cache key from non-sensitive input", () => {
    const a = contentCacheKey(remediation);
    const b = contentCacheKey({ ...remediation });
    expect(a).toBe(b);
    expect(a).not.toContain("cat"); // not a raw echo
  });
});

describe("SLC-006-T003 — constrained actions never retry", () => {
  it("returns provider output when valid", async () => {
    const provider = { complete: async () => ({ text: "Sound out c-a-t: cat." }) };
    const out = await generateContent(remediation, provider);
    expect(out.fromFallback).toBe(false);
    expect(out.text).toContain("cat");
  });

  it("falls back deterministically on provider error and does NOT retry", async () => {
    let calls = 0;
    const provider = {
      complete: async () => {
        calls += 1;
        throw new Error("provider down");
      },
    };
    const out = await generateContent(remediation, provider);
    expect(calls).toBe(1); // exactly one attempt, no retry
    expect(out.fromFallback).toBe(true);
    expect(out.text).toBe("Let's sound it out: c a t — cat.");
  });

  it("falls back once when provider returns invalid output (child name leak)", async () => {
    let calls = 0;
    const provider = {
      complete: async () => {
        calls += 1;
        return { text: "Malachi should sound it out." };
      },
    };
    const out = await generateContent(remediation, provider);
    expect(calls).toBe(1); // no second attempt after invalid output
    expect(out.fromFallback).toBe(true);
  });

  it("never sends child name or stable id to the provider payload", async () => {
    let seen: string | null = null;
    const provider = {
      complete: async (req: { system: string; user: string; kind: string }) => {
        seen = `${req.system}||${req.user}`;
        return { text: "In reading, 7 of 10 attempts were correct." };
      },
    };
    await generateContent(summary, provider);
    expect(seen).not.toContain("child-opaque-1");
    expect(seen).not.toContain("Malachi");
    expect(seen).toContain("attempted=10");
  });
});
