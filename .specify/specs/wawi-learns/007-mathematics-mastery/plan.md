# Mathematics Mastery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete Reception/Year 1 mathematics through the existing deterministic, offline, evidence-led learner platform.

**Architecture:** Versioned maths templates from SLC-003 generate seeded typed activities. A pure maths planner maps skills and misconceptions to worked examples and CPA representations; results enter the existing immutable event/mastery pipeline in maths-specific dimensions.

**Tech Stack:** Existing TypeScript learning engine and React activity shell, fast-check generators, Vitest and Playwright.

## Global Constraints

- Cover every listed Reception and Year 1 strand; remain inside that scope.
- New concepts start concrete/pictorial before symbolic, with spoken worked example.
- Accuracy/understanding outrank speed; response latency may add support but never negative feedback.
- Mastery requires varied representations and delayed recall.
- Maths shares profile, scheduler, offline/event/reward/reporting infrastructure; no duplicate engine.
- Generated questions use validated templates and exact answer logic only.

---

## Interfaces and data flow

- Produces `proposed:packages/learning-engine/src/maths.ts:buildMathsActivity(input: MathsLessonContext) -> MathsActivityPlan`.
- Produces `proposed:packages/learning-engine/src/maths.ts:classifyMathsAttempt(input: MathsAttempt, template: MathsTemplate) -> MathsEvidence`.
- Consumes `MathsTemplate`, `MisconceptionTag`, `ActivityRenderer`, `AttemptEvent` and `projectMastery`.

Pinned skill/template → deterministic seed → worked example/practice ActivityPlan → durable attempt → misconception classification → maths mastery/review schedule → parent summary data.

## Persistence, security and migration

Maths adds typed skill/evidence fields without rewriting prior events. Seeds/template versions make every item reproducible. No external provider or child data export is needed.

## Observability, deployment and rollback

Record strand/skill/template/representation/misconception/result/version. Preview deploy and enable after content pack compatibility passes. Rollback removes the new activity registrations and restores the prior engine version between sessions.

## Documentation evidence

DfE mathematics sources R4/R5 and the validated SLC-003 templates are authority. No new runtime dependency.

## Ordered implementation

1. Add maths plan/evidence/misconception contracts and mastery integration.
2. Deliver and test all Reception journeys.
3. Deliver and test all Year 1 journeys.
4. Prove CPA, adaptive misconception, delayed mastery, reporting and offline behavior end to end.

## Slice verification

Run `npm exec playwright test tests/e2e/maths/representations-and-retention.spec.ts` plus property tests. Expected: every strand is reachable, no invalid generated answer occurs, and mastery requires representation diversity and delayed evidence.
