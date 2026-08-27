import { describe, expect, it, vi } from "vitest";
import {
  playSpeech,
  ttsFailureProbe,
  type AssetResolver,
  type PlaybackRequest,
} from "../../../packages/learning-engine/src/tts-fallback";

const req = (over: Partial<PlaybackRequest> = {}): PlaybackRequest => ({
  word: "cat",
  voice: "en-GB",
  style: "word",
  autoplay: true,
  ...over,
});

const resolver = (impl: Partial<AssetResolver>): AssetResolver => ({
  resolveReviewedClip: impl.resolveReviewedClip ?? (async () => null),
  resolvePremiumClip: impl.resolvePremiumClip ?? (async () => null),
  playBrowserClip: impl.playBrowserClip ?? (async () => false),
});

describe("SLC-005-T003 — TTS fallback hierarchy", () => {
  it("plays the reviewed clip first when available", async () => {
    const resolveReviewedClip = vi.fn(async () => "clip-reviewed");
    const out = await playSpeech(req(), resolver({ resolveReviewedClip }));
    expect(out.source).toBe("reviewed");
    expect(out.failureReason).toBeNull();
    expect(resolveReviewedClip).toHaveBeenCalledTimes(1);
  });

  it("falls through to premium cache when reviewed is missing", async () => {
    const resolvePremiumClip = vi.fn(async () => "clip-premium");
    const out = await playSpeech(req(), resolver({ resolvePremiumClip }));
    expect(out.source).toBe("premium-cache");
    expect(out.failureReason).toBeNull();
  });

  it("falls through to browser synthesis when both caches miss", async () => {
    const playBrowserClip = vi.fn(async () => true);
    const out = await playSpeech(req(), resolver({ playBrowserClip }));
    expect(out.source).toBe("browser");
    expect(out.failureReason).toBeNull();
  });

  it("reports unavailable only after every tier fails", async () => {
    const out = await playSpeech(req(), resolver({}));
    expect(out.source).toBe("unavailable");
    expect(out.failureReason).toBe("no-source-available");
  });

  it("never plays when autoplay is disabled (respects parent controls)", async () => {
    const resolveReviewedClip = vi.fn(async () => "clip");
    const out = await playSpeech(req({ autoplay: false }), resolver({ resolveReviewedClip }));
    expect(out.source).toBe("unavailable");
    expect(out.failureReason).toBe("autoplay-disabled");
    expect(resolveReviewedClip).not.toHaveBeenCalled();
  });

  it("ttsFailureProbe maps a probe reason to an unavailable outcome", () => {
    const probe = ttsFailureProbe("missing-voice");
    expect(probe.reason).toBe("missing-voice");
    expect(probe.outcome.source).toBe("unavailable");
    expect(probe.outcome.failureReason).toBe("missing-voice");
  });
});
