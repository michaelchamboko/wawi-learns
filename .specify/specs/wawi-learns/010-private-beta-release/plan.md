# Private Beta Production Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release the exact fully tested Version 1 commit to the existing `wawi-learns` production project with complete traceability, human approvals and proven rollback.

**Architecture:** CI produces one immutable release candidate and evidence manifest. GitHub branch protection gates merge; Vercel Git integration deploys the same commit to project `wawi-learns`; environment-aware Convex deployment is coordinated with additive schema compatibility. Production is verified externally before final approval.

**Tech Stack:** GitHub Actions/CLI, Vercel project `wawi-learns`, Convex CLI/deployments, existing npm verification scripts.

## Global Constraints

- Only approved `main` deploys production; PRs receive isolated Vercel previews.
- Every production deployment exposes approved Git SHA and immutable Vercel deployment ID.
- Vercel shared assets contain no personalised content; Convex remains sole child-data/AI authority.
- Schema/function rollout has forward/backward and rollback proof.
- PRD AC-01…36 and every NFR must have fresh decisive evidence; missing evidence blocks release.
- Human approval is required per slice and FINAL; automation cannot self-approve.

---

## Interfaces and delivery flow

- Produces `proposed:scripts/release/build-evidence.ts:buildReleaseEvidence(input: ReleaseInputs) -> ReleaseEvidenceManifest`.
- Produces `proposed:scripts/release/verify-production.ts:verifyProduction(input: ProductionTarget) -> Promise<ProductionReceipt>`.
- Consumes all slice journeys, GitHub commit status, Vercel immutable deployment metadata and Convex deployment/version metadata.

Approved PR SHA → full CI/evidence manifest → Convex compatible production functions/schema → Vercel immutable build/deploy from same SHA → production smoke/offline/authority/static-leak checks → rollback rehearsal → human FINAL approval.

## Persistence, security and migration

Release evidence is immutable and contains identifiers/results, not child data. Convex migrations are additive/expand-contract; destructive cleanup waits for proof that old clients are gone. GitHub/Vercel/Convex credentials remain protected environment variables.

## Observability, deployment and rollback

Production smoke checks error logs, sync/content/provider health and deployment provenance without real child writes. Rollback uses the previous immutable Vercel deployment and compatible Convex function bundle; unsafe content is withdrawn independently before code rollback.

## Documentation evidence

Official Vercel Git/deployment and Convex production docs are rechecked immediately before release. Current inspected binding: project `wawi-learns`, ID `prj_GATes1T7lKe9y226DQpeFyAhs3Sn`, root `.`, Node 24.x.

## Ordered implementation

1. Build the AC-01…36 evidence manifest and content/curriculum inventory gate.
2. Complete named human curriculum, privacy, accessibility and Malachi usability approvals.
3. Configure/verify GitHub protection, Vercel Git integration and controlled Convex production pipeline.
4. Deploy the exact approved commit and run production smoke/provenance checks.
5. Prove rollback, install the authorised PWA and collect final human release approval.

## Slice verification

Run `npm run release:verify`. Expected: every AC/NFR/slice gate maps to a fresh pass, production receipt identifies the approved SHA/deployment, rollback test passes, and no unresolved release blocker remains.
