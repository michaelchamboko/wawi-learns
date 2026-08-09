# Reading, Stories and Governed AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete reading/comprehension and useful personalised AI while preserving deterministic learning and a revision-specific child-safety boundary.

**Architecture:** Curated reader uses local packs. Convex actions build minimal structured provider inputs from engine-selected objectives; deterministic validators produce revision-bound results. Approved media lives in Convex storage and syncs through a child-authorised overlay separate from the public core cache.

**Tech Stack:** Next.js/React, Convex actions/storage, selected ADR-005 providers, Zod validators, OpenRouter server API, Playwright/Vitest.

## Global Constraints

- AI never selects curriculum, objective, activity, difficulty, mastery or progress claim.
- Every child-facing generated revision passes schema, safety, British English, phonics/vocabulary, reading-level and answer validation; applicable content also needs exact parent approval.
- Failed generation/validation uses matching curated content with no automatic generation retry.
- Provider payloads exclude child name, stable profile ID, full history and unrelated interests; logging/training retention is disabled.
- Private overlays are Convex-authorised, per child/revision/curriculum/core-pack and never enter shared Vercel assets.
- Core reading and deterministic parent reports work when every provider is disabled.

---

## Interfaces and data flow

- Produces `proposed:packages/validation/src/generatedContent.ts:validateGeneratedRevision(input: GeneratedRevision, rules: ValidationRules) -> ValidationResult`.
- Produces `proposed:convex/actions/generateContent.ts:generateContent(args: ConstrainedGenerationRequest) -> Promise<GeneratedRevisionRef>`.
- Produces `proposed:convex/generatedContent.ts:approveRevision(args: { revisionId: Id<"generatedContent"> }) -> Promise<void>`.
- Produces `proposed:packages/local-data/src/overlay.ts:activateValidatedOverlay(manifest: OverlayManifest) -> Promise<ActivationResult>`.

Engine objective → minimal structured request → server provider → schema/safety/education validators → revision state → parent exact-revision approval → protected Convex media/manifest → local isolated overlay activation. Edit creates a new revision from the validation start.

## Persistence, security and migration

Generated revisions, validator results, approvals, cost and withdrawal are append/audit oriented. Media uses protected Convex storage. State transitions use compare-and-set revision checks. Migration is additive; invalidating rules marks affected revisions stale, never silently republishes.

## Observability, deployment and rollback

Track feature/provider/model/version/latency/tokens/images/cost/validator reason without sensitive prompt content. Per-feature kill switches and spend cap return curated fallback. Rollback withdraws affected revisions, evicts overlays and disables provider actions before code rollback.

## Documentation evidence

ADR-005 plus OpenRouter and selected provider official policies at implementation. Convex action/storage official fallbacks are in `../000-spec-of-specs/codegraph.md`. Missing zero-retention evidence blocks the provider.

## Ordered implementation

1. Implement controlled reading/comprehension and curated reader.
2. Implement generated-content revision schema, validators and state machine.
3. Implement minimal-data provider actions for remediation/examples/summaries.
4. Implement story/image generation, parent approval and private overlay.
5. Implement cost/safety/fallback/withdrawal controls and full red-team journey.

## Slice verification

Run `npm exec playwright test tests/e2e/stories/approved-overlay.spec.ts` and AI safety tests. Expected: unapproved/edited/wrong-child content is impossible to display, withdrawal evicts it, and provider outage shows curated content.
