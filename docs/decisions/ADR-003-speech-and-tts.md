# ADR-003 — Speech and TTS providers

- **Status:** accepted
- **Owner slice:** SLC-001-T004
- **Acceptance:** AC-SLC-001-004, AC-SLC-001-005
- **Supersedes:** none

## Decision

V1 uses a **layered audio hierarchy** that is allowed to fall back at every
level:

1. **Reviewed `en-GB` recorded clips** ship inside every core pack
   (`/public/content/<version>/audio/<grapheme>.mp3`). These are the V1
   authority for first-introduction phonemes and exception words.
2. **Microsoft Azure Speech** (`en-GB` neural voices) is the approved premium
   fallback for words outside the reviewed inventory or for slow / spell /
   sounds playback variants.
3. **Browser Web Speech API** (`speechSynthesis`) is the third-tier fallback
   that runs locally and is unavailable only when the browser vendor removes
   the API surface.
4. No fourth-tier provider (ElevenLabs, Polly) is approved for V1.

For pronunciation assessment:

- **Azure Speech pronunciation assessment** is the approved scoring provider.
  Provider request bodies are limited to the target word, expected phoneme set
  and a 16 kHz mono PCM blob of <8 s. The provider is configured with logging
  disabled and zero-data-retention enabled. The score is `accepted | uncertain
  | practice_only | unavailable` plus derived accuracy/prosody/fluency band
  metrics.

### Why one path

- A single provider keeps the scoring rubric stable. A multi-provider
  abstraction was rejected because no provider offers identical en-GB phoneme
  scoring and swapping providers would invalidate mastery projections.
- The audio playback hierarchy is layered because each tier degrades
  gracefully when the prior tier is absent or fails: a child always hears
  *something* matching the curriculum target.

### Spike boundary

- Reviewed assets are revisioned in the core pack and are the only audio
  assets committed to this repository. Azure clips are server-side generated
  and cached by `(word, voice, style, revision)` digest.
- Pronunciation assessment runs only with explicit parent consent; consent is
  revocable between capture and provider dispatch (no audio is sent after
  revocation).
- Raw PCM buffers are kept in memory for the duration of one assessment call
  and are zeroed before the function returns. No buffer is written to
  IndexedDB, Convex or logs.

### Benchmarks evaluated (parent-consented, synthetic fixtures only)

| Tier | Candidate | Latency | Bundle impact | Replacement cost | Verdict |
|---|---|---|---|---|---|
| 1 | Reviewed `en-GB` recorded clips | 0 ms (local) | ship in pack | regenerate source | **selected** |
| 2 | Azure Speech (en-GB neural) | 250–400 ms TTFB | 0 KB (server fetch) | swap provider config | **selected fallback** |
| 3 | Browser `speechSynthesis` | variable | 0 KB | none | **selected fallback** |
| 4 | ElevenLabs | 200–500 ms TTFB | 0 KB | swap provider config | rejected (pricing & retention settings unclear) |
| 4 | Amazon Polly | 200 ms TTFB | 0 KB | swap provider config | rejected (en-GB neural quality below threshold) |
| Assessment | Azure pronunciation assessment | 350–600 ms | 0 KB (server fetch) | swap provider config | **selected** |
| Assessment | AssemblyAI | 400–800 ms | 0 KB | swap provider config | rejected (US-English bias) |
| Assessment | Whisper self-hosted | 1.2 s+ | n/a | run inference infra | rejected (server cost, no phoneme scoring) |

### Privacy and licence

- Azure Speech and pronunciation assessment are billed via the product owner's
  Azure subscription. Logging and training retention are disabled in the
  Azure Speech resource configuration; this is verified by the spike test
  `tests/integration/audio/tts-fallback.test.ts` and reasserted in
  `tests/security/no-raw-audio.test.ts`.
- Reviewed clips carry their own licence metadata in the manifest; only
  Creative-Commons-0 or commercial licences with proof-of-purchase are
  accepted.

## Recovery semantics

- An Azure Speech region outage, pricing change, terms change or browser API
  removal reopens this task via `action=reopen`. The kill switch returns
  unscored practice immediately.

## Rejected alternatives

- **Self-hosted Whisper** — rejected because phoneme-level scoring is not part
  of Whisper's output and building the missing layer would exceed the SLC-005
  scope.
- **ElevenLabs** — rejected because the provider's public retention policy is
  not configured to "no training, no logging" at the V1 price tier.