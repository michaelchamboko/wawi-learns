# SLC-010 code impact

## Consumes

All source, tests, content and evidence from SLC-001…009. No product-domain interface changes are allowed; any such need reopens the owning slice.

## Creates/modifies

- Release evidence builder/verifier and `release:verify` script.
- GitHub protection/CI release workflow, Vercel/Convex environment-aware deployment commands.
- Version/provenance exposure and production smoke/rollback tests.
- Named human approval records and final release receipt.

## Regression paths

Missing/stale AC evidence, wrong SHA/project/root/framework, preview mistaken for production, Convex/Vercel version mismatch, private static leak, secret leak, content threshold failure, production smoke error and rollback with pending offline events.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-010-001 | `npm run release:evidence` |
| AC-SLC-010-002 | signed review records validated by `release:verify` |
| AC-SLC-010-003 | `tests/integration/release/platform-binding.test.ts` |
| AC-SLC-010-004 | `tests/e2e/release/production-smoke.spec.ts` |
| AC-SLC-010-005 | `tests/e2e/release/rollback.spec.ts` and FINAL ledger approval |
