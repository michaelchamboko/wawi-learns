# Rewards and Parent Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Malachi motivating learning-only progress and give the parent accurate control, evidence and data rights behind a secure online gate.

**Architecture:** Reward/world state and dashboard claims are projections from immutable attempts/reward/override events. Convex authorises all parent operations; the UI exposes deterministic summaries first and optionally validated AI wording from SLC-006.

**Tech Stack:** Existing React/Next/Convex/engine/overlay stack, Vitest and Playwright; no new runtime dependency.

## Global Constraints

- Wrong answers never remove earned rewards; streaks never threaten loss or shame.
- Parent dashboard and sensitive mutations require online auth and recent verification.
- Deterministic evidence is source of truth; AI may only restate its fixed packet and must show deterministic fallback.
- Overrides cannot create Strong/Mastered/progression evidence or erase immutable history.
- Personalised content revisions must pass validation/approval and private-overlay rules.
- Deletion is never reported complete before server confirmation and current local purge; stale uploads/restores are rejected.

---

## Interfaces and data flow

- Produces `proposed:packages/learning-engine/src/rewards.ts:projectWorldState(events: readonly RewardEvent[]) -> WorldState`.
- Produces `proposed:convex/dashboard.ts:getParentDashboard(args: { childId: Id<"childProfile"> }) -> ParentDashboard`.
- Produces `proposed:convex/overrides.ts:setParentOverride(args: ParentOverrideInput) -> Promise<Id<"parentOverrides">>`.
- Produces `proposed:convex/dataRights.ts:requestProfileDeletion(args: { childId: Id<"childProfile"> }) -> Promise<DeletionReceipt>`.

Attempt/mastery outcome → immutable reward event → world projection. Canonical evidence → deterministic dashboard packet → optional validated plain-English rendering. Parent action → recent verification/ownership → audited event/status → local reconciliation/eviction.

## Persistence, security and migration

Reward/override/approval/deletion audit is append oriented. Deletion uses a transaction/job workflow and minimum non-personal revocation marker. Personalised statuses are Convex-authoritative. Migrations are additive and reversible until destructive deletion is server-confirmed.

## Observability, deployment and rollback

Observe reward projection mismatches, dashboard freshness, override actions, export/deletion state and eviction completion without logging content/PII. Preview first. Rollback disables new parent actions; deletion workflows already accepted must finish safely rather than be rolled back.

## Documentation evidence

No new library. Convex auth/storage/function evidence is in `../000-spec-of-specs/codegraph.md`; data rights follow PRD §§31/35.

## Ordered implementation

1. Implement immutable rewards/world projection and child presentation.
2. Implement deterministic dashboard, weak explanations and AI-summary validation.
3. Implement audited parent controls and overrides.
4. Implement custom packs and assisted activities through the existing validator/overlay.
5. Implement export, consent withdrawal and verified deletion/stale-device behavior.

## Slice verification

Run `npm exec playwright test tests/e2e/parent/dashboard-controls-data-rights.spec.ts`. Expected: evidence claims match source events, overrides cannot grant mastery, rewards never decrease on mistakes and deletion rejects stale restoration.
