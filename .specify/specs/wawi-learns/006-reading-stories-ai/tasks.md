# Tasks: SLC-006 Reading, Stories and Governed AI

**Assumptions:** ADR-005 selects acceptable providers and logging/retention settings; no provider output is trusted as validation authority.
**Unresolved decisions:** None. Model/provider changes require ADR refresh and revalidation.

## Execution protocol

Tasks run in order and each ends in a scoped, human-trailed commit. Write adversarial tests before provider/action code. Never place provider secrets, raw prompts containing personal data or generated private media in Git.

### SLC-006-T001 — Implement controlled reading and curated reader

- **Requirements / acceptance:** PRD-FR-011, PRD-FR-017; AC-SLC-006-001.
- **Allowed scope:** sentence/reader/comprehension/retelling UI, engine evidence adapters, E2E tests.
- **Forbidden scope:** generated content, comprehension inferred from oral accuracy, out-of-band text.
- **Interfaces:** produces `buildReadingPlan(context) -> ReadingPlan` and separate reading/comprehension AttemptEvents.
- **Steps:** write phrase→sentence→passage/offline/word-support/comprehension-gap tests; implement controlled 90% known-word selection and pre-teaching; add tap-to-pronounce/grapheme/definition/practice; implement progressive questions and cautious retelling; commit.
- **Evidence:** `npm exec playwright test tests/e2e/reading/curated-reader.spec.ts`; expected offline curated story and separate evidence tracks pass.
- **Edge/failure:** missing narration/image, repeated word help, no retell confidence and unfamiliar function word preserve readable fallback.
- **Security/migration:** curated public pack only; event schema additive.
- **Observability:** story/sentence ID, support use and evidence dimension, not child speech content.
- **Deployment/rollback:** preview; rollback reader while retaining attempts.
- **Recovery trigger:** content, ReadingPlan or evidence-dimension contract change.

### SLC-006-T002 — Implement revision state and validators

- **Requirements / acceptance:** PRD-FR-017, PRD-FR-018, PRD-FR-019, PRD-NFR-008; AC-SLC-006-002.
- **Allowed scope:** generated schema/state functions, validators and tests.
- **Forbidden scope:** provider calls, client-side approval authority, mutable published revisions.
- **Interfaces:** implements `validateGeneratedRevision(...) -> ValidationResult`; state transitions require expected revision digest.
- **Steps:** write invalid transition/edit/malformed/safety/English/phonics/level/key tests; implement immutable revision/digest/state records and validator pipeline; make edit fork draft and clear approval; enforce compare-and-set publish; commit.
- **Evidence:** `npm exec vitest run tests/unit/validation/generated-revision.test.ts tests/integration/convex/generated-state.test.ts`; expected all invalid transitions reject.
- **Edge/failure:** validator crash/version change, simultaneous edit/approve, media change and withdrawn parent approval fail closed.
- **Security/migration:** server-only transition functions; additive tables/indexes; revalidation creates a new result.
- **Observability:** status transition, validator version/reason and opaque revision ID.
- **Deployment/rollback:** preview; rollback leaves new states unreadable to child and reverts to curated fallback.
- **Recovery trigger:** schema, validator, transition or approval rule change.

### SLC-006-T003 — Implement constrained remediation, examples and summaries

- **Requirements / acceptance:** PRD-FR-018, PRD-FR-021; AC-SLC-006-003.
- **Allowed scope:** Convex provider action, evidence-packet builders, response validators, deterministic fallbacks/tests.
- **Forbidden scope:** AI learning decisions, unsupported claims, name/stable ID/full history payload, automatic retry.
- **Interfaces:** implements `generateContent` for `remediation|example_sentence|parent_summary` with fixed discriminated inputs.
- **Steps:** write payload-minimisation/unsupported-claim/decodability/timeout tests; build deterministic packets from engine output; call selected paid model server-side with fixed schemas; validate exact allowed facts/words/rules; cache by non-sensitive input digest; return curated/deterministic fallback on any failure; commit.
- **Evidence:** `npm exec vitest run tests/integration/ai/constrained-actions.test.ts`; expected provider mocks never see prohibited fields and invalid output falls back once without retry.
- **Edge/failure:** cap reached, circuit open, malformed JSON, extra claim, out-of-sequence grapheme and unavailable model all return deterministic fallback.
- **Security/migration:** OpenRouter key server-side; logging disabled; no prompts/output in operational logs; prompt/validator version stored.
- **Observability:** feature/model/version/latency/token/cost/outcome only.
- **Deployment/rollback:** preview behind kill switches; rollback/disable action while deterministic features remain.
- **Recovery trigger:** model, prompt, evidence packet, validator or provider policy change.

### SLC-006-T004 — Implement stories, images, approval and overlay

- **Requirements / acceptance:** PRD-FR-017, PRD-FR-018, PRD-FR-019, PRD-FR-021; AC-SLC-006-002, AC-SLC-006-004.
- **Allowed scope:** story/image actions, protected media, parent approval UI, overlay manifest/activation, tests.
- **Forbidden scope:** public personalised URL/pack, child access before exact approval, automatic regeneration.
- **Interfaces:** implements `approveRevision`, protected overlay query and `activateValidatedOverlay`.
- **Steps:** write wrong-child/unapproved/edited/public-leak/compatibility/withdrawal tests; generate constrained story/question/image brief; validate and queue exact revision; build parent preview/edit/reject/regenerate/approve; store protected media and signed authorised manifest; atomically activate isolated overlay; commit.
- **Evidence:** `npm exec playwright test tests/e2e/stories/approved-overlay.spec.ts`; expected every negative access case fails and approved exact revision works offline.
- **Edge/failure:** edit after approval, wrong core pack, stale install, deleted item, missing image and interrupted overlay download retain safe prior state and curated fallback.
- **Security/migration:** ownership at every query/file access; overlay separate from shared cache; revision tables additive.
- **Observability:** approval/overlay activation/eviction reason with opaque IDs only.
- **Deployment/rollback:** preview; withdraw revision and evict overlay before disabling action. Public asset scan must remain clean.
- **Recovery trigger:** overlay, approval, storage or compatibility contract change.

### SLC-006-T005 — Enforce safety, cost and failure controls

- **Requirements / acceptance:** PRD-FR-018, PRD-FR-024, PRD-NFR-002, PRD-NFR-006; AC-SLC-006-003…005.
- **Allowed scope:** AI usage/circuit/cap/dedupe, safety red-team, withdrawal/provider-outage tests.
- **Forbidden scope:** cheaper unsafe fallback, silent retry, child-facing technical error, logging prompts/payloads.
- **Interfaces:** produces `reserveAiBudget(request) -> BudgetDecision` and provider kill-switch configuration.
- **Steps:** write duplicate/timeout/cap/circuit/red-team/withdrawal/no-provider tests; implement monthly cap and idempotent request digest; add timeout/no-retry/circuit breaker; run full red-team list from PRD §43.6; scan static output for private media; prove curated fallback; commit.
- **Evidence:** `npm exec vitest run tests/security/ai-red-team.test.ts tests/integration/ai/cost-controls.test.ts && npm exec playwright test tests/e2e/stories/provider-outage.spec.ts`; expected pass.
- **Edge/failure:** concurrent duplicate, provider compromise, moderation outage, cap boundary and stale approved item fail safe.
- **Security/migration:** usage data minimal; compromise withdrawal takes precedence over session pin.
- **Observability:** aggregate spend/latency/failure/circuit/validator counters with alert thresholds.
- **Deployment/rollback:** feature kill switch, revoke secret, withdraw/evict affected items, then rollback code.
- **Recovery trigger:** provider/model/cost/safety rule or incident-response procedure change.
