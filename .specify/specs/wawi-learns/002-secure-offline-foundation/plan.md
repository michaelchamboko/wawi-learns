# Secure Offline Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the authenticated, local-first PWA boundary and complete the first online-to-offline onboarding journey.

**Architecture:** The Next.js client reads/writes local stores for child mode; Convex owns identity, child authority and canonical state. Content packs activate through a two-slot manifest swap, and parent routes require online authenticated recent verification.

**Tech Stack:** Next.js 16.3.0 App Router, React 19.2.8, TypeScript 7.0.2 strict mode, Convex 1.43.0, idb 8.0.3, Zod 4.4.3, Serwist 9.5.12, Vitest and Playwright.

## Global Constraints

- Exactly one learner profile per parent; child enters directly without account selection.
- Convex is sole authority; Vercel is delivery only.
- Core child mode works after authorised offline setup; parent-sensitive surfaces require online Convex verification.
- Every local mutation is durable before success UI and carries event ID, installation ID, sequence and occurrence time.
- Pack updates never displace the last valid pack until complete validation and between-session activation.
- No child email, full birth date, raw audio, advertising identity or speculative role model.

---

## Project structure and interfaces

Create the exact PRD §33.3 package boundaries with npm workspaces. SLC-002 owns:

- `proposed:packages/local-data/src/attempts.ts:appendAttempt(event: AttemptEvent) -> Promise<void>`
- `proposed:packages/local-data/src/sync.ts:nextSyncBatch(limit: number) -> Promise<readonly AttemptEvent[]>`
- `proposed:packages/local-data/src/packs.ts:activateValidatedPack(manifest: ContentPackManifest) -> Promise<ActivationResult>`
- `proposed:convex/lib/requireParent.ts:requireParent(ctx: QueryCtx|MutationCtx|ActionCtx) -> Promise<ParentContext>`
- `proposed:convex/attempts.ts:ingestAttempts(args: { events: AttemptEvent[] }) -> Promise<SyncReceipt>`
- `proposed:packages/learning-engine/src/assessment.ts:nextAssessmentItem(state: AssessmentState) -> AssessmentDecision`

Data flows: parent auth → Convex ownership → local installation authorisation; child attempt → IndexedDB commit → UI advance → authenticated sync → Convex dedupe/gap detection → canonical projection receipt.

## Persistence, security and migration

Use additive Convex schema tables and versioned IndexedDB stores. Migration failure leaves the prior local DB/pack active. Every Convex entry calls `requireParent`; internal functions remain internal. Parent routes fail closed offline, except a local safety lockout that can only disable microphone/withdraw existing consent.

## Observability and delivery

Record privacy-minimised auth denial, pack lifecycle and sync lifecycle events. CI builds and tests; Vercel Git integration creates previews in project `wawi-learns`. Convex uses separate development/preview/production deployments. Rollback reverts application code and reactivates the prior compatible pack/database schema path without deleting attempts.

## Documentation evidence

Official fallbacks in `../000-spec-of-specs/codegraph.md`; selected identity and sync ADRs from SLC-001 are mandatory inputs.

## Ordered implementation

1. Materialise the focused workspace and PR-quality CI foundation.
2. Implement Convex schema, parent identity, ownership and gate contracts.
3. Implement IndexedDB durability, sync outbox and atomic pack activation.
4. Implement parent onboarding and versioned initial assessment.
5. Implement authorised offline child entry and protected parent/offline safety behavior.

## Slice verification

Run `npm exec playwright test tests/e2e/onboarding/offline-first-run.spec.ts` after unit/integration suites. Expected: parent setup succeeds online; corrupt download does not activate; child mode reopens offline; parent routes and sensitive actions remain denied.
