# Tasks: SLC-002 Secure Offline Foundation

**Assumptions:** All SLC-001 ADRs consumed here are accepted and fresh. A minimal signed fixture pack is enough for this slice; full curriculum arrives in SLC-003.
**Unresolved decisions:** None. If an ADR is not accepted, block rather than substitute.

## Execution protocol

Tasks run in order and each ends in one reviewable commit with human trailers per `AGENTS.md`. Tests are written first and must fail for the expected missing behavior. Only files named in the packet may be staged.

### SLC-002-T001 — Materialise workspace and CI contract

- **Requirements / acceptance:** PRD-FR-023, PRD-FR-030, PRD-NFR-005; AC-SLC-002-001.
- **Allowed scope:** root manifests/config, package roots from PRD §33.3, `.github/workflows/ci.yml`, smoke tests.
- **Forbidden scope:** product behavior, Turborepo, Docker, second backend.
- **Interfaces:** produces npm scripts `check`, `test:content`, `test:offline`, `test:security`; preserves T001 scripts from SLC-001.
- **Steps:** add a failing structure/script contract test; create only required package roots and strict project references; configure lint/type/build/test/content/security jobs; assert GitHub PR and `main` triggers; run full check; commit.
- **Evidence:** `npm ci && npm run check && npm run build`; expected exit 0. `npm exec vitest run tests/unit/repository-contract.test.ts` passes.
- **Edge/failure:** stale lockfile, missing workspace, Node mismatch, unpinned action or skipped required check fails CI.
- **Security/migration:** least-privilege workflow permissions; no migration.
- **Observability:** CI uploads reports and build provenance, never secrets.
- **Deployment/rollback:** no deploy in this task; revert commit restores SLC-001 skeleton.
- **Recovery trigger:** workflow, Node, package-manager or required-check drift.

### SLC-002-T002 — Implement Convex parent authority

- **Requirements / acceptance:** PRD-FR-003, PRD-FR-023, PRD-FR-029, PRD-NFR-004; AC-SLC-002-002.
- **Allowed scope:** `convex/schema.ts`, auth config selected by ADR-001, parent/child/installation functions, auth tests, parent-gate UI.
- **Forbidden scope:** child selector, second profile, public admin mutation, offline parent dashboard.
- **Interfaces:** produces `requireParent(...) -> ParentContext`, `createOnlyChildProfile(...) -> Id<"childProfile">`, `requireRecentVerification(...) -> void`.
- **Steps:** write unauthenticated/cross-parent/second-child/stale-verification tests; run and confirm failure; add minimal schema indexes and shared guard; implement parent login/gate/profile mutations; assert every public function calls the guard; rerun; commit.
- **Evidence:** `npm exec vitest run tests/integration/convex/authorization.test.ts`; expected all denial and one-child invariants pass.
- **Edge/failure:** missing identity subject, duplicate concurrent create, expired session and forged child ID return typed denial without data leakage.
- **Security/migration:** additive schema only; identity subject indexed; no child email/full DOB; rollback removes functions only after confirming no production rows exist.
- **Observability:** `authz_denied` with function/reason and no child content.
- **Deployment/rollback:** preview Convex deployment; rollback to previous function bundle and keep additive tables.
- **Recovery trigger:** provider/auth schema, ownership or recent-verification contract changes.

### SLC-002-T003 — Implement durable local stores and sync

- **Requirements / acceptance:** PRD-FR-022, PRD-NFR-002, PRD-NFR-003; AC-SLC-002-003.
- **Allowed scope:** `packages/local-data`, `convex/attempts.ts`, pack/sync tests.
- **Forbidden scope:** mastery decisions, UI beyond diagnostic harness, arrival-time retention.
- **Interfaces:** implements `appendAttempt`, `nextSyncBatch`, `ingestAttempts`, `activateValidatedPack` exactly as declared in `plan.md`.
- **Steps:** write durability/dedupe/order/gap/time/pack-interruption tests; confirm failures; implement versioned IndexedDB stores and atomic transactions; implement authenticated batch ingestion and acknowledgement; implement manifest/hash/required-asset validation with two-slot activation; rerun and commit.
- **Evidence:** `npm exec vitest run tests/integration/local-data tests/integration/convex/sync.test.ts`; expected all pass, including restart before ack and corrupt pack retaining previous active version.
- **Edge/failure:** quota error, tab race, repeated batch, sequence gap, clock skew, deleted profile and corrupt manifest never lose or double count evidence.
- **Security/migration:** schema migration copies then switches; failed migration leaves old DB readable; encrypt nothing with client-shipped secrets.
- **Observability:** `local_commit_failed`, `sync_gap_detected`, `pack_activation_rejected` with non-personal reason codes.
- **Deployment/rollback:** preview; rollback adapter while preserving event and pack stores. Never clear IndexedDB automatically.
- **Recovery trigger:** event, store, pack-manifest or Convex-ingestion schema change.

### SLC-002-T004 — Implement onboarding and assessment baseline

- **Requirements / acceptance:** PRD-FR-003, PRD-FR-026; AC-SLC-002-004.
- **Allowed scope:** onboarding routes/components, `packages/learning-engine/src/assessment.ts`, profile/assessment functions, tests.
- **Forbidden scope:** visible child grade, inferred trend without evidence, mastery grants from parent estimate.
- **Interfaces:** produces `nextAssessmentItem(state) -> AssessmentDecision` and versioned `AssessmentBaselineCandidate` records.
- **Steps:** write parent-estimate/adaptive-stop/skip/restart/baseline-incomplete tests; confirm failure; implement minimal accessible flow and pure branching engine; persist immutable attempts and candidate versions; activate only completed candidate; set target 20; rerun and commit.
- **Evidence:** `npm exec vitest run tests/unit/learning-engine/assessment.test.ts && npm exec playwright test tests/e2e/onboarding/assessment.spec.ts`; expected pass.
- **Edge/failure:** mid-assessment close, skip, restart, insufficient dimension evidence and parent back navigation preserve history and never show pass/fail.
- **Security/migration:** parent-gated writes; additive assessment records; rollback keeps attempts/candidates and disables new route.
- **Observability:** `assessment_started`, `assessment_skipped`, `assessment_completed` with version and aggregate coverage only.
- **Deployment/rollback:** preview; feature remains inaccessible if schema/function unavailable. Revert commit without deleting candidates.
- **Recovery trigger:** assessment-domain, baseline-minimum or curriculum-version rule change.

### SLC-002-T005 — Complete authorised offline first run

- **Requirements / acceptance:** PRD-FR-003, PRD-FR-022, PRD-FR-029, PRD-NFR-003; AC-SLC-002-003, AC-SLC-002-005.
- **Allowed scope:** child/parent route guards, service worker/local authorisation, essential-pack UI, safety lockout, end-to-end test.
- **Forbidden scope:** offline parent dashboard/settings/approval, permission enabling while offline, real curriculum content.
- **Interfaces:** consumes `activateValidatedPack`, installation authorisation and `requireParent`; produces `canOpenChildModeOffline(snapshot) -> boolean`.
- **Steps:** write the full online setup/download/offline reopen test; confirm failure at offline launch; implement installation snapshot bound to child/curriculum/pack; protect parent routes online; implement microphone-disable-only safety lockout and sync-before-next-provider-call rule; rerun all slice tests; commit.
- **Evidence:** `npm exec playwright test tests/e2e/onboarding/offline-first-run.spec.ts`; expected child home opens offline, parent routes deny, corrupt update preserves old pack and safety lockout cannot enable/change anything.
- **Edge/failure:** expired cloud session, no pack, withdrawn pack, partial pack, stale consent and reconnect before withdrawal sync fail closed to safe child behavior.
- **Security/migration:** local authorisation contains opaque IDs/versions only; no reusable parent credential. No destructive migration.
- **Observability:** local `offline_authorisation_result` and `safety_lockout_used`; syncs aggregate status later.
- **Deployment/rollback:** Vercel preview `wawi-learns` plus Convex preview; rollback to prior immutable preview and prior valid shell/pack.
- **Recovery trigger:** service-worker, authorisation-snapshot, consent or pack-activation contract change.
