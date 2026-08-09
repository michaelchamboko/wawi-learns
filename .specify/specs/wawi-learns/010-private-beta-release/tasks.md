# Tasks: SLC-010 Private Beta Production Release

**Assumptions:** SLC-001…009 are human-approved with fresh evidence; configured GitHub/Vercel/Convex credentials are available to authorised release operators.
**Unresolved decisions:** None. Missing access or evidence is a blocker, not permission to simulate release.

## Execution protocol

Tasks run in order and each is one scoped human-trailed commit until the deployment task, which records immutable receipts. Never direct-push protected `main`, never weaken required checks and never label preview `LIVE`.

### SLC-010-T001 — Build the complete release evidence gate

- **Requirements / acceptance:** PRD-FR-032, PRD-NFR-001…008; AC-SLC-010-001.
- **Allowed scope:** release evidence schema/builder, AC mapping, inventory/version checks and tests.
- **Forbidden scope:** manual PASS without artifact, test bypass, new feature.
- **Interfaces:** implements `buildReleaseEvidence(...) -> ReleaseEvidenceManifest` and scripts `release:evidence`, `release:verify`.
- **Steps:** write missing/stale/wrong-version/failed-evidence tests; map AC-01…36 and every NFR/slice gate to commands/artifacts; include exact inventory counts/digests and app/engine/curriculum/content/prompt/speech versions; fail closed on age/drift; run against preview candidate; commit.
- **Evidence:** `npm run release:evidence && npm exec vitest run tests/integration/release/evidence-manifest.test.ts`; expected 36 AC rows, all NFRs and all slice gates pass.
- **Edge/failure:** duplicated AC, stale device result, changed commit, absent reviewer or mismatched content digest blocks manifest.
- **Security/migration:** evidence contains no child data/secrets; schema versioned.
- **Observability:** release-gate result/reason and artifact digest.
- **Deployment/rollback:** none; revert builder only after preserving previous evidence schema reader.
- **Recovery trigger:** PRD acceptance/NFR, test command, version or candidate SHA change.

### SLC-010-T002 — Complete human review gates

- **Requirements / acceptance:** PRD-FR-001, PRD-FR-024, PRD-FR-025, PRD-FR-031, PRD-FR-032; AC-SLC-010-002.
- **Allowed scope:** named review records/evidence references and fixes proven necessary by findings.
- **Forbidden scope:** self-approval, invented session, unresolved Critical/Important finding.
- **Interfaces:** produces curriculum, privacy/safety, accessibility and supervised usability approval records consumed by `release:verify`.
- **Steps:** run curriculum alignment/inventory review; complete privacy impact and provider-retention review; complete accessibility audit; conduct parent-supervised Malachi sessions for navigation/voice/reward/tracing/correction/variety/fatigue; log findings; fix/retest or block; obtain named approvals; commit records.
- **Evidence:** `npm run release:verify -- --phase human-review`; expected every required named approval present and no unresolved Critical/Important finding.
- **Edge/failure:** child distress/confusion, curriculum dispute, privacy uncertainty or inaccessible critical flow blocks release.
- **Security/migration:** minimise session notes; no raw audio/video or unnecessary personal detail.
- **Observability:** approval identity/date/scope/finding IDs only.
- **Deployment/rollback:** no production deploy; fixes return through relevant regression gates.
- **Recovery trigger:** material product/content/provider/privacy/a11y change or evidence expiry.

### SLC-010-T003 — Configure protected delivery pipeline

- **Requirements / acceptance:** PRD-FR-030, PRD-NFR-004; AC-SLC-010-003.
- **Allowed scope:** GitHub Actions/protection evidence, Vercel Git binding, Convex environment deployment scripts/tests.
- **Forbidden scope:** direct production push, manual untracked deploy, new Vercel project, committed IDs/tokens beyond non-secret project metadata.
- **Interfaces:** consumes `main`, Vercel `wawi-learns` root `.`, and Convex envs; produces immutable candidate metadata.
- **Steps:** write platform-binding tests; verify required checks and production branch; connect GitHub repository to existing Vercel project and confirm PR previews; set protected environment variables; implement expand/verify/deploy/contract-safe Convex flow; pin Vercel CLI if CI uses it; run preview pipeline; commit workflow.
- **Evidence:** `npm exec vitest run tests/integration/release/platform-binding.test.ts` plus `gh api`/`vercel project inspect wawi-learns` receipts; expected correct repo/project/root/branch and preview READY.
- **Edge/failure:** Vercel framework remains Other after source, wrong team/project, missing required check/env or incompatible schema blocks merge/deploy.
- **Security/migration:** GitHub/Vercel/Convex secrets protected; least workflow permissions; expand-contract migration with tested backward compatibility.
- **Observability:** candidate SHA, workflow run, Convex deployment and Vercel preview ID.
- **Deployment/rollback:** preview only here; rollback workflow commit and prior Convex preview functions.
- **Recovery trigger:** repo/project/branch/root/env or deployment workflow change.

### SLC-010-T004 — Deploy and verify exact production candidate

- **Requirements / acceptance:** PRD-FR-030, PRD-NFR-002, 004, 006; AC-SLC-010-004.
- **Allowed scope:** approved merge/deploy, production smoke/provenance receipt.
- **Forbidden scope:** code/content edit after candidate approval, preview URL as production, unapproved generated content.
- **Interfaces:** implements `verifyProduction(...) -> ProductionReceipt`.
- **Steps:** merge approved PR after required checks; deploy compatible Convex production functions/schema; let Vercel Git integration deploy exact `main` SHA to `wawi-learns`; wait for READY; verify exposed versions/SHA/deployment ID, installability, core offline journey, auth authority, sync, pack hashes and private-static leak; inspect production errors; record receipt.
- **Evidence:** `npm exec playwright test tests/e2e/release/production-smoke.spec.ts --project=production`; expected pass and receipt SHA equals GitHub/Vercel source SHA.
- **Edge/failure:** build error, deployment mismatch, Convex incompatibility, smoke error or private asset leak triggers rollback and blocks completion.
- **Security/migration:** no test child in production beyond authorised private-beta setup; logs scanned for secrets/PII.
- **Observability:** deployment READY, SHA/ID, smoke results and post-deploy error scan.
- **Deployment/rollback:** production deployment. On failure withdraw unsafe content, promote previous Vercel deployment, restore compatible Convex functions and verify old app handles pending events.
- **Recovery trigger:** production SHA/deployment/version changes or post-deploy incident.

### SLC-010-T005 — Prove rollback and approve private beta

- **Requirements / acceptance:** PRD-FR-032, PRD AC-01…36; AC-SLC-010-005.
- **Allowed scope:** rollback rehearsal/receipt, authorised PWA install, final ledger approval.
- **Forbidden scope:** deleting production data, simulated human approval, skipping rollback because smoke passed.
- **Interfaces:** consumes production receipt and final-gate evidence; produces rollback receipt and FINAL approval.
- **Steps:** generate synthetic pending events on test installation; promote previous safe Vercel deployment and compatible Convex bundle in controlled rehearsal; verify no event loss/mixed version; restore approved candidate and rerun smoke; install on Malachi's authorised browser; obtain product-owner FINAL approval; run orchestrator `approve stage=FINAL`.
- **Evidence:** `npm exec playwright test tests/e2e/release/rollback.spec.ts && npm run release:verify`; expected pass and orchestration project state `RELEASE_READY` after human approval.
- **Edge/failure:** rollback cannot read queued events, stale worker persists, prior deployment incompatible or human withholds approval returns project to BLOCKED/STALE.
- **Security/migration:** synthetic rollback data only; authorised installation uses real parent consent after release approval.
- **Observability:** rollback source/target deployment IDs, duration, data-integrity result and approval identity/time.
- **Deployment/rollback:** this task is the rollback proof; if proof fails, leave the last known safe deployment active and reopen owning slice.
- **Recovery trigger:** any production code/content/config/provider or acceptance-evidence change after approval.
