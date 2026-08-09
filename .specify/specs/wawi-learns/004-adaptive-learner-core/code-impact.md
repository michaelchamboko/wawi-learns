# SLC-004 code impact

## Consumes

Immutable attempts/local stores from SLC-002 and versioned curriculum/content contracts from SLC-003.

## Creates/modifies

- `packages/learning-engine/src/{evidence,mastery,scheduler,weak-recovery,progress,overrides}.ts`.
- `app/(child)/home/`, `app/(child)/learn/` and focused activity components in `packages/ui`.
- Pure engine unit/property tests and child journey E2E.
- Convex canonical projection functions using the same engine package; no duplicate server rules.

## Regression paths

Hints/lucky tapping, dimension isolation, four modalities/six correct/three days/72-hour recall, regression, reset audit, high weak backlog, prerequisite override, long session rotation, abrupt close and no reward loss.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-004-001 | `tests/unit/learning-engine/mastery.test.ts`, `mastery.property.test.ts` |
| AC-SLC-004-002 | `tests/unit/learning-engine/scheduler.test.ts` |
| AC-SLC-004-003 | `tests/unit/learning-engine/progress-windows.test.ts` |
| AC-SLC-004-004 | `tests/e2e/learner/child-shell.spec.ts` |
| AC-SLC-004-005 | `tests/e2e/learner/adaptive-english-journey.spec.ts` |
