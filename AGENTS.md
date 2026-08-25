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

Resolve lower-source conflicts by the precedence above and record the decision in
the active task evidence. Stop only when sources at the same precedence conflict
or a missing choice would materially change the approved product. Do not silently
reduce the approved V1, invent requirements, or ask for routine implementation
decisions that the existing sources already answer.

The direct-`main` delivery rule in this file and `Build.md` is an explicit
product-owner instruction that supersedes older task-packet wording about pull
requests, slice branches, and preview-only final delivery. Preview and test
environments remain valid verification evidence; they do not replace the
reviewed direct-`main` commit or its hosted receipts.

## Project Identity

- GitHub: `https://github.com/michaelchamboko/wawi-learns.git`
- Repository visibility: keep `PUBLIC` while the complete V1 is being built so
  GitHub-hosted Actions remain available. Do not make it private before the full
  build and release gates pass.
- Production branch: `main`
- Vercel project: `wawi-learns`
- Vercel root: `.`
- Convex is the sole backend authority.
- Vercel serves the PWA and shared static assets, never private child state or
  private content overlays.

Do not create replacement GitHub, Vercel, database, authentication, storage, or
AI-provider projects when an approved project or task decision already exists.

## Ownership

Keep three accountabilities. They are roles for the active task, not a permanent
cast of personas:

- `@Javis` is release commander and integrator. `@Javis` selects the next task,
  defines its boundary, chooses one writer, resolves evidence-backed trade-offs,
  integrates the result, and makes the technical ship or rework decision.
- `@Builder` is the one implementation and commit owner for the active task.
  The role may be filled by the root agent or one coding subagent, but never by
  multiple concurrent writers.
- `@Reviewer` is the independent, read-only reviewer. The reviewer did not write
  the candidate and returns either evidence-bound `PASS` or one exact `BLOCK`.

Exactly zero or one task may be active, and exactly one agent may write to the
repository for that task. Read-only exploration may run in parallel when lanes
are narrow and non-overlapping. `@Javis` owns synthesis and integration; never
allow competing edits or overlapping implementation branches.

The human product owner is the sole human approval authority. Team review
results are technical evidence, not an additional human or external approval.

## Model Routing

Route by task shape and available capability. A preferred model being missing or
misrouted is never a build blocker:

- Keep release decisions, architecture, integration, ambiguous debugging, and
  final verification on the strongest available primary model.
- Prefer `gpt-5.3-codex-spark` for narrow, bounded implementation and problem
  resolution with automatic checks. If unavailable, use `gpt-5.6-luna`, then
  `gpt-5.4`, then the fastest available coding-capable model.
- Prefer `gpt-5.5` at high reasoning for independent review. If unavailable, use
  `gpt-5.6-sol` or the strongest available model that did not write the change.
- Prefer `gpt-5.6-terra` or `gpt-5.6-luna` for read-heavy repository mapping,
  log inspection, inventories, and test triage.

Give every subagent one bounded mission, exact allowed files, required output,
and stop condition. Do not delegate when coordination costs more than the work.
Never claim an effective model from the requested slug alone; cite runtime spawn
metadata when it is exposed, otherwise report only the requested routing and the
verification evidence.

## Local Code Style

Before writing code, inspect the target file, two or three neighboring examples,
and the nearest tests. Match their naming, module boundaries, imports, types,
control flow, error handling, component structure, test style, formatting, and
comment density. Reuse an existing abstraction before adding one. Do not add a
pattern, helper, dependency, or explanatory comment unless the surrounding code
demonstrates the same need. The diff and formatter must make each changed line
look native to its directory.

## Execution Loop

1. `@Javis` runs the orchestrator's `status` and `next` actions and reads the
   active packet plus its neighboring implementation and tests.
2. `@Javis` starts only the next eligible task and assigns exactly one
   `@Builder` with a bounded goal, allowed files, interfaces, red check, green
   boundary, verification, rollback, and stop condition.
3. The builder runs GitNexus impact analysis before changing a symbol, preserves
   the real failing check, and implements the smallest locally consistent fix.
4. The builder runs every declared check, stages only allowed files, records
   `git write-tree`, and hands the candidate plus evidence to `@Reviewer`.
5. The reviewer checks correctness, local style, task scope, regression risk,
   security and privacy implications, and evidence sufficiency. Add one specialist
   review only for authentication, private data, destructive migrations,
   security boundaries, irreversible production actions, or a cross-slice
   architectural change. Small, automatically verified tasks need no extra cast.
6. A reviewer returns `PASS` only with the candidate tree ID and a command result,
   receipt, or evidence path; otherwise it returns one exact `BLOCK`. If a
   preferred reviewer is unavailable or silent, reroute the same read-only review
   to the fallback model. Absence is never `PASS` and never requires the product
   owner to choose another agent.
7. Any `BLOCK` returns to the same builder. Repair only the defect, rerun affected
   checks, restage, and repeat the independent review on the new tree.
8. Record real evidence through the orchestrator, complete one scoped task, commit
   it, verify `HEAD^{tree}` equals the reviewed tree, and push directly to `main`.
   GitHub Actions and Vercel receipts must match the SHA before `DONE`. Revert a
   code-induced hosted failure; reroute or block an infrastructure failure without
   discarding a locally and independently verified change.
9. Reopen stale tasks and accept downstream invalidation. The current full-build
   instruction authorizes uninterrupted progression through verified slice
   boundaries; the product owner alone retains the final release decision.

## Escalation Discipline

After the same blocker fingerprint appears three times, apply the
`karpathy-guidelines` skill and then the `council` skill, select a distinct lawful
strategy, and continue. Ask the product owner only for a missing secret, external
authority, destructive production decision, or unresolved same-precedence product
conflict. Do not escalate routine code, test, model-routing, runner, or deployment
diagnosis that can be resolved from repository and hosted evidence.

The orchestration ledger is the only persisted task dashboard. Status reports
must remain in agent messages and contain only task, owner, state, evidence,
blocker, and next task.

## Validation

- Every task must declare where its checks run.
- Run targeted local checks during implementation and GitHub Actions, Vercel, and
  the approved Convex environment for hosted/runtime validation. The full-build
  instruction authorizes non-destructive installs from the lockfile, builds,
  typechecks, tests, and short-lived local servers required by the active task;
  record the commands and clean up temporary processes and artifacts.
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
- Keep the GitHub repository public until every V1 task and final release check is
  complete. Only then perform the planned privacy transition and reverify GitHub,
  Vercel, and production access; never use an early visibility change as a task
  prerequisite.
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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Wawi-Learns** (1199 symbols, 1594 relationships, 5 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Wawi-Learns/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Wawi-Learns/clusters` | All functional areas |
| `gitnexus://repo/Wawi-Learns/processes` | All execution flows |
| `gitnexus://repo/Wawi-Learns/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
