/**
 * Layered TTS hierarchy (SLC-005-T003).
 * Reviewed → premium cache → browser. Falls through every tier until something
 * plays. Caller must respect parent controls (rate, auto, sfx, celebration).
 */
export type PlaybackSource = "reviewed" | "premium-cache" | "browser" | "unavailable";

export interface PlaybackRequest {
  readonly word: string;
  readonly voice: "en-GB";
  readonly style: "word" | "slow" | "spell" | "sounds" | "sentence";
  readonly autoplay: boolean;
}

export interface PlaybackOutcome {
  readonly source: PlaybackSource;
  readonly durationMs: number;
  readonly failureReason: string | null;
}

export interface AssetResolver {
  readonly resolveReviewedClip: (request: PlaybackRequest) => Promise<string | null>;
  readonly resolvePremiumClip: (request: PlaybackRequest) => Promise<string | null>;
  readonly playBrowserClip: (request: PlaybackRequest) => Promise<boolean>;
}

const STOPWATCH = () => {
  const startedAt = Date.now();
  return {
    elapsed: () => Date.now() - startedAt,
  };
};

export const playSpeech = async (
  request: PlaybackRequest,
  resolver: AssetResolver,
): Promise<PlaybackOutcome> => {
  if (!request.autoplay) {
    return { source: "unavailable", durationMs: 0, failureReason: "autoplay-disabled" };
  }

  const watch = STOPWATCH();
  const reviewed = await resolver.resolveReviewedClip(request);
  if (reviewed) {
    return { source: "reviewed", durationMs: watch.elapsed(), failureReason: null };
  }

  const premium = await resolver.resolvePremiumClip(request);
  if (premium) {
    return { source: "premium-cache", durationMs: watch.elapsed(), failureReason: null };
  }

  const browserOk = await resolver.playBrowserClip(request);
  if (browserOk) {
    return { source: "browser", durationMs: watch.elapsed(), failureReason: null };
  }

  return {
    source: "unavailable",
    durationMs: watch.elapsed(),
    failureReason: "no-source-available",
  };
};

export interface TtsFailureProbe {
  readonly reason: "missing-voice" | "browser-synthesis-failed" | "interrupted" | "silent-mode" | "unavailable-phoneme";
  readonly outcome: PlaybackOutcome;
}

export const ttsFailureProbe = (reason: TtsFailureProbe["reason"]): TtsFailureProbe => ({
  reason,
  outcome: { source: "unavailable", durationMs: 0, failureReason: reason },
});