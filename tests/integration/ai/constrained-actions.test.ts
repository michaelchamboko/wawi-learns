import { describe, expect, it, vi } from "vitest";
import {
  generateContent,
  type AiContentInput,
  type AiProvider,
} from "../../../packages/learning-engine/src/index";

const example: AiContentInput = {
  kind: "example_sentence",
  wordId: "w2",
  spelling: "dog",
  curriculumBand: "reception",
};

const providerThat = (impl: (req: { system: string; user: string; kind: string }) => Promise<{ text: string }>): AiProvider & { calls: () => number } => {
  const fn = vi.fn(impl);
  return { complete: fn, calls: () => fn.mock.calls.length };
};

describe("SLC-006-T003 — constrained AI actions (integration)", () => {
  it("uses a fixed, minimal payload and never includes the word id or child data", async () => {
    const captured: string[] = [];
    const provider = providerThat(async (req) => {
      captured.push(`${req.system}__${req.user}`);
      return { text: "The dog barked." };
    });
    await generateContent(example, provider);
    expect(captured).toHaveLength(1);
    expect(captured[0]).toContain("word=dog");
    expect(captured[0]).not.toContain("w2"); // no stable id leaked
  });

  it("returns valid provider text and records a single call", async () => {
    const provider = providerThat(async () => ({ text: "The dog barked." }));
    const out = await generateContent(example, provider);
    expect(out.fromFallback).toBe(false);
    expect(provider.calls()).toBe(1);
  });

  it("falls back deterministically on error and never retries", async () => {
    const provider = providerThat(async () => {
      throw new Error("timeout");
    });
    const out = await generateContent(example, provider);
    expect(out.fromFallback).toBe(true);
    expect(out.text).toBe("Here is the word dog.");
    expect(provider.calls()).toBe(1);
  });

  it("falls back on invalid (word-missing) output without a second call", async () => {
    const provider = providerThat(async () => ({ text: "A pet was happy." }));
    const out = await generateContent(example, provider);
    expect(out.fromFallback).toBe(true);
    expect(provider.calls()).toBe(1);
  });

  it("produces identical cache keys for identical inputs (idempotent, no re-cost)", () => {
    // Covered at the integration boundary: same input -> one digest.
    // (contentCacheKey lives in the unit suite; here we assert generateContent
    // is pure w.r.t. the request digest by re-running a valid provider.)
    const provider = providerThat(async () => ({ text: "The dog barked." }));
    return generateContent(example, provider).then(async (a) => {
      const b = await generateContent(example, provider);
      expect(a.requestDigest).toBe(b.requestDigest);
    });
  });
});
