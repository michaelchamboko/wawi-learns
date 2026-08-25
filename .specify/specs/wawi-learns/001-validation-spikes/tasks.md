# Tasks: SLC-001 Validation Spikes

**Assumptions:** Synthetic fixtures are sufficient for platform probes. Provider benchmarks involving real child speech require separate parent consent and must not run in automated CI.
**Unresolved decisions:** Exactly the seven ADRs listed in `plan.md`; the slice cannot pass until each is accepted or explicitly blocks the project.

## Execution protocol

Complete tasks in ID order. Start with a failing test or measurable failing probe, implement the minimum evidence path, run the decisive commands, then stage only listed files and record `git write-tree` as the candidate tree ID. Complete the artifact-bound round robin on that tree before committing. Before every commit, read repository `git config user.name` and `git config user.email`; stop if either is empty. Add matching `Co-authored-by` then `Signed-off-by` trailers and verify them with `git log -1`. The product owner authorizes direct task-scoped pushes to `main`: push only after the review gate passes, require GitHub Actions and Vercel receipts to match the pushed SHA before `DONE`, and revert the exact task commit plus block on hosted failure.

### SLC-001-T001 — Bind repository, toolchain and hosting

- **Requirements / acceptance:** PRD-FR-023, PRD-FR-030, PRD-NFR-004; AC-SLC-001-001, AC-SLC-001-002.
- **Allowed scope:** root npm/Next/TypeScript/ESLint/Playwright manifests and configuration (`next.config.ts`, `playwright.config.ts`), `.github/workflows/ci.yml`, `tests/unit/repository-contract.test.ts`, `tests/e2e/spikes/platform-baseline.spec.ts`, `docs/decisions/ADR-000-toolchain.md`.
- **Forbidden scope:** learner features, production credentials, Vercel project creation, alternate package managers.
- **Interfaces:** produces the root npm scripts `lint`, `typecheck`, `test:unit`, `test:integration`, `test:e2e`, `build`; consumes GitHub remote and Vercel project named in DEC-012.
- **Steps:** (1) write the Playwright assertion for app metadata, build SHA and Vercel project identity; (2) run it and capture failure because no app exists; (3) initialise the pinned Next/React/TS npm workspace with strict TypeScript; (4) add CI checks and project/version exposure; (5) link the existing Vercel project without committing `.vercel`; (6) rerun checks, stage the allowed candidate, complete the review gate, commit, and push directly to `main`; (7) retain GitHub Actions and Vercel receipts for that SHA before completion.
- **Evidence:** `npm ci && npm run lint && npm run typecheck && npm run build && npm exec playwright test tests/e2e/spikes/platform-baseline.spec.ts`; expected exit 0 and Next.js build output. `gh repo view michaelchamboko/wawi-learns --json isEmpty,name` must identify `wawi-learns` before first push.
- **Edge/failure:** wrong remote, non-`main` production branch, Vercel root not `.`, incompatible dependency pin or secret in bundle blocks completion.
- **Security/migration:** no secrets in manifests; no data migration.
- **Observability:** build exposes `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_GIT_SHA`; required CI records compact results in GitHub job logs and uses SHA-bound platform receipts, never GitHub-managed cache or artifact storage.
- **Deployment/rollback:** the reviewed direct `main` push is a Vercel production candidate; rollback by reverting this exact commit on `main` and unlinking the local `.vercel` directory, never deleting the remote project.
- **Recovery trigger:** dependency-pin, Vercel-project, Node-version or remote-branch drift reopens the task.

### SLC-001-T002 — Prove PWA offline/update lifecycle

- **Requirements / acceptance:** PRD-FR-022, PRD-FR-023, PRD-NFR-001, PRD-NFR-003; AC-SLC-001-002.
- **Allowed scope:** `app/manifest.ts`, `app/sw.ts`, `next.config.ts`, `public/icons/`, `tests/e2e/spikes/pwa-update.spec.ts`, ADR-007 draft.
- **Forbidden scope:** learning content, private overlay, production cache policy.
- **Interfaces:** produces `ServiceWorkerVersion` and the atomic shell-update contract; consumes root build scripts from T001.
- **Steps:** write an install/offline/update/reopen test; prove it fails without a worker; add the minimum Serwist worker and valid manifest; assert old shell remains active through interrupted update; document cache version and recovery semantics; rerun and commit.
- **Evidence:** `npm run build && npm exec playwright test tests/e2e/spikes/pwa-update.spec.ts`; expected pass for first install, offline reopen and interrupted update.
- **Edge/failure:** opaque response, corrupt cache, denied persistent storage, service-worker activation mid-session and icon/manifest mismatch fail closed to the prior shell.
- **Security/migration:** cache public shell only; never cache authenticated/private responses. Cache-version changes are additive and activated between sessions.
- **Observability:** emit local `sw_update_state` events without child identifiers.
- **Deployment/rollback:** preview deployment only; rollback points preview to the previous immutable deployment and clears the new cache namespace on next controlled activation.
- **Recovery trigger:** any supported Chrome update or Serwist/Next pin change invalidates evidence.

### SLC-001-T003 — Prove local event reconciliation

- **Requirements / acceptance:** PRD-FR-022, PRD-FR-023, PRD-NFR-002; AC-SLC-001-003.
- **Allowed scope:** `packages/local-data/`, minimal `convex/spikes/sync.ts`, `tests/integration/spikes/sync-contract.test.ts`, ADR-002.
- **Forbidden scope:** final schema, mastery heuristics, real learner data.
- **Interfaces:** proposes `appendAttempt(event: AttemptEvent): Promise<void>` and `reconcileAttempts(batch: readonly AttemptEvent[]): Promise<SyncReceipt>`.
- **Steps:** define attempt/idempotency/source-sequence types; write duplicate/out-of-order/gap/implausible-time tests and see them fail; implement an IndexedDB outbox plus minimal Convex dedupe path; interrupt acknowledgements and retry; compare custom queue versus any candidate library; record the accepted contract and delete rejected code.
- **Evidence:** `npm exec vitest run tests/integration/spikes/sync-contract.test.ts`; expected all duplicate, order, gap and occurrence-time cases pass.
- **Edge/failure:** same event twice, gap, clock skew, offline close before ack and deleted-profile rejection preserve local durability and never double count.
- **Security/migration:** synthetic IDs only; Convex function authorises the synthetic parent fixture. No production migration.
- **Observability:** `sync_batch_started`, `sync_batch_acked`, `sync_gap_detected`, with counts and opaque installation ID.
- **Deployment/rollback:** Convex test deployment only; remove spike function after ADR acceptance. Rollback retains local events and removes only the failed adapter.
- **Recovery trigger:** Convex/idb version, event schema or conflict-rule change reopens the task.

### SLC-001-T004 — Select identity, speech/TTS and tracing paths

- **Requirements / acceptance:** PRD-FR-013, PRD-FR-014, PRD-FR-015, PRD-FR-028; AC-SLC-001-004, AC-SLC-001-005.
- **Allowed scope:** ADR-001, ADR-003, ADR-004; synthetic benchmark fixtures and focused spike tests.
- **Forbidden scope:** production accounts, retained audio, medical scoring, proprietary assets without licence.
- **Interfaces:** outputs direct integration decisions; no generic multi-provider abstraction is permitted.
- **Steps:** define weighted rubrics from PRD §§25.7, 40.1 and 43; test identity recent-verification/offline-boundary behavior; benchmark `en-GB` TTS and speech paths with synthetic/adult-consented fixtures; benchmark custom `perfect-freehand` scoring against a reviewed wrapper; record false-rejection, latency, bundle, privacy, licence and replacement evidence; select one path per ADR or block.
- **Evidence:** `npm exec vitest run tests/integration/spikes/identity.test.ts tests/integration/spikes/speech.test.ts tests/integration/spikes/tracing.test.ts`; expected pass plus ADR status `accepted`.
- **Edge/failure:** denied microphone, noise, silence, similar word, left-handed input, stylus pressure absence and auth refresh failure must have explicit outcomes.
- **Security/migration:** zero raw-audio persistence assertion; credentials server-side; no migration.
- **Observability:** benchmark reports contain aggregate latency/error only and no audio payload.
- **Deployment/rollback:** test/preview environments only; revoke temporary provider credentials after benchmark. Revert the task commit to roll back.
- **Recovery trigger:** provider terms, browser API, licence, pricing or support-matrix change reopens the relevant ADR.

### SLC-001-T005 — Select AI/safety, licensing and packaging paths

- **Requirements / acceptance:** PRD-FR-018, PRD-FR-019, PRD-FR-028, PRD-NFR-004, PRD-NFR-008; AC-SLC-001-004, AC-SLC-001-005.
- **Allowed scope:** ADR-005, ADR-006, ADR-007; synthetic content/provider benchmark fixtures.
- **Forbidden scope:** child profile data, free router with personalised data, production generation, unlicensed curriculum assets.
- **Interfaces:** outputs one paid OpenRouter model policy, any justified dedicated provider choices, approved source register and pack manifest/size contract.
- **Steps:** define benchmark and rejection thresholds; run structured-output/British-English/phonics/safety/latency/cost tests on synthetic prompts; inspect provider retention/logging controls; prove validator fail-closed behavior; audit proposed content/asset sources; compare essential/full pack partitions against storage and update tests; accept ADRs or block.
- **Evidence:** `npm exec vitest run tests/integration/spikes/ai-safety.test.ts tests/integration/spikes/licensing.test.ts tests/integration/spikes/packaging.test.ts`; expected pass and all three ADRs accepted.
- **Edge/failure:** malformed JSON, US spelling, unsafe topic, provider log retention, missing licence, corrupt/oversized pack and cap exhaustion select curated fallback or block.
- **Security/migration:** no child data or credentials in fixtures/artifacts; no migration.
- **Observability:** benchmark records model/version, latency, estimated cost and validator result only.
- **Deployment/rollback:** no production deployment. Revoke benchmark keys and remove rejected-provider code; ADR history remains.
- **Recovery trigger:** provider/model/version, terms, licence or pack-budget change reopens the task.
