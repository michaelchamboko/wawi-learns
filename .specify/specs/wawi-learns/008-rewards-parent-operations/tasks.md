# Tasks: SLC-008 Rewards and Parent Operations

**Assumptions:** Parent mode is online-only except the already-built safety lockout; visual theme uses the simplest approved collection/build/character presentation and can be restyled later without changing reward data.
**Unresolved decisions:** Final art/mascot direction may change presentation only; it cannot block the functional three-part reward model.

## Execution protocol

Tasks run in order, tests first, one scoped human-trailed commit each. Parent operations must include authorisation/recent-verification denial tests and must not duplicate canonical engine rules.

### SLC-008-T001 — Implement rewards and adventure projection

- **Requirements / acceptance:** PRD-FR-020; AC-SLC-008-001.
- **Allowed scope:** reward engine, Convex reward events/world projection, child reward UI and tests.
- **Forbidden scope:** separate game, reward subtraction, purchases, threatening streaks.
- **Interfaces:** implements `projectWorldState(events) -> WorldState` and `awardLearningReward(outcome) -> RewardEvent[]`.
- **Steps:** write dedupe/no-loss/collection/build/character/intensity/streak tests; implement immutable reward IDs and pure projection; connect only eligible learning outcomes; add calm/major/reduced-motion presentation; verify mistake path; commit.
- **Evidence:** `npm exec vitest run tests/unit/learning-engine/rewards.test.ts && npm exec playwright test tests/e2e/rewards/adventure.spec.ts`; expected progress never decreases.
- **Edge/failure:** duplicate sync, offline reward, reset mastery, missed day and animation failure preserve earned state.
- **Security/migration:** ownership guard on server; event schema additive.
- **Observability:** reward type/reason/version and projection mismatch, no child content.
- **Deployment/rollback:** preview; rollback UI/projector while retaining reward events.
- **Recovery trigger:** reward event/projection/eligibility rule change.

### SLC-008-T002 — Implement evidence-backed parent dashboard

- **Requirements / acceptance:** PRD-FR-008, PRD-FR-021, PRD-FR-026; AC-SLC-008-002.
- **Allowed scope:** dashboard query/projection/UI, deterministic and validated AI summary, tests.
- **Forbidden scope:** unsupported claim, time-as-learning, diagnosis/emotional label, offline parent access.
- **Interfaces:** implements `getParentDashboard(...) -> ParentDashboard` with evidence links and `Why this is next`.
- **Steps:** write all-track/weak-detail/insufficient/maintenance/window/sync tests; build deterministic packet from canonical events; implement protected summary/detail UI; pass packet to SLC-006 summary action and validate exact facts; show deterministic fallback; commit.
- **Evidence:** `npm exec playwright test tests/e2e/parent/dashboard-evidence.spec.ts`; expected all displayed claims resolve to underlying records.
- **Edge/failure:** sparse data, late sync, AI outage/extra claim and clock-skew show explicit uncertainty/fallback.
- **Security/migration:** ownership/recent verification; no public caching; derived views recomputable.
- **Observability:** dashboard freshness/query failure/AI fallback reason only.
- **Deployment/rollback:** preview; disable AI wording first, deterministic dashboard remains.
- **Recovery trigger:** projection, progress-window, summary packet or dashboard contract change.

### SLC-008-T003 — Implement audited controls and overrides

- **Requirements / acceptance:** PRD-FR-006, PRD-FR-021, PRD-FR-029; AC-SLC-008-003.
- **Allowed scope:** parent settings/overrides/activity controls, Convex audit functions, tests.
- **Forbidden scope:** evidence creation, attempt deletion, safety/decodability bypass, offline setting changes.
- **Interfaces:** implements `setParentOverride(...)` and local reconciliation into LessonContext.
- **Steps:** write focus/target/difficulty/pace/word/activity/mic/strictness/subject/story/pack/reward tests; assert overrides never grant evidence; implement guarded audited mutations and latest-valid reconciliation; add mastery reset event preserving history; commit.
- **Evidence:** `npm exec vitest run tests/integration/convex/overrides.test.ts tests/unit/learning-engine/overrides.test.ts`; expected all controls and prohibition invariants pass.
- **Edge/failure:** concurrent update, stale offline setting, disabled all activities and early content exposure retain safe teaching/home path.
- **Security/migration:** recent verification for sensitive changes; audit history immutable; latest valid update wins.
- **Observability:** override type/version/result without value when sensitive.
- **Deployment/rollback:** preview; disable control UI and preserve audit; revert engine adapter if needed.
- **Recovery trigger:** override schema, safety or scheduler contract change.

### SLC-008-T004 — Implement custom packs and assisted activities

- **Requirements / acceptance:** PRD-FR-021, PRD-FR-017, PRD-FR-018; AC-SLC-008-004.
- **Allowed scope:** parent custom-pack/assisted UI, validation/approval integration, overlay tests.
- **Forbidden scope:** runtime admin role, unvalidated publication, custom content in shared static pack.
- **Interfaces:** produces `createCustomPackDraft`, `validateCustomPackRevision`, `approveCustomPackRevision` using existing revision/overlay contracts.
- **Steps:** write manual/AI-assisted/edit-after-validation/prompt-injection/wrong-child/offline tests; implement parent draft fields and optional constrained suggestions; run full validators; require exact revision approval; publish private overlay; suggest reviewed 2–5 minute activities from weak reasons; commit.
- **Evidence:** `npm exec playwright test tests/e2e/parent/custom-pack.spec.ts`; expected invalid/edited content blocked and approved exact revision available offline only to child.
- **Edge/failure:** arbitrary theme injection, missing pronunciation/image, edit after approval, provider outage and withdrawal use manual/curated safe path.
- **Security/migration:** parent ownership; private overlay only; no secrets/provider direct client call.
- **Observability:** draft/validation/approval/withdrawal status and reason.
- **Deployment/rollback:** preview; withdraw affected pack and evict before disabling feature.
- **Recovery trigger:** custom schema, validator, approval or overlay contract change.

### SLC-008-T005 — Implement export, consent and verified deletion

- **Requirements / acceptance:** PRD-FR-021, PRD-FR-024, PRD-FR-029; AC-SLC-008-005.
- **Allowed scope:** data-rights functions/UI/jobs, local purge/eviction, stale-rejection tests.
- **Forbidden scope:** offline completion claim, child-data backup outside policy, remote device-management UI.
- **Interfaces:** implements `requestProfileDeletion(...) -> DeletionReceipt`, structured export and revocation-marker checks in sync.
- **Steps:** write export/withdrawal/current-local/stale-upload/stale-install/account-deletion tests; implement recent-verification request and server transaction/job; cancel pending provider work; mark revocation before deletion; confirm server then purge current local stores/queues/overlays; reject stale sync and make stale install self-purge; commit.
- **Evidence:** `npm exec playwright test tests/e2e/parent/data-rights.spec.ts`; expected all deletion/withdrawal paths pass and no restoration occurs.
- **Edge/failure:** network loss mid-delete, job retry, queued provider call, stale device and partial local purge remain blocked/signed out until consistent.
- **Security/migration:** minimal non-personal revocation marker only; deletion audit contains no learning evidence; destructive step after confirmation.
- **Observability:** deletion state/retry/purge completion with opaque operation ID.
- **Deployment/rollback:** preview then supervised production; accepted deletion cannot be rolled back, only safely completed. Code rollback must preserve worker compatibility.
- **Recovery trigger:** schema, retention, consent, sync rejection or purge scope change.
