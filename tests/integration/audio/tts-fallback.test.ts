import { describe, expect, it, vi } from "vitest";
import {
  playSpeech,
  type AssetResolver,
  type PlaybackRequest,
} from "../../../packages/learning-engine/src/tts-fallback";

const req = (over: Partial<PlaybackRequest> = {}): PlaybackRequest => ({
  word: "sun",
  voice: "en-GB",
  style: "word",
  autoplay: true,
  ...over,
});

describe("SLC-005-T003 — TTS fallback (integration cascade)", () => {
  it("prefers the highest-tier available source and stops there", async () => {
    const order: string[] = [];
    const resolver: AssetResolver = {
      resolveReviewedClip: vi.fn(async () => {
        order.push("reviewed");
        return "reviewed-clip";
      }),
      resolvePremiumClip: vi.fn(async () => {
        order.push("premium");
        return null;
      }),
      playBrowserClip: vi.fn(async () => {
        order.push("browser");
        return false;
      }),
    };
    const out = await playSpeech(req(), resolver);
    expect(out.source).toBe("reviewed");
    // Lower tiers must not be consulted once a higher tier succeeds.
    expect(order).toEqual(["reviewed"]);
  });

  it("cascades reviewed -> premium -> browser in order when higher tiers miss", async () => {
    const order: string[] = [];
    const resolver: AssetResolver = {
      resolveReviewedClip: vi.fn(async () => {
        order.push("reviewed");
        return null;
      }),
      resolvePremiumClip: vi.fn(async () => {
        order.push("premium");
        return null;
      }),
      playBrowserClip: vi.fn(async () => {
        order.push("browser");
        return true;
      }),
    };
    const out = await playSpeech(req(), resolver);
    expect(out.source).toBe("browser");
    expect(order).toEqual(["reviewed", "premium", "browser"]);
  });

  it("returns unavailable only after all three tiers are exhausted", async () => {
    const resolver: AssetResolver = {
      resolveReviewedClip: vi.fn(async () => null),
      resolvePremiumClip: vi.fn(async () => null),
      playBrowserClip: vi.fn(async () => false),
    };
    const out = await playSpeech(req(), resolver);
    expect(out.source).toBe("unavailable");
    expect(out.failureReason).toBe("no-source-available");
  });
});
