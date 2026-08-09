# SLC-006 code impact

## Consumes

Reading content from SLC-003, engine objectives from SLC-004, audio from SLC-005, auth/local stores from SLC-002 and ADR-005.

## Creates/modifies

- Reader/comprehension/retelling UI and evidence adapters.
- Generated-content/approval/AI-usage Convex schema and functions/actions.
- `packages/validation/src/generatedContent.ts` and private overlay storage.
- Protected parent approval routes and AI safety/cost/e2e tests.

## Regression paths

Unknown word support, comprehension gap, malformed JSON, US spelling, unsafe topic, prompt injection, incorrect answer, edit after validation/approval, wrong child/revision, public static leak, provider timeout/cap, consent withdrawal and safety withdrawal.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-006-001 | `tests/e2e/reading/curated-reader.spec.ts` |
| AC-SLC-006-002 | `tests/unit/validation/generated-revision.test.ts`, state-machine integration test |
| AC-SLC-006-003 | `tests/integration/ai/constrained-actions.test.ts` |
| AC-SLC-006-004 | `tests/e2e/stories/approved-overlay.spec.ts` |
| AC-SLC-006-005 | `tests/security/ai-red-team.test.ts`, `tests/e2e/stories/provider-outage.spec.ts` |
