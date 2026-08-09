# Wawi Learns Agent Contract

## Mission

Build and release the complete approved Wawi Learns Version 1. A partial build,
preview deployment, scaffold, or passing command is not the finished product.

This contract adapts GlobalSetup for this repository. The existing spec-kit
workspace is the approved build pack and task manager; do not create a second
planning or governance system.

## Source of Truth

Use this precedence order:

1. This file.
2. `Wawi Learns PRD.md`.
3. `Build.md` for the end-to-end execution protocol.
4. `.specify/specs/wawi-learns/000-spec-of-specs/requirements.md`.
5. `.specify/specs/wawi-learns/000-spec-of-specs/decisions.md`.
6. `.specify/specs/wawi-learns/000-spec-of-specs/roadmap.md`.
7. The active slice's `spec.md`, `plan.md`, `tasks.md`, and `code-impact.md`.
8. `.specify/specs/wawi-learns/000-spec-of-specs/orchestration.yml` for task
   state.

If these sources conflict, stop the active task and ask the human product owner.
Do not silently reduce the approved V1 or invent missing requirements.

## Project Identity

- GitHub: `https://github.com/michaelchamboko/wawi-learns.git`
- Production branch: `main`
- Vercel project: `wawi-learns`
- Vercel root: `.`
- Convex is the sole backend authority.
- Vercel serves the PWA and shared static assets, never private child state or
  private content overlays.

Do not create replacement GitHub, Vercel, database, authentication, storage, or
AI-provider projects when an approved project or task decision already exists.

## Ownership

- `@Javis` is CTO and orchestrator. Javis assigns work, enforces gates, and does
  not write implementation code.
- `@Cody` is the default implementation and commit owner.
- `@Einstein` investigates architecture, runtime configuration, and failures
  before fixes are attempted.
- `@Jimmy` validates product intent and full-stack integration. Jimmy may write
  only when assigned exclusive ownership of an isolated task.
- `@Honey` independently verifies tests, CI/CD, reliability, and release proof.
- `@Bumble` supplies task-required primary-source research and licensing
  evidence without creating general research files.
- `@Fizz` performs task-authorized disposable spikes. Fizz may write only when
  assigned exclusive ownership of an isolated task.

Exactly zero or one task may be active, and exactly one agent may write to the
repository for that task. Read-only investigation and review may run in
parallel. Never allow competing edits or overlapping implementation branches.

## Execution Loop

1. Read the active task packet and run the orchestrator's `status` and `next`
   actions.
2. Start only the next eligible task with one named owner.
3. State the task's goal, allowed and forbidden scope, owned interfaces,
   measurable success criteria, failure modes, validation location, and rollback
   before editing.
4. Apply the simplest solution that satisfies the task. Do not add speculative
   abstractions, generic frameworks, future hooks, unrelated refactors, or dead
   configuration.
5. Follow the packet's test-first sequence and run every declared targeted
   check in its intended location.
6. Have Honey and the task-relevant specialist independently review the diff and
   evidence.
7. Record real evidence through the orchestrator. Complete the task only when
   every required check is fresh and passing.
8. Block on a real failure. Use Einstein for root-cause analysis, then return the
   repair to the active implementation owner. Reopen stale tasks and accept the
   resulting downstream invalidation.
9. Commit one scoped task with its evidence. Proceed sequentially until the slice
   exit journey passes and the human product owner approves the slice.

The orchestration ledger is the only persisted task dashboard. Status reports
must remain in agent messages and contain only task, owner, state, evidence,
blocker, and next task.

## Validation

- Every task must declare where its checks run.
- Prefer targeted checks during implementation and GitHub Actions, Vercel, and
  the approved Convex environment for hosted/runtime validation.
- Do not run local dependency installs, production builds, development servers,
  or full-project typechecks unless the human explicitly opts into local preview
  and the active task records the commands and cleanup plan.
- Test behavior rather than implementation details. Prefer real implementations
  and mock only external system boundaries.
- Never suppress, weaken, repeatedly retry, or relabel a failing check.
- An orchestrator state transition is bookkeeping, not proof; reviewers must
  inspect the underlying evidence.

## Git and Release

- Work on short-lived task or slice branches after the initial empty-repository
  bootstrap. Never direct-push a protected `main` branch.
- Every commit must use the repository's configured `user.name` and `user.email`
  for matching `Co-authored-by` and `Signed-off-by` trailers, in that order. Stop
  if the email is missing. Verify trailers with `git log -1` before pushing.
- Never force-push, hard-reset a protected branch, bypass required checks, commit
  secrets, or apply destructive production changes without explicit approval.
- Do not label a preview `LIVE`.
- Release only the exact tested `main` SHA through the existing Vercel project
  and compatible Convex production deployment.
- Final completion requires full regression, cross-slice E2E, production smoke,
  private-data leak checks, rollback proof, and explicit human approval.

## Repository Cleanliness

Only add files required by the active implementation task, its tests, runtime
configuration, migration, deployment, rollback, or orchestration evidence.

Do not add GlobalSetup source, `.agents/`, `build-pack/`, generic templates,
duplicate PRDs, state files, findings files, task dashboards, handover documents,
research logs, generated reports, local caches, or backup files. Remove temporary
artifacts after verification. Never edit or commit `.env` files or secrets.
