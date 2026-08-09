# Tasks: SLC-009 Offline, Safety and Release Hardening

**Assumptions:** Feature scope is frozen; only evidence-driven fixes are allowed. Actual release Chrome majors are resolved when the matrix runs.
**Unresolved decisions:** None; a device/provider limitation is a blocker unless the PRD-defined safe fallback passes.

## Execution protocol

Tasks run in order. Add a failing regression before every fix. Each task is a scoped, human-trailed commit; broad cleanup or feature work is forbidden. Store test evidence under versioned `tests/evidence/` only when it is necessary for release audit.

### SLC-009-T001 — Harden versioned offline activation

- **Requirements / acceptance:** PRD-FR-022, PRD-NFR-002, PRD-NFR-003; AC-SLC-009-001.
- **Allowed scope:** service worker, pack/overlay/session version modules and focused tests/fixes.
- **Forbidden scope:** new feature/cache, private content in shared cache, mid-session normal update.
- **Interfaces:** implements `pinSessionVersions(...) -> SessionVersionSet`; preserves pack/overlay activation contracts.
- **Steps:** write interrupted/corrupt/incompatible/mid-session/withdrawal/rollback tests; implement compatibility graph and atomic session pin; make normal update wait between sessions; make deletion/safety withdrawal evict/end affected activity; test prior shell/pack recovery; commit.
- **Evidence:** `npm exec playwright test tests/e2e/offline/version-activation.spec.ts`; expected all transitions pass without mixed versions.
- **Edge/failure:** quota, worker race, stale tab, missing overlay asset, withdrawn core pack and downgrade keep last safe compatible state or block affected content.
- **Security/migration:** private caches isolated; migrations copy/validate/swap; never delete attempts.
- **Observability:** version set, activation/eviction reason and failure code.
- **Deployment/rollback:** preview update/rollback rehearsal; rollback to immutable deployment and compatible manifests.
- **Recovery trigger:** shell/engine/curriculum/core/overlay compatibility or worker lifecycle change.

### SLC-009-T002 — Harden reconciliation, deletion and withdrawal

- **Requirements / acceptance:** PRD-FR-022, PRD-FR-021, PRD-FR-024, PRD-NFR-002; AC-SLC-009-002.
- **Allowed scope:** reconciliation/sync/revocation/eviction paths and tests.
- **Forbidden scope:** arrival-order mastery, deletion before confirmation, stale-content display.
- **Interfaces:** implements `reconcileCanonicalState(...) -> ReconcileResult` with revocation-first ordering.
- **Steps:** write repeated/out-of-order/gap/late-time/delete/withdraw/stale-install tests; apply server revocation/withdrawal before display/upload; evict prohibited data; upload unique events and detect gaps; reconcile canonical projections/settings/rewards; preserve original occurrence time; commit.
- **Evidence:** `npm exec playwright test tests/e2e/offline/reconciliation.spec.ts`; expected no loss/duplicate/false retention/stale restoration.
- **Edge/failure:** partial ack, multiple installs, implausible time, deleted profile with queued attempts and withdrawal during session follow explicit safe paths.
- **Security/migration:** ownership at sync, non-personal revocation marker, no hidden device-management data.
- **Observability:** batch/gap/revocation/eviction/reconcile counters with opaque installation ID.
- **Deployment/rollback:** preview with synthetic multi-install fixtures; rollback must keep revocation understanding and event compatibility.
- **Recovery trigger:** event, receipt, conflict, deletion or withdrawal rule change.

### SLC-009-T003 — Complete accessibility and child usability

- **Requirements / acceptance:** PRD-FR-025, PRD-FR-004, PRD-NFR-001; AC-SLC-009-003.
- **Allowed scope:** accessibility tests/audit and minimum proven UI fixes.
- **Forbidden scope:** redesign, new theme, feature expansion.
- **Interfaces:** preserves component contracts; adds no new domain API.
- **Steps:** write 48px/touch-spacing/voice-label/caption/contrast/greyscale/reduced-motion/focus/hand/orientation/background tests; run and triage; make surgical component/token fixes; audit parent WCAG 2.2 AA; run supervised child-use checklist in SLC-010 later; commit.
- **Evidence:** `npm exec playwright test tests/e2e/accessibility/child-parent.spec.ts && npm run audit:accessibility`; expected zero critical/serious automated findings and every PRD assertion pass.
- **Edge/failure:** zoom, long British copy, screen reader, silent mode, landscape tracing and accidental touch keep completion possible.
- **Security/migration:** no new data; accessibility telemetry stays aggregate.
- **Observability:** accessibility setting and failure code only.
- **Deployment/rollback:** preview visual/a11y regression; rollback only a fix proven harmful while retaining passing alternative.
- **Recovery trigger:** component, token, supported viewport or accessibility requirement change.

### SLC-009-T004 — Enforce quality, security and observability budgets

- **Requirements / acceptance:** PRD-NFR-001, 002, 004, 005, 006, 007, 008; AC-SLC-009-004.
- **Allowed scope:** performance/security/privacy/integrity checks, telemetry sanitizer, focused fixes.
- **Forbidden scope:** raw/sensitive telemetry, disabling gates, speculative monitoring vendor.
- **Interfaces:** implements `sanitizeOperationalEvent(...)`; produces scripts `verify:quality`, `test:security`, `test:performance`.
- **Steps:** write sanitizer leak tests and budget fixtures; enforce touch/transition/launch/TTS/tracing targets; add CSP, secret/dependency/static-private/authorisation scans; add crash/sync/validation/provider/cost/pack allow-listed telemetry; measure background/mic/download behavior; fix only proven failures; commit.
- **Evidence:** `npm run verify:quality`; expected all budgets/scans pass and forbidden payload corpus has zero matches.
- **Edge/failure:** source map, error stack, provider exception, private URL, debug build and repeated background retry must not leak or waste.
- **Security/migration:** CSP least privilege; secrets server-side; telemetry schema versioned; no data migration.
- **Observability:** exactly the approved operational categories with retention documented.
- **Deployment/rollback:** preview soak; rollback telemetry first if leakage, revoke compromised secret, preserve safety alerts.
- **Recovery trigger:** budget, CSP, dependency, telemetry schema or provider boundary change.

### SLC-009-T005 — Execute release matrix and cross-slice regression

- **Requirements / acceptance:** PRD-FR-031, PRD-NFR-001…008; AC-SLC-009-005.
- **Allowed scope:** matrix runner, full-release E2E, device evidence and fixes proven by failures.
- **Forbidden scope:** unsupported combination claim, simulated physical evidence, skipped red test.
- **Interfaces:** produces `scripts/release/verify-matrix.ts` and evidence schema `{android, chrome, formFactor, result, artifact}`.
- **Steps:** resolve Chrome stable and previous two majors; generate Android 13–17 matrix; run install/offline/reopen/IndexedDB/worker/core-pack/audio tests on each; physically test phone/tablet including oldest/newest Android; run full cross-slice offline journey; fix regressions with tests; commit evidence and runner.
- **Evidence:** `npm run verify:matrix && npm exec playwright test tests/e2e/offline/full-release-journey.spec.ts`; expected every row pass and physical records complete.
- **Edge/failure:** unavailable lab combination, browser API difference, storage eviction and audio fallback block slice until evidence/fallback passes.
- **Security/migration:** synthetic accounts/content only; destroy test data after run.
- **Observability:** matrix environment/result/artifact only.
- **Deployment/rollback:** Vercel/Convex preview only; rehearse rollback journey and record result.
- **Recovery trigger:** Chrome stable major, Android support baseline, worker/local schema or release journey change.
