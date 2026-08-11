import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  CONSENT_WINDOW_MS,
  EphemeralAudioBuffer,
  assessPronunciation,
  type PronunciationProvider,
} from "../../../packages/audio/src/index";
import { LocalAttemptStore } from "../../../packages/local-data/src/index";

const PROVIDER: PronunciationProvider = {
  score: async () => ({ accuracy: 0.7, confidence: 0.8 }),
};

describe("SLC-005-T004 — ephemeral pronunciation assessment", () => {
  it("returns 'practice_only' when consent window has expired", async () => {
    const result = await assessPronunciation(
      {
        target: "cat",
        pcm: new Float32Array([0.1, 0.2]),
        sampleRate: 16000,
        consentAt: 0,
        now: () => CONSENT_WINDOW_MS + 1,
        consentWindowMs: CONSENT_WINDOW_MS,
        minConfidence: 0.5,
        highConfidence: 0.7,
      },
      PROVIDER,
    );
    expect(result.verdict).toBe("practice_only");
  });

  it("returns 'uncertain' when provider confidence is below the minimum", async () => {
    const result = await assessPronunciation(
      {
        target: "cat",
        pcm: new Float32Array([0.1]),
        sampleRate: 16000,
        consentAt: 0,
        now: () => 100,
        consentWindowMs: CONSENT_WINDOW_MS,
        minConfidence: 0.5,
        highConfidence: 0.9,
      },
      { score: async () => ({ accuracy: 0.9, confidence: 0.4 }) },
    );
    expect(result.verdict).toBe("uncertain");
  });

  it("returns 'accepted' for high confidence and accuracy", async () => {
    const result = await assessPronunciation(
      {
        target: "cat",
        pcm: new Float32Array([0.1]),
        sampleRate: 16000,
        consentAt: 0,
        now: () => 100,
        consentWindowMs: CONSENT_WINDOW_MS,
        minConfidence: 0.5,
        highConfidence: 0.7,
      },
      PROVIDER,
    );
    expect(result.verdict).toBe("accepted");
  });

  it("returns 'unavailable' when the provider throws", async () => {
    const result = await assessPronunciation(
      {
        target: "cat",
        pcm: new Float32Array([0.1]),
        sampleRate: 16000,
        consentAt: 0,
        now: () => 100,
        consentWindowMs: CONSENT_WINDOW_MS,
        minConfidence: 0.5,
        highConfidence: 0.7,
      },
      { score: async () => { throw new Error("provider-down"); } },
    );
    expect(result.verdict).toBe("unavailable");
  });

  it("EphemeralAudioBuffer disposes the data and rejects post-disposal reads", () => {
    const data = new Float32Array([0.1, 0.2, 0.3]);
    const buffer = new EphemeralAudioBuffer(data);
    expect(buffer.isDisposed).toBe(false);
    expect(buffer.buffer.byteLength).toBe(12);
    buffer.dispose();
    expect(buffer.isDisposed).toBe(true);
    expect(() => buffer.buffer).toThrowError(/audio-buffer-disposed/);
  });

  it("LocalAttemptStore never accepts a raw audio payload as an AttemptEvent field", async () => {
    const store = new LocalAttemptStore(`wawi-spike-pron-${Math.random().toString(36).slice(2)}`);
    await store.appendAttempt({
      eventId: "evt-pron-1",
      installationId: "install-1",
      sourceSequence: 0,
      occurredAt: 1_700_000_000_000,
      recordedAt: 1_700_000_000_000,
      dimension: "speech",
      itemId: "gpc-cat",
      result: "correct",
      hintCount: 0,
      durationMs: 1500,
      clientVersion: "0.1.0",
    });
    const all = await store.readAllAttempts();
    expect(all).toHaveLength(1);
    // The store has no field that can carry a raw audio payload by design.
    expect(Object.keys(all[0]!)).not.toContain("pcm");
    expect(Object.keys(all[0]!)).not.toContain("audio");
    await store.reset();
  });
});