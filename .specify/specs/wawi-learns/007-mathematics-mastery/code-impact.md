# SLC-007 code impact

## Consumes

Maths content/templates from SLC-003, engine/activity/offline contracts from SLC-002/004 and audio from SLC-005.

## Creates/modifies

- `packages/learning-engine/src/maths.ts` and maths rule fixtures.
- Maths activity renderers for counters, ten frames, lines, arrays, part-whole, shapes, clocks, coins, word problems and tracing.
- Maths unit/property/content/E2E tests.
- Parent dashboard projection data only; dashboard UI remains SLC-008.

## Regression paths

All strands, number-range boundaries, seed reproducibility, exact answer, misconception adaptation, worked examples, no speed penalty, delayed/varied mastery, offline restart and English-dimension isolation.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-007-001 | `tests/unit/learning-engine/maths.test.ts` |
| AC-SLC-007-002 | `tests/e2e/maths/reception.spec.ts` |
| AC-SLC-007-003 | `tests/e2e/maths/year-one.spec.ts` |
| AC-SLC-007-004 | `tests/e2e/maths/representations-and-retention.spec.ts` |
