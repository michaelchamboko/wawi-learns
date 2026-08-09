# SLC-001 code impact

## Existing surface

No implementation files or symbols exist. The remote GitHub repository is empty; Vercel `wawi-learns` exists with root `.` and framework preset `Other` until the first Next.js source is present.

## Proposed changes

- Root toolchain manifests and a minimal temporary Next.js/PWA probe.
- `tests/e2e/spikes/platform-baseline.spec.ts` and focused integration probes.
- Seven decision records under `docs/decisions/`.
- GitHub/Vercel/Convex environment binding performed by authenticated humans or configured CLIs; secrets remain outside Git.

## Regression paths

- Next.js production build under Node 24.x.
- Install → offline launch → update → rollback.
- Local append → repeated/out-of-order upload → Convex canonical projection.
- Permission denied, provider timeout and no-audio-retention paths.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-001-001 | `tests/e2e/spikes/platform-baseline.spec.ts` |
| AC-SLC-001-002 | `tests/e2e/spikes/pwa-update.spec.ts` |
| AC-SLC-001-003 | `tests/integration/spikes/sync-contract.test.ts` |
| AC-SLC-001-004 | `tests/integration/spikes/decision-records.test.ts` |
| AC-SLC-001-005 | `tests/integration/spikes/adoption-review.test.ts` |
