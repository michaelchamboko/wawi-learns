import { describe, expect, it, vi } from "vitest";
import {
  assessPronunciation,
  CONSENT_WINDOW_MS,
  EphemeralAudioBuffer,
  type PronunciationInput,
  type PronunciationProvider,
} from "../../../packages/audio/src/index";

const baseInput = (over: Partial<PronunciationInput> = {}): PronunciationInput => ({
  target: "cat",
  pcm: new Float32Array([0, 0.1, -0.1]),
  sampleRate: 16000,
  consentAt: 1_000_000,
  now: () => 1_000_000, // equal to consentAt -> within window
  consentWindowMs: CONSENT_WINDOW_MS,
  minConfidence: 0.5,
  highConfidence: 0.8,
  ...over,
});

const provider = (score: (t: string, p: Float32Array, r: number) => Promise<{ accuracy: number; confidence: number }>): PronunciationProvider => ({ score });

describe("SLC-005-T004 — pronunciation assessment", () => {
  it("accepts a high-confidence, accurate utterance", async () => {
    const out = await assessPronunciation(
      baseInput(),
      provider(async () => ({ accuracy: 0.9, confidence: 0.9 })),
    );
    expect(out.verdict).toBe("accepted");
    expect(out.accuracy).toBe(0.9);
    expect(out.confidence).toBe(0.9);
  });

  it("marks low-confidence results uncertain (never rejected, never fabricated)", async () => {
    const out = await assessPronunciation(
      baseInput(),
      provider(async () => ({ accuracy: 0.95, confidence: 0.3 })),
    );
    expect(out.verdict).toBe("uncertain");
    expect(out.accuracy).toBe(0.95); // accuracy surfaced, not laundered
  });

  it("downgrades to practice_only when accuracy is below the high bar", async () => {
    const out = await assessPronunciation(
      baseInput(),
      provider(async () => ({ accuracy: 0.5, confidence: 0.9 })),
    );
    expect(out.verdict).toBe("practice_only");
  });

  it("never scores a sample outside the parent consent window", async () => {
    const out = await assessPronunciation(
      baseInput({ now: () => 1_000_000 + CONSENT_WINDOW_MS + 1 }),
      provider(vi.fn(async () => ({ accuracy: 1, confidence: 1 }))),
    );
    expect(out.verdict).toBe("practice_only");
    expect(out.accuracy).toBe(0);
    expect(out.confidence).toBe(0);
  });

  it("returns unavailable when the provider throws (never fabricates a score)", async () => {
    const out = await assessPronunciation(
      baseInput(),
      provider(async () => {
        throw new Error("network-down");
      }),
    );
    expect(out.verdict).toBe("unavailable");
    expect(out.accuracy).toBe(0);
  });
});

describe("SLC-005-T004 — EphemeralAudioBuffer", () => {
  it("exposes the buffer until dispose() is called", () => {
    const data = new Float32Array([1, 2, 3]);
    const buf = new EphemeralAudioBuffer(data);
    expect(buf.isDisposed).toBe(false);
    expect(Array.from(buf.buffer)).toEqual([1, 2, 3]);
  });

  it("zeroes the buffer on dispose() and rejects further reads", () => {
    const data = new Float32Array([1, 2, 3]);
    const buf = new EphemeralAudioBuffer(data);
    buf.dispose();
    expect(buf.isDisposed).toBe(true);
    expect(() => buf.buffer).toThrow(/audio-buffer-disposed/);
    for (const v of data) expect(v).toBe(0);
  });

  it("dispose() is idempotent", () => {
    const buf = new EphemeralAudioBuffer(new Float32Array([1]));
    buf.dispose();
    expect(() => buf.dispose()).not.toThrow();
    expect(buf.isDisposed).toBe(true);
  });
});
