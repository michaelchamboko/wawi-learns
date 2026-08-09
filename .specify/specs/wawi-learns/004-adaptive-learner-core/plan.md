# Adaptive Learner Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first complete offline English lesson adapt from immutable evidence and produce trustworthy dimension-specific progress.

**Architecture:** `packages/learning-engine` is a pure deterministic state machine fed by pinned curriculum rules and immutable events. React renders typed `ActivityPlan` contracts, commits an `AttemptEvent` before advancing, and never embeds educational rules in components or AI prompts.

**Tech Stack:** TypeScript, React, Vitest, fast-check, IndexedDB adapter from SLC-002, content schemas/packs from SLC-003.

## Global Constraints

- Mastery is per dimension and requires configured multi-modal, multi-day and delayed evidence; one lucky/hinted response cannot pass.
- Parent overrides may expose teaching or change pacing but cannot create mastery/progression evidence or erase attempts.
- Mistakes never remove rewards or trigger harsh/time-pressure behavior.
- All core selection and feedback work offline and pin curriculum/content/engine versions per session.
- AI has no scheduling/mastery role.
- Learning screens keep one required action, speaker/hint/pause/home controls and local durability.

---

## Interfaces and data flow

- Produces `proposed:packages/learning-engine/src/mastery.ts:projectMastery(events: readonly AttemptEvent[], rules: CurriculumRules) -> MasteryProjection`.
- Produces `proposed:packages/learning-engine/src/nextActivity.ts:selectNextActivity(input: LessonContext) -> ActivityPlan`.
- Produces `proposed:packages/learning-engine/src/progress.ts:buildProgressWindows(input: ProgressInput) -> readonly ProgressWindow[]`.
- Produces `proposed:app/(child)/learn/ActivityRenderer.tsx:ActivityRenderer(props: { plan: ActivityPlan; onAttempt: (draft: AttemptDraft) => Promise<void> }) -> JSX.Element`.

Session snapshot → pure scheduler → typed activity → local durable attempt → feedback → pure mastery/review projection → next activity. Convex later recomputes from the same event/rule versions.

## Persistence, security and migration

Only append attempts and audited override/reset events. Projection schema changes increment `learningEngineVersion`; replay proves old events remain interpretable. No component can call Convex directly for core activity completion.

## Observability, deployment and rollback

Emit privacy-minimised reason codes (`new`, `weak`, `retention`, `override`) and projection-version mismatches. Preview deploy behind the authenticated sole-child route. Rollback restores prior engine bundle; session pinning prevents mixed versions mid-session.

## Documentation evidence

No new runtime dependency beyond SLC-002/003 pins. Educational rules are direct PRD requirements, tested as code rather than sourced from library documentation.

## Ordered implementation

1. Implement attempt evidence and mastery/relearning projections with property tests.
2. Implement deterministic scheduling, weak recovery, prerequisites and rotation.
3. Implement baseline and fortnightly progress windows.
4. Implement child home, session state and reusable activity/feedback shell.
5. Implement the complete core English activity journey and regression suite.

## Slice verification

Run `npm exec playwright test tests/e2e/learner/adaptive-english-journey.spec.ts` plus learning-engine tests. Expected: weak item changes method and resurfaces, delayed evidence controls mastery, restart preserves the attempt, and feedback never removes progress.
