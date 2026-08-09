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

The direct-`main` delivery rule in this file and `Build.md` is an explicit
product-owner instruction that supersedes older task-packet wording about pull
requests, slice branches, and preview-only final delivery. Preview and test
environments remain valid verification evidence; they do not replace the
reviewed direct-`main` commit or its hosted receipts.

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

- `@Javis` is CTO/CEO and release commander. `@Javis` clarifies outcomes,
  creates bounded task packets, selects one implementation owner, resolves
  trade-offs, enforces evidence gates, and makes technical ship/no-ship
  decisions. `@Javis` does not perform routine implementation or self-approve a
  change.
- `@Jimmy` is the platform implementation engineer for backend, integration,
  tooling, runtime repair, builds, and clearly scoped engineering tasks.
- `@Bumble` is the product and UI implementation engineer for focused
  frontend/UI tasks and user-flow polish with explicit acceptance criteria.
- `@Cody` is the fast bounded feature implementer for small, self-contained
  changes with explicit files, acceptance checks, and rollback boundaries.
- `@Einstein` is the architecture, diagnosis, and failure-mode reviewer.
  `@Einstein` challenges the mechanism and load-bearing assumptions before code
  starts and diagnoses failures without owning the implementation.
- `@Fizz` owns quality strategy and independent verification, including test
  strategy, release-risk analysis, cross-cutting trade-offs, and adversarial
  review. `@Fizz` never implements the change being verified.
- `@Honey` is the robustness and large-context reviewer for complex diffs,
  whole-application consistency, edge cases, and evidence sufficiency. `@Honey`
  never implements the same task or holds final release authority.

Exactly zero or one task may be active, and exactly one agent may write to the
repository for that task. `@Javis` selects exactly one of `@Jimmy`, `@Bumble`,
or `@Cody` as that writer. All other agents remain read-only for the task. Never
allow competing edits or overlapping implementation branches.

The human product owner is the sole human approval authority. Team review
results are technical evidence, not an additional human or external approval.

## Execution Loop

1. `@Javis` reads the active task packet and runs the orchestrator's `status` and
   `next` actions.
2. `@Einstein` challenges the proposed mechanism, assumptions, interfaces, and
   failure modes before implementation starts.
3. `@Javis` starts only the next eligible task and selects exactly one of
   `@Jimmy`, `@Bumble`, or `@Cody` as implementation and commit owner.
4. The owner states the task goal, allowed and forbidden scope, owned
   interfaces, measurable success criteria, validation location, and rollback;
   then follows the packet's test-first sequence and implements the smallest
   solution.
5. After the smallest task passes its declared checks, stage only the allowed
   files and record `git write-tree` as the candidate tree ID. Run the read-only
   round robin in this order: `@Einstein`, `@Jimmy`, `@Bumble`, `@Cody`,
   `@Fizz`, `@Honey`, then `@Javis`. The implementation owner uses their turn
   for self-review and evidence handoff; every other turn is independent.
6. Each required review role returns `PASS` only when it cites the candidate tree
   ID and at least one command result, hosted receipt, or evidence path; otherwise
   it returns `BLOCK` with one exact defect. A review has a ten-minute response
   window with one reminder at five minutes. Silence is `BLOCK`, never `PASS`.
   `@Javis` may record an available same-remit substitute; without one, the task
   remains blocked.
7. Any `BLOCK` returns the task to the same implementation owner. After repair,
   restage the candidate, record its new tree ID, rerun affected checks, and run
   the complete round robin. Do not start the next task until every required
   review role returns `PASS` and `@Javis` records the technical gate.
8. Record real evidence through the orchestrator. Complete and commit one scoped
   task only when every declared check is fresh and passing, then verify that
   `HEAD^{tree}` equals the reviewed candidate tree ID.
9. The product owner's recorded direct-main authorization permits the owner to
   push that reviewed commit to `main`; no pull request or branch-protection gate
   applies. GitHub Actions and Vercel receipts must match the pushed SHA before
   the task is `DONE`. A hosted failure requires `git revert <task-sha>` on
   `main` and `action=block` before another task starts.
10. Reopen stale tasks and accept the resulting downstream invalidation. The
    human product owner alone approves slice and final release decisions.

## Escalation Discipline

Before escalating an unresolved multi-step issue, every agent applies the
`karpathy-guidelines` skill and then the `council` skill. The escalation names
the evidence, the Council Chair recommendation, and the proposed owner; `@Javis`
selects the owner and next action.

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

- The product owner has explicitly authorized direct task-scoped commits and
  pushes to `main`. Treat every push as a Vercel production-candidate deployment:
  complete the execution-loop candidate, check, and review gates before pushing;
  then match GitHub Actions and Vercel receipts to the pushed SHA before `DONE`.
- Every commit must have valid repository `user.name` and `user.email` author
  metadata. Add matching `Co-authored-by` then `Signed-off-by` trailers for that
  same configured identity. These are attribution only; they do not create an
  additional approval authority. If either value is missing, use values supplied
  by the product owner and never infer them.
- Never force-push, hard-reset `main`, bypass the direct-main review gate, commit
  secrets, or apply destructive production changes without the product owner's
  explicit approval.
- Do not label a preview `LIVE`.
- Release only the exact tested `main` SHA through the existing Vercel project
  and compatible Convex production deployment.
- Final completion requires full regression, cross-slice E2E, production smoke,
  private-data leak checks, rollback proof, `@Javis` technical release clearance,
  and the sole product owner's approval.

## Repository Cleanliness

Only add files required by the active implementation task, its tests, runtime
configuration, migration, deployment, rollback, or orchestration evidence.

Do not add GlobalSetup source, `.agents/`, `build-pack/`, generic templates,
duplicate PRDs, state files, findings files, task dashboards, handover documents,
research logs, generated reports, local caches, or backup files. Remove temporary
artifacts after verification. Never edit or commit `.env` files or secrets.
