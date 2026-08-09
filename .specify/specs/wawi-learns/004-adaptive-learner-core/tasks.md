# Tasks: SLC-004 Adaptive Learner Core

**Assumptions:** Content pack and attempt contracts are frozen by SLC-002/003. Test clocks use explicit Africa/Johannesburg calendar-day fixtures while event timestamps remain UTC.
**Unresolved decisions:** None; all thresholds are configurable curriculum rules with PRD defaults.

## Execution protocol

Tasks run in order. Pure engine tests precede UI. Each task is one scoped commit with human trailers; no task may alter content inventory or local-data contracts without reopening its owning slice.

### SLC-004-T001 — Implement evidence and mastery projection

- **Requirements / acceptance:** PRD-FR-007; AC-SLC-004-001.
- **Allowed scope:** engine evidence/mastery types/functions, shared event types only by additive extension, unit/property tests.
- **Forbidden scope:** scheduler, UI, AI, cross-dimension promotion.
- **Interfaces:** implements `projectMastery(events, rules) -> MasteryProjection` and `weightAttempt(event) -> EvidenceWeight`.
- **Steps:** write state-transition/dimension/hint/tapping/day/delay/regression/reset tests; confirm failure; implement pure sorted replay and configurable thresholds; property-test order independence/idempotence; expose audit reasons; rerun and commit.
- **Evidence:** `npm exec vitest run tests/unit/learning-engine/mastery.test.ts tests/unit/learning-engine/mastery.property.test.ts tests/integration/learning-engine/replay.test.ts`; expected pass over shuffled/duplicated event sets and identical client/server replay projections.
- **Edge/failure:** full reveal, rapid taps, retries, clock-skew event, missing modality, later regression and manual reset never fabricate mastery.
- **Security/migration:** no PII; engine-version bump for rule changes; replay old fixtures before cutover.
- **Observability:** projection returns reason codes/evidence counts, not logs with item text.
- **Deployment/rollback:** preview library update; rollback bundle while keeping events immutable.
- **Recovery trigger:** AttemptEvent, dimension, state or threshold semantics change.

### SLC-004-T002 — Implement lesson scheduling and weak recovery

- **Requirements / acceptance:** PRD-FR-006, PRD-FR-008, PRD-FR-010; AC-SLC-004-002.
- **Allowed scope:** scheduler/weak recovery/prerequisite/override functions and tests.
- **Forbidden scope:** random AI choice, reward pressure, destructive overrides.
- **Interfaces:** implements `selectNextActivity(input) -> ActivityPlan`, `buildReviewQueue(...) -> readonly ReviewCandidate[]`.
- **Steps:** write ratio/backlog/spacing/rotation/prerequisite/override tests; confirm failure; implement deterministic seeded tie-breaking; implement first/second/repeated-error modality ladder; apply audited focus/hold/skip without evidence grants; test long-session fatigue signals; commit.
- **Evidence:** `npm exec vitest run tests/unit/learning-engine/scheduler.test.ts tests/integration/learning-engine/lesson-selection.test.ts`; expected exact schedule fixtures, property invariants and pack-to-plan selection pass.
- **Edge/failure:** no eligible item, backlog >10, all activities disabled, repeated same modality, disabled speaking and early content exposure return safe teaching/home plan.
- **Security/migration:** overrides carry parent/audit identity from Convex; rule-version migration is side-by-side.
- **Observability:** `ActivityPlan.reason` and aggregate backlog/rotation metrics.
- **Deployment/rollback:** preview; roll back engine version between sessions only.
- **Recovery trigger:** curriculum prerequisite, ratio, spacing or override rule change.

### SLC-004-T003 — Implement baseline and progress windows

- **Requirements / acceptance:** PRD-FR-003, PRD-FR-026; AC-SLC-004-003.
- **Allowed scope:** progress projection, tests and minimal diagnostic output.
- **Forbidden scope:** time/reward/streak as learning evidence, diagnosis, overlapping windows.
- **Interfaces:** implements `buildProgressWindows(input) -> ProgressWindow[]`, `classifyProgress(windows) -> ProgressClassification`.
- **Steps:** write assessment-skip/seven-session/minimum-evidence/non-overlap/delayed-opportunity/two-window/three-window/maintenance tests; confirm failure; implement per-dimension anchored windows; return explicit insufficient/maintenance/improving/intervention; commit.
- **Evidence:** `npm exec vitest run tests/unit/learning-engine/progress-windows.test.ts tests/integration/learning-engine/progress-replay.test.ts`; expected every PRD §38.3 case and canonical replay pass.
- **Edge/failure:** late upload, sparse dimension, ceiling performance, reset/override and clock-skew event do not create false trend.
- **Security/migration:** derived projection only; prior window versions remain auditable.
- **Observability:** classification plus evidence-count/eligibility reasons.
- **Deployment/rollback:** preview; rollback projection version, never evidence.
- **Recovery trigger:** baseline minimum, window anchor, eligibility or classification rule change.

### SLC-004-T004 — Build child home and activity shell

- **Requirements / acceptance:** PRD-FR-004, PRD-FR-009, PRD-NFR-001; AC-SLC-004-004.
- **Allowed scope:** child home/session/activity renderer/feedback UI, local session state, accessibility tests.
- **Forbidden scope:** final rewards world, parent dashboard, technical error language, server dependency for core completion.
- **Interfaces:** implements `ActivityRenderer` and `commitAttemptThenAdvance(draft) -> Promise<NextActivityResult>`.
- **Steps:** write keyboard/touch/voice-control/pause/home/abrupt-close tests; confirm failure; build one-primary-action home with introduced/mastered/practising status; implement durable-before-advance session flow; implement reviewed feedback rotation and no-punishment states; commit.
- **Evidence:** `npm exec playwright test tests/e2e/learner/child-shell.spec.ts`; expected all navigation/restart/offline/accessibility assertions pass.
- **Edge/failure:** speaker failure, accidental double tap, background/orientation change, no eligible activity and local commit error keep a safe resumable state.
- **Security/migration:** child shell exposes no parent settings/external links; local session schema versioned.
- **Observability:** local `activity_rendered`, `attempt_commit_failed`, `session_paused`; no content text/PII.
- **Deployment/rollback:** Vercel preview; rollback UI while retaining session/attempt stores.
- **Recovery trigger:** ActivityPlan, local session or child navigation contract change.

### SLC-004-T005 — Deliver core adaptive English journey

- **Requirements / acceptance:** PRD-FR-005, PRD-FR-008, PRD-FR-009, PRD-FR-010; AC-SLC-004-005.
- **Allowed scope:** learn/picture/word/tile/basic sentence/mixed mastery components, engine adapters, tests.
- **Forbidden scope:** speech score, full handwriting, AI story, maths, unsupported activity unlock.
- **Interfaces:** consumes `ActivityPlan`, content records and durable attempt callback; produces typed attempt payloads per activity.
- **Steps:** write an offline mixed-journey E2E with planned mistakes; confirm missing renderers; implement minimal activity renderers and hint/correction ladders; enforce progressive unlock and decodability; assert weak item changes modality/resurfaces and daily goal statuses remain separate; run full engine/e2e suite; commit.
- **Evidence:** `npm exec playwright test tests/e2e/learner/adaptive-english-journey.spec.ts && npm exec vitest run tests/unit/learning-engine`; expected pass.
- **Edge/failure:** missing asset/audio, duplicate tap, all distractors invalid, requested repeated word help and offline restart choose safe fallback without false evidence.
- **Security/migration:** content is trusted only after pack validation; no child text sent externally.
- **Observability:** activity type/result/hint/latency/version only.
- **Deployment/rollback:** preview; rollback renderers/engine together using pinned session version.
- **Recovery trigger:** activity contract, content schema, scheduler or mastery semantics change.
