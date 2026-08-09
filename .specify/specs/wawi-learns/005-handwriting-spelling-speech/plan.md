# Handwriting, Spelling and Speech Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add production-quality writing, spelling, audio and speaking modalities without weakening privacy, offline continuity or dimension independence.

**Architecture:** Tracing and browser audio live in focused client packages; raw strokes stay local and audio buffers are ephemeral. Convex actions broker any selected cloud speech/TTS provider, return derived scores only and enforce consent immediately before dispatch.

**Tech Stack:** React pointer events, selected ADR-004 tracing renderer, Web Audio/Media APIs, selected ADR-003 speech/TTS path, Convex actions, Vitest/Playwright.

## Global Constraints

- Raw audio is never persisted; raw strokes remain local unless explicit diagnostic consent is later enabled.
- Speaking evidence affects only speaking/pronunciation; poor tracing affects only handwriting.
- Low speech confidence is uncertain, not wrong; offline/denied mode becomes unscored repeat practice.
- Core phoneme audio is human-reviewed and packaged offline; generic TTS is not an isolated-phoneme authority.
- British spelling/reference pronunciation does not penalise intelligible Zimbabwean, South African or other accents.
- Microphone consent can be withdrawn locally and must sync before any later dependent provider call.

---

## Interfaces and data flow

- Produces `proposed:packages/tracing/src/scoreTrace.ts:scoreTrace(input: TraceInput, formation: FormationPath) -> TraceScore`.
- Produces `proposed:packages/audio/src/tts.ts:playSpeech(request: SpeechPlaybackRequest) -> Promise<PlaybackOutcome>`.
- Produces `proposed:packages/audio/src/speech.ts:scorePronunciation(request: PronunciationRequest) -> Promise<PronunciationOutcome>`.
- Produces `proposed:convex/actions/pronunciation.ts:assessPronunciation(args: EphemeralPronunciationArgs) -> Promise<DerivedPronunciationResult>`.

Pointer strokes → local score → derived handwriting attempt. Microphone buffer → immediate consent check → ephemeral provider action → derived confidence/phoneme result → buffer disposal → speaking attempt. No raw media crosses a storage interface.

## Persistence, security and migration

Store derived scores/provider-model versions only. Add consent/version records and short-lived action memory, never file/database writes for audio. Version formation paths and scoring; replay derived evidence without needing raw paths.

## Observability, deployment and rollback

Record provider latency/outcome/noise class and tracing performance without media payload. Feature flags may disable external assessment while leaving repeat practice and other dimensions available. Rollback disables the action, clears transient queues and returns to local fallback.

## Documentation evidence

ADR-003 and ADR-004 are authoritative for selected integrations. Browser/provider official docs must be refreshed at implementation; missing privacy/retention proof blocks the related task.

## Ordered implementation

1. Implement local stroke capture/scoring and adaptive tolerance.
2. Implement the complete spelling/tile/composition progression.
3. Implement the reviewed/cached/browser audio hierarchy and controls.
4. Implement ephemeral consented speech assessment and fallback.
5. Integrate modalities into scheduler/mastery and run no-retention/offline regression.

## Slice verification

Run `npm exec playwright test tests/e2e/learner/multimodal-language.spec.ts` and the speech privacy scan. Expected: all modalities work; denied/offline speech is unscored; no raw audio or strokes appear in prohibited stores.
