# Tasks: SLC-005 Handwriting, Spelling and Speech

**Assumptions:** ADR-003/004 are accepted; real-child provider benchmark evidence is collected only through parent-consented supervised sessions.
**Unresolved decisions:** None inside implementation; a failed benchmark blocks external scoring and preserves unscored practice.

## Execution protocol

Tasks run in order, tests first, one scoped commit with human trailers each. Any trace/audio API change must preserve engine dimension boundaries and rerun SLC-004 regressions.

### SLC-005-T001 — Implement adaptive tracing

- **Requirements / acceptance:** PRD-FR-013; AC-SLC-005-001.
- **Allowed scope:** `packages/tracing`, tracing activity UI, reviewed sample fixtures/tests.
- **Forbidden scope:** server raw-stroke persistence, handwriting-to-reading mastery, unlicensed formation assets.
- **Interfaces:** implements `scoreTrace(TraceInput, FormationPath) -> TraceScore` with coverage, corridor, start, direction, order, lifts and completion components.
- **Steps:** write reviewed correct/wrong/incomplete/scribble/dot/finger/stylus/hand tests; confirm failure; implement pointer capture and deterministic scoring; add curriculum-controlled tolerance ladder; persist derived attempt only; performance-test 60fps target; commit.
- **Evidence:** `npm exec vitest run tests/unit/tracing/score-trace.test.ts && npm exec playwright test tests/e2e/tracing/input-matrix.spec.ts`; expected pass and frame budget evidence.
- **Edge/failure:** pointer cancel, orientation change, missing pressure, left hand, resume and bad formation asset return retry/unscored outcome without losing session.
- **Security/migration:** raw paths IndexedDB-local only if needed for resume, deleted after score unless diagnostic consent; scoring version additive.
- **Observability:** derived score dimensions, duration and renderer version only.
- **Deployment/rollback:** preview; feature flag falls back to guided display. Rollback retains derived evidence.
- **Recovery trigger:** renderer, formation path or scoring/tolerance change.

### SLC-005-T002 — Implement spelling and composition progression

- **Requirements / acceptance:** PRD-FR-012, PRD-FR-005; AC-SLC-005-002.
- **Allowed scope:** spelling engine helpers, tile/type/composition activities and tests.
- **Forbidden scope:** grammar overload, out-of-sequence scored content, generic rich-text editor.
- **Interfaces:** produces `analyseSpelling(input: SpellingAttempt, target: WordRecord) -> SpellingAnalysis` and typed tile/typing attempts.
- **Steps:** write tile/digraph/missing/full/dictation/error-classification tests; implement staged unlocks and phonics-linked correction; add word-tile/sentence-starter/picture-prompt composition; keep grammar feedback simple; run offline E2E; commit.
- **Evidence:** `npm exec vitest run tests/unit/learning-engine/spelling.test.ts && npm exec playwright test tests/e2e/learner/spelling-progression.spec.ts`; expected pass.
- **Edge/failure:** input method editor, uppercase, apostrophe, digraph tile, reversal, partial dictated sentence and unavailable keyboard remain recoverable.
- **Security/migration:** child text remains local/Convex learning evidence only and never enters AI automatically; version error taxonomy.
- **Observability:** error-category/independence/hint aggregate only.
- **Deployment/rollback:** preview; rollback renderer/analyser together between sessions.
- **Recovery trigger:** spelling taxonomy, activity contract or curriculum progression change.

### SLC-005-T003 — Implement TTS and audio hierarchy

- **Requirements / acceptance:** PRD-FR-014; AC-SLC-005-003.
- **Allowed scope:** `packages/audio` playback, core asset resolver, controls, tests.
- **Forbidden scope:** generic TTS for core phonemes, required network for core playback, audio autoplay that ignores settings.
- **Interfaces:** implements `playSpeech(request) -> PlaybackOutcome` with `reviewed|premium-cache|browser|unavailable` source.
- **Steps:** write hierarchy/mode/offline/control tests; implement reviewed asset lookup, cached approved clip, `en-GB` browser fallback; support word/slow/spell/sounds/sentence; add rate/auto/sfx/celebration/silent controls; assert first-introduction autoplay only; commit.
- **Evidence:** `npm exec vitest run tests/integration/audio/tts-fallback.test.ts`; expected hierarchy and offline fixtures pass.
- **Edge/failure:** missing voice, browser synthesis failure, interrupted playback, silent mode and unavailable phoneme clip produce visible retry/fallback.
- **Security/migration:** public reviewed core audio only; dynamic private audio follows overlay rules. Cache versioned by asset digest.
- **Observability:** playback source/start latency/error code without word text.
- **Deployment/rollback:** preview; disable premium path and fall back to reviewed/browser audio.
- **Recovery trigger:** voice/provider/browser/asset hierarchy change.

### SLC-005-T004 — Implement ephemeral pronunciation assessment

- **Requirements / acceptance:** PRD-FR-015, PRD-FR-024; AC-SLC-005-004.
- **Allowed scope:** microphone UI, audio client, Convex action, consent/provider adapter, tests.
- **Forbidden scope:** raw storage/logging/analytics, binary correctness, diagnosis, child name/stable ID in provider payload.
- **Interfaces:** implements `scorePronunciation` and `assessPronunciation`; result is `accepted|uncertain|practice_only|unavailable` plus derived scores.
- **Steps:** write permission/silence/noise/similar/timeout/consent-withdrawal/no-storage tests; implement just-in-time consent and ephemeral buffer lifecycle; send minimum target data; combine confidence/history/noise; map low confidence to uncertain; dispose buffers; scan every storage/log boundary; commit.
- **Evidence:** `npm exec vitest run tests/integration/audio/pronunciation.test.ts tests/security/no-raw-audio.test.ts`; expected all pass and zero raw payload matches.
- **Edge/failure:** revocation between capture/dispatch, timeout, malformed provider result and offline state cancel dispatch and return practice-only.
- **Security/migration:** server-only credential, disabled provider logging/training, derived-only schema; rollback disables action without losing unrelated learning.
- **Observability:** provider/model, latency, confidence band, noise band and outcome; no audio/transcript/name/stable child ID.
- **Deployment/rollback:** gated preview and benchmark; kill switch returns unscored practice. Revoke provider secret on compromise.
- **Recovery trigger:** provider/model/terms/consent/payload/scoring change.

### SLC-005-T005 — Integrate multimodal lesson and privacy regression

- **Requirements / acceptance:** PRD-FR-012…015, PRD-FR-005; AC-SLC-005-001…005.
- **Allowed scope:** scheduler modality adapters, multimodal E2E and security regression.
- **Forbidden scope:** changing mastery thresholds or cross-dimension rules.
- **Interfaces:** consumes all SLC-005 contracts and produces dimension-correct AttemptEvents.
- **Steps:** write full lesson test with permission granted/denied/offline branches; add renderers to ActivityRenderer; ensure demand rotation limits repeated microphone/handwriting; assert derived evidence enters only matching dimensions; run repository raw-media scan and SLC-004 suite; commit.
- **Evidence:** `npm exec playwright test tests/e2e/learner/multimodal-language.spec.ts && npm exec vitest run tests/security/no-raw-audio.test.ts tests/unit/learning-engine`; expected pass.
- **Edge/failure:** provider goes offline mid-session, microphone disabled, trace renderer fails or input is cancelled selects another modality without blocking.
- **Security/migration:** no raw media and no new cross-dimension migration.
- **Observability:** per-modality availability and fallback reason.
- **Deployment/rollback:** preview; flags independently disable external speech/tracing while preserving lesson continuity.
- **Recovery trigger:** any SLC-005 interface, consent or dimension mapping change.
