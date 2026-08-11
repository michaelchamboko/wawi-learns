/**
 * Ephemeral pronunciation assessment (SLC-005-T004).
 * The buffer never leaves this function. Server-side, the parent consent
 * flag is enforced and the provider credentials live only server-side.
 */
export type PronunciationVerdict = "accepted" | "uncertain" | "practice_only" | "unavailable";

export interface PronunciationResult {
  readonly verdict: PronunciationVerdict;
  readonly accuracy: number;
  readonly confidence: number;
  readonly provider: "azure" | "browser-fallback";
}

export interface PronunciationProvider {
  readonly score: (
    target: string,
    pcm: Float32Array,
    sampleRate: number,
  ) => Promise<{ accuracy: number; confidence: number }>;
}

export interface PronunciationInput {
  readonly target: string;
  readonly pcm: Float32Array;
  readonly sampleRate: number;
  readonly consentAt: number;
  readonly now: () => number;
  readonly consentWindowMs: number;
  readonly minConfidence: number;
  readonly highConfidence: number;
}

export const CONSENT_WINDOW_MS = 30_000;

export const assessPronunciation = async (
  input: PronunciationInput,
  provider: PronunciationProvider,
): Promise<PronunciationResult> => {
  if (input.now() - input.consentAt > input.consentWindowMs) {
    return { verdict: "practice_only", accuracy: 0, confidence: 0, provider: "azure" };
  }

  let providerResult;
  try {
    providerResult = await provider.score(input.target, input.pcm, input.sampleRate);
  } catch {
    return { verdict: "unavailable", accuracy: 0, confidence: 0, provider: "azure" };
  }

  const verdict: PronunciationVerdict =
    providerResult.confidence < input.minConfidence
      ? "uncertain"
      : providerResult.confidence >= input.highConfidence && providerResult.accuracy >= 0.6
        ? "accepted"
        : "practice_only";

  return {
    verdict,
    accuracy: providerResult.accuracy,
    confidence: providerResult.confidence,
    provider: "azure",
  };
};

/**
 * Ephemeral PCM buffer lifecycle. The buffer is owned by this object and is
 * zeroed on dispose(). The owner must call dispose() before the buffer leaves
 * the local memory scope.
 */
export class EphemeralAudioBuffer {
  private data: Float32Array | null;
  private disposed = false;

  constructor(data: Float32Array) {
    this.data = data;
  }

  get buffer(): Float32Array {
    if (this.disposed) {
      throw new Error("audio-buffer-disposed");
    }
    return this.data!;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  dispose(): void {
    if (this.disposed) return;
    this.data!.fill(0);
    this.data = null;
    this.disposed = true;
  }
}