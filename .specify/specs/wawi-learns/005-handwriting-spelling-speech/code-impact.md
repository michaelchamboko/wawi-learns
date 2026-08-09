# SLC-005 code impact

## Consumes

ActivityPlan/AttemptEvent/dimension contracts from SLC-004, formation/audio assets from SLC-003 and consent/auth/local storage from SLC-002.

## Creates/modifies

- `packages/tracing/`, `packages/audio/`.
- Spelling, tracing and speaking activity renderers.
- `convex/actions/pronunciation.ts` and consent checks.
- Speech/handwriting unit, integration, privacy and E2E tests.

## Regression paths

Finger/stylus/mouse, left/right hand, wrong direction/incomplete/scribble/dot/crossbar, tile digraphs, dictated input, permission deny, silence/noise/similar word, provider timeout, offline fallback, consent withdrawal and raw-media storage scan.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-005-001 | `tests/unit/tracing/score-trace.test.ts`, `tests/e2e/tracing/input-matrix.spec.ts` |
| AC-SLC-005-002 | `tests/e2e/learner/spelling-progression.spec.ts` |
| AC-SLC-005-003 | `tests/integration/audio/tts-fallback.test.ts` |
| AC-SLC-005-004 | `tests/integration/audio/pronunciation.test.ts`, `tests/security/no-raw-audio.test.ts` |
| AC-SLC-005-005 | `tests/e2e/learner/multimodal-language.spec.ts` |
