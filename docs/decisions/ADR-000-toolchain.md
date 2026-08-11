# ADR-000 — Repository toolchain and delivery baseline

- **Status:** accepted
- **Owner slice:** SLC-001-T001
- **Requirements:** PRD-FR-023, PRD-FR-030, PRD-NFR-004
- **Supersedes:** none

## Decision

Wawi Learns uses the existing `michaelchamboko/wawi-learns` GitHub repository,
the existing Vercel project `wawi-learns` rooted at `.`, and an npm-managed
Next.js 16.3.0 / React 19.2.8 / TypeScript 6.0.3 workspace on Node 24.x.

The platform contract is deliberately small:

1. `npm ci` installs the lockfile-defined dependency graph; no alternate package
   manager is supported.
2. `npm run lint`, `npm run typecheck`, `npm run build`, and
   `npm run test:e2e -- tests/e2e/spikes/platform-baseline.spec.ts` form the
   baseline CI check.
3. The public shell exposes only an application version, a build SHA, and the
   fixed Vercel project identity. All values are public metadata; credentials
   and private learner state are never exposed by this contract.
4. GitHub Actions runs the same baseline on pull requests and `main`, retaining
   build and Playwright artifacts for failure diagnosis.

TypeScript 6.0.3 is the highest compatible compiler for the pinned Next 16.3.0
lint stack: its `typescript-eslint` dependency currently declares support below
6.1.0 and fails closed under TypeScript 7. This preserves strict type checking
and linting instead of weakening either gate.

## Consequences

- The task does not create or replace GitHub, Vercel, Convex, or AI-provider
  projects.
- A missing/incorrect Vercel identity, Node/dependency pin drift, or a failed
  baseline check blocks the task and requires fresh evidence.
- Rollback is a direct revert of the reviewed task commit on `main`; local
  `.vercel` linkage remains uncommitted and can be removed without affecting the
  remote project.

## Rejected alternatives

- An alternate package manager — rejected because `npm ci` must reproduce the
  checked-in lockfile in CI.
- Runtime-only version metadata — rejected because the baseline must be
  observable in the deployed document before private application features exist.
