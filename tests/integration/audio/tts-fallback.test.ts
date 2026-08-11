import { describe, expect, it } from "vitest";
import { playSpeech, ttsFailureProbe, type AssetResolver, type PlaybackRequest } from "../../../packages/learning-engine/src/index";

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

describe("SLC-005-T003 — TTS fallback hierarchy", () => {
  it("prefers the reviewed clip when available", async () => {
    const result = await playSpeech(request, resolver({
      resolveReviewedClip: async () => "blob:reviewed-cat",
    }));
    expect(result.source).toBe("reviewed");
  });

  it("falls back to premium cache when reviewed is missing", async () => {
    const result = await playSpeech(request, resolver({
      resolvePremiumClip: async () => "blob:premium-cat",
    }));
    expect(result.source).toBe("premium-cache");
  });

  it("falls back to browser synthesis when no clip is cached", async () => {
    const result = await playSpeech(request, resolver({
      playBrowserClip: async () => true,
    }));
    expect(result.source).toBe("browser");
  });

  it("returns 'unavailable' when every tier fails", async () => {
    const result = await playSpeech(request, resolver());
    expect(result.source).toBe("unavailable");
    expect(result.failureReason).toBe("no-source-available");
  });

  it("respects autoplay=false and never attempts playback", async () => {
    let attempted = false;
    const result = await playSpeech(
      { ...request, autoplay: false },
      {
        ...resolver(),
        resolveReviewedClip: async () => {
          attempted = true;
          return "blob:reviewed-cat";
        },
      },
    );
    expect(result.source).toBe("unavailable");
    expect(result.failureReason).toBe("autoplay-disabled");
    expect(attempted).toBe(false);
  });

  it("records the failure reason via ttsFailureProbe", () => {
    const probe = ttsFailureProbe("silent-mode");
    expect(probe.reason).toBe("silent-mode");
    expect(probe.outcome.source).toBe("unavailable");
  });
});