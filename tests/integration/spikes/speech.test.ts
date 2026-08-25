import { describe, expect, it } from "vitest";
import {
  playSpeech,
  type AssetResolver,
  type PlaybackRequest,
} from "../../../packages/learning-engine/src/index";
import {
  assessPronunciation,
  CONSENT_WINDOW_MS,
} from "../../../packages/audio/src/index";

const request: PlaybackRequest = {
  word: "cat",
  voice: "en-GB",
  style: "word",
  autoplay: true,
};

const resolver = (overrides: Partial<AssetResolver> = {}): AssetResolver => ({
  resolveReviewedClip: async () => null,
  resolvePremiumClip: async () => null,
  playBrowserClip: async () => false,
  ...overrides,
});

describe("SLC-001-T004 — speech spike", () => {
  it("preserves the reviewed en-GB request and prefers a reviewed clip", async () => {
    let reviewedRequest: PlaybackRequest | undefined;
    const result = await playSpeech(request, {
      ...resolver(),
      resolveReviewedClip: async (received) => {
        reviewedRequest = received;
        return "blob:reviewed-cat";
      },
    });

    expect(reviewedRequest).toEqual(request);
    expect(result.source).toBe("reviewed");
  });

  it("falls back to browser synthesis when reviewed and premium clips are absent", async () => {
    const result = await playSpeech(request, resolver({
      playBrowserClip: async () => true,
    }));

    expect(result.source).toBe("browser");
  });

  it("returns unavailable without retaining or requiring provider audio", async () => {
    const result = await playSpeech(request, resolver());

    expect(result).toMatchObject({
      source: "unavailable",
      failureReason: "no-source-available",
    });
  });

  it("marks a low-confidence pronunciation result uncertain", async () => {
    const result = await assessPronunciation(
      {
        target: "cat",
        pcm: new Float32Array([0.1, 0.2]),
        sampleRate: 16_000,
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

  it("reports pronunciation as unavailable when the provider cannot score audio", async () => {
    const result = await assessPronunciation(
      {
        target: "cat",
        pcm: new Float32Array([0.1]),
        sampleRate: 16_000,
        consentAt: 0,
        now: () => 100,
        consentWindowMs: CONSENT_WINDOW_MS,
        minConfidence: 0.5,
        highConfidence: 0.7,
      },
      { score: async () => { throw new Error("microphone-unavailable"); } },
    );

    expect(result.verdict).toBe("unavailable");
  });
});
