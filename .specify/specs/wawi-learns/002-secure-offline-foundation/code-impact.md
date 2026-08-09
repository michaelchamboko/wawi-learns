# SLC-002 code impact

## Consumes

SLC-001 toolchain plus ADR-001, ADR-002 and ADR-007. Existing root manifests are modified surgically; no alternate framework is introduced.

## Creates

- `app/(parent)/onboarding/`, `app/(child)/`, auth/loading/offline boundaries.
- `packages/ui`, `packages/content-schema`, `packages/learning-engine`, `packages/local-data` package roots.
- `convex/schema.ts`, `convex/lib/requireParent.ts`, `convex/parents.ts`, `convex/childProfiles.ts`, `convex/installations.ts`, `convex/attempts.ts`.
- IndexedDB schema/migrations, service-worker shell policy and onboarding/offline tests.

## Regression paths

Auth expiry, ownership denial, second-child creation, skip/restart assessment, interrupted/corrupt pack, offline reopen, parent-route denial, local safety lockout, duplicate/out-of-order sync and app close before acknowledgement.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-002-001 | `npm run check` and `.github/workflows/ci.yml` |
| AC-SLC-002-002 | `tests/integration/convex/authorization.test.ts` |
| AC-SLC-002-003 | `tests/integration/local-data/pack-activation.test.ts`, `sync.test.ts` |
| AC-SLC-002-004 | `tests/e2e/onboarding/assessment.spec.ts` |
| AC-SLC-002-005 | `tests/e2e/onboarding/offline-first-run.spec.ts` |
