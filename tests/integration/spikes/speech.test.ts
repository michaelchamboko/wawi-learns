import { describe, expect, it } from "vitest";
import {
  playSpeech,
  type AssetResolver,
  type PlaybackRequest,
} from "../../../packages/learning-engine/src/index";

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
});
