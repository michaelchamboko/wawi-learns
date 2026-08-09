# SLC-008 code impact

## Consumes

All learner evidence/projections, generated-content/overlay controls and Convex parent authority from prior slices.

## Creates/modifies

- Reward projection plus child adventure UI.
- Protected parent dashboard, diagnostics, controls, custom-pack and data-rights routes.
- Convex reward/world/override/export/deletion functions and indexes.
- Parent/reward/data-rights unit, integration and E2E tests.

## Regression paths

Incorrect answer, duplicate reward, missed-day streak, reduced motion, insufficient evidence, stable mastery, weak explanation, override/reset audit, custom-pack edit, consent withdrawal, offline current install, profile/account deletion, stale upload and stale installation eviction.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-008-001 | `tests/unit/learning-engine/rewards.test.ts`, `tests/e2e/rewards/adventure.spec.ts` |
| AC-SLC-008-002 | `tests/e2e/parent/dashboard-evidence.spec.ts` |
| AC-SLC-008-003 | `tests/integration/convex/overrides.test.ts` |
| AC-SLC-008-004 | `tests/e2e/parent/custom-pack.spec.ts` |
| AC-SLC-008-005 | `tests/e2e/parent/data-rights.spec.ts` |
