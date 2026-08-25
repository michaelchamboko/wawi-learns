# Wawi Learns Version 1 Implementation Plan

> **For @Javis and agentic workers:** run one `orchestration.yml` task at a
> time. Assign one `@Builder`, keep every other lane read-only, and require one
> independent `@Reviewer` per release cohort before integration.

**Goal:** Build, verify, deploy, and release the complete approved Wawi Learns
Version 1 for Malachi.

**Architecture:** The child experience is a local-first Next.js PWA. IndexedDB
holds authorised offline learning state and append-only attempt events; Convex is
the only backend authority for identity, parent operations, reconciliation, and
private overlays. Vercel serves the application and shared static core assets.

**Tech stack:** npm workspaces; candidate pins Node 24.x, Next.js 16.3.0, React
19.2.8, TypeScript 6.0.3, Convex 1.43.0, Serwist 9.5.12, idb 8.0.3, Zod 4.4.3,
Vitest 4.1.10, Playwright 1.62.1, and fast-check 4.9.0. SLC-001 must prove these
pins before they become release authority.

## Global Constraints

- `AGENTS.md` applies to every task.
- The repository setup contract is adapted from `michaelchamboko/globalsetup`
  commit `790a6a7db9467fe482fe37fc8e4e7a29b9291446`; keep its source and generic
  scaffolds outside this repository.
- Preserve the complete approved V1 and every PRD exclusion.
- Use `.specify/specs/wawi-learns/000-spec-of-specs/orchestration.yml` as the
  only task-state authority.
- Execute the frozen 54-task sequence across eleven slices. Exactly zero or one task
  may be active, and Sol manages one `ACTIVE` plus up to two `READY` packets.
- @Javis selects one `@Builder` per task and one independent `@Reviewer` for the
  staged cohort. Every other agent remains read-only for that task.
- PRD-NFR-009 / AC-37 are active: task-level automation does not block Spark,
  evidence-backed repairs are queued, and `gpt-5.5` review is applied once per
  release cohort.
- Add only files allowed by the active task packet.
- Run non-destructive local installs from the lockfile, builds, typechecks,
  targeted tests, and short-lived runtime checks when the active packet needs
  them. Hosted GitHub Actions, Vercel, and Convex receipts remain required where
  declared.
- Use the existing GitHub repository, Vercel project `wawi-learns`, and Convex
  architecture. Do not create substitute projects.
- Keep the repository public until all 54 tasks and the final release gate are
  complete. Use GitHub-hosted runners; self-hosted runners are an optional
  contingency only after a live runner proves its labels and availability.
- The product owner is the sole human final-release approval authority. The
  current full-build instruction is standing authorization to continue through
  independently verified slice boundaries without interruption. No co-author,
  sign-off, second human, external reviewer, or outside organisation is required
  to approve the work. Agent `PASS`/`BLOCK` results are technical evidence, not
  additional human approval authority.
- The product owner has explicitly authorized direct task-scoped commits and
  pushes to `main`. There is no pull-request or protected-main gate; therefore a
  push is a Vercel production-candidate deployment and must satisfy Section 5
  before it is made.
- A scaffold, preview, green command, or proposed review is not `LIVE`.

---

## 1. Authority and File Boundaries

Read these sources in order before assigning work:

1. `AGENTS.md`
2. `Wawi Learns PRD.md`
3. `.specify/specs/wawi-learns/000-spec-of-specs/requirements.md`
4. `.specify/specs/wawi-learns/000-spec-of-specs/decisions.md`
5. `.specify/specs/wawi-learns/000-spec-of-specs/roadmap.md`
6. The active slice's `spec.md`, `plan.md`, `tasks.md`, and `code-impact.md`
7. `.specify/specs/wawi-learns/000-spec-of-specs/orchestration.yml`

The active `tasks.md` supplies the exact requirements, acceptance IDs, allowed
and forbidden files, ordered test-first steps, failure behaviour, migration,
deployment, rollback, and recovery trigger. The corresponding `code-impact.md`
supplies exact target files and interface ownership. Do not duplicate those
details in another plan.

The direct-`main` delivery policy in Sections 5 and 6 supersedes any older task
packet wording about pull requests, slice branches, or preview-only delivery.
A task may use an isolated preview or test environment as verification evidence,
but its reviewed final delivery remains the exact direct-`main` commit and the
matching hosted receipts.

The only persistent project-management outputs are:

- implementation, test, configuration, migration, and deployment files required
  by the active task;
- the existing `.specify` plans;
- task evidence under `000-spec-of-specs/orchestration-evidence/`;
- Git commits, CI receipts, deployment receipts, and sole
  product-owner approval records.

**Completion criterion:** every agent can identify one authoritative task packet
and no second planning, task, status, or handover system exists.

## 2. Pre-Execution Git Bootstrap

These steps apply only while the repository has no commits. Once the bootstrap
commit exists, verify it and continue to Section 3; do not recreate, amend, or
rewrite it merely to add or remove approval trailers. The ledger remains
`NOT_STARTED` until the orchestrator starts the first task. Git author metadata
and required trailers are attribution only; they do not add an approval,
co-authorship decision, or sign-off authority.

- [ ] Run `git rev-parse --verify HEAD`. If it succeeds, verify `HEAD` equals
  `origin/main`, confirm the baseline files and remote below, then skip the
  remaining commit-creation steps.
- [ ] Run `git config user.name` and `git config user.email`.
- [ ] If either value is empty, configure repository-local values supplied by
  the product owner. Do not infer either value from GitHub or another repository.
- [ ] Confirm the PRD SHA-256 is
  `E2ECED5839B60FBD7047C8605FD03483464DC719F993353EA5846C17ACF62257`.
- [ ] Confirm `git remote get-url origin` returns the canonical repository.
- [ ] Confirm the only root entries are `.git/`, `.gitignore`, `.specify/`,
  `AGENTS.md`, `Build.md`, and `Wawi Learns PRD.md`.
- [ ] Stage exactly `.gitignore`, `.specify`, `AGENTS.md`, `Build.md`, and
  `Wawi Learns PRD.md`.
- [ ] Run `git diff --cached --check`; require exit `0`.
- [ ] Create the sole pre-ledger bootstrap commit with configured Git author
  metadata and matching attribution trailers:

```powershell
$humanName = git config user.name
$humanEmail = git config user.email
git commit -m "chore(repo): initialize Wawi Learns plans" `
  --trailer "Co-authored-by: $humanName <$humanEmail>" `
  --trailer "Signed-off-by: $humanName <$humanEmail>"
```

- [ ] Verify the commit subject, author, and trailers with `git log -1`.
- [ ] Push the initial `main` because the remote is empty, establish `main` as
  the default branch, and record the direct-main policy. Do not enable
  pull-request-only protection or a nonexistent CI check; SLC-001-T001 adds the
  real checks.

**Completion criterion:** GitHub contains one clean bootstrap commit with the
preserved PRD and plans, the direct-main policy is recorded, and no implementation
has started.

## 3. Orchestrator Contract

Use the PRD extension from `michaelchamboko/spec-kit` commit
`8e258e390535cc88e0738bdd912893f3a7c7826d`. Use a registered slash command or
an external checkout; never copy spec-kit into this repository.

From the repository root:

```text
/speckit.prd.orchestrate slug=wawi-learns action=status
/speckit.prd.orchestrate slug=wawi-learns action=next
```

On an empty ledger, `next` must return `SLC-001-T001`. After a task completes,
`next` must return the first dependency-valid successor from the live execution
priority. A stale hard-coded task expectation is not a blocker; the validated
ledger and current dependency state decide the successor.

State-changing forms:

```text
/speckit.prd.orchestrate slug=wawi-learns action=start task=<next-task> owner=@Builder
/speckit.prd.orchestrate slug=wawi-learns action=evidence task=<next-task> check=<check-id> result=pass path=<repository-evidence-path>
/speckit.prd.orchestrate slug=wawi-learns action=complete task=<next-task>
/speckit.prd.orchestrate slug=wawi-learns action=block task=<next-task> reason="<decisive blocker>"
/speckit.prd.orchestrate slug=wawi-learns action=reopen task=<task-id> reason="<accepted evidence became stale>"
```

Use the real check IDs returned by `action=next`; the evidence command above
shows syntax only. Evidence paths must exist inside the repository. Never edit
ledger state or evidence markers by hand. An approval call records only the
product owner's decision using the product-owner identifier they supplied as
`approved_by`; never record an agent, reviewer, or outside party as the approver.

Run this non-rewriting validation after every state transition:

```text
/speckit.prd.validate slug=wawi-learns phase=orchestration
```

Do not create a duplicate normalised PRD to satisfy `phase=all`. The root PRD is
the preserved source; orchestration validation plus the recorded SHA-256 is the
approved gate.

**Completion criterion:** status, next, evidence, complete, block, reopen, and
approval actions remain ledger-driven, atomic, and traceable.

## 4. Team Assignment Contract

| Agent | Role | Owns | Must not do |
|---|---|---|---|
| @Javis | Release commander and integrator | Select the next task, bound scope, route work, integrate evidence, and make technical ship or rework decisions. | Competing edits, self-approving a candidate, or inventing product scope. |
| @Builder | Active implementation and commit owner | Inspect local patterns, implement the smallest task solution, run checks, stage the candidate, and repair exact defects. | Writing outside the active packet or sharing write ownership. |
| @Reviewer | Independent read-only reviewer | Check correctness, surrounding-code style, task scope, regression risk, privacy/security, and evidence. | Editing the candidate or approving without tree-bound evidence. |

Use this routing ladder without making a preferred model a dependency:

| Work | Preferred route | Fallback |
|---|---|---|
| Release, architecture, integration, ambiguous debugging | Strongest available primary model | Current root model |
| Narrow implementation and fast problem resolution | `gpt-5.3-codex-spark` | `gpt-5.6-luna`, then `gpt-5.4`, then fastest available coding model |
| Independent review | `gpt-5.5` with high reasoning | `gpt-5.6-sol` or strongest independent available model |
| Repository mapping, logs, inventories, test triage | `gpt-5.6-terra` or `gpt-5.6-luna` | Any read-only context-efficient model |

The requested model is a routing intention, not evidence of the effective model.
Record runtime spawn metadata when available; otherwise record the request and
judge the work only by its command, diff, tree, and hosted evidence. A missing
model, timed-out subagent, or unavailable persona is rerouted automatically and
never escalated to the product owner.

Every assignment message must contain:

```text
TASK: exact SLC-NNN-TMMM and title
OWNER: exactly one @Builder
GOAL: active packet outcome
SCOPE: exact allowed and forbidden files
INTERFACES: exact owned and consumed contracts
RED: failing test or check and expected failure
GREEN: minimum implementation boundary
VERIFY: every required check and its location
REVIEW: one independent @Reviewer plus any risk-triggered specialist lens
ROUTING: preferred model, fallback ladder, and stop condition
CANDIDATE: staged tree ID plus artifact paths for every PASS
DIRECT_MAIN: pre-push gate and post-push receipt/rollback conditions
ROLLBACK: packet rollback action
STOP: blocker and reopen conditions
```

**Completion criterion:** one named writer owns one bounded task; every agent
has a defined evidence target; routing failure cannot block the task; no agent
invents scope or interfaces.

## 5. Per-Task Delivery Loop

For each smallest task returned by `action=next`:

- [ ] @Javis checks dependencies, confirms the source hierarchy resolves the
  outcome, and selects exactly one @Builder.
- [ ] Before code changes, the builder inspects the target file, two or three
  neighboring examples, and the nearest tests. Record the naming, imports,
  types, control flow, error handling, component structure, test style,
  formatting, and comment density that the patch must follow.
- [ ] Run GitNexus impact analysis for every changed symbol. Warn before any
  HIGH or CRITICAL blast radius and add the corresponding specialist review.
- [ ] The builder retains the packet's real failing test or decisive failing
  check, implements the smallest allowed change, and runs every declared unit,
  integration, regression, E2E, migration, deployment, and rollback check in
  its declared environment.
- [ ] The builder stages only allowed files, records `git write-tree`, and records
  packet-level evidence for the active release cohort.
- [ ] For cohort-mode execution, there is no per-packet manual model review; packet-level
  evidence remains automated and non-blocking. The reviewer checks behavior,
  surrounding-code consistency, task scope, regression risk, privacy/security,
  rollback, and evidence only at cohort close.
- [ ] Task-level evidence and repair packets are automated; they must not pause
  Spark while a dependency-valid `READY` packet exists.
- [ ] A cohort review returns `PASS` only with the final candidate tree ID plus an
  exact command result, hosted receipt, or evidence path; otherwise it returns one
  exact `BLOCK`. If the preferred reviewer or model is unavailable, reroute the
  same read-only review to the next model in Section 4. Silence is not `PASS`.
- [ ] For cohort-mode execution, `gpt-5.5` review and host/deploy checks are
  executed only after all code in the release cohort is complete.
- [ ] Any `BLOCK` returns to the same builder. Repair only the cited defect,
  restage, record the new tree, rerun affected checks, and repeat independent
  review. Do not start another task while a real defect remains.
- [ ] Run GitNexus `detect_changes` against `main`, review the diff for secrets,
  generated clutter, unrelated changes, dead configuration, and forbidden files,
  then commit packet-level implementation and evidence with configured author
  metadata and matching attribution trailers. Verify each packet `HEAD^{tree}` for
  local reviewability; defer ledger-close and integration review to cohort close.
- [ ] Push the reviewed release-cohort commit directly to `main`. GitHub Actions
  and Vercel receipts must identify that exact SHA before `DONE`. On a code-induced
  hosted failure, revert the exact hosted-breaking commit and run
  `action=block`. On runner, quota, or provider infrastructure failure, preserve
  the verified candidate work, reroute to the approved hosted fallback, and record
  the infrastructure evidence without weakening the check.
- [ ] Report exactly:

```text
TASK | OWNER | STATE | DECISIVE EVIDENCE | COMMIT/RECEIPTS | BLOCKER | NEXT
```

If a task fails, run `action=block`; @Javis diagnoses and the same builder
repairs at the priority determined by packet impact and queue ordering. Queue the
exact repair packet and continue unrelated dependency-valid READY packets in the
same cycle; stop only when the defect invalidates every available READY packet.
After the same blocker fingerprint repeats three times, apply Karpathy and Council,
select a distinct lawful strategy, and continue without asking the product owner
to choose routine tooling. If an accepted interface, dependency, ADR, test, or
environment becomes stale, run `action=reopen` and invalidate every downstream
result. Never advance on red.

**Completion criterion:** the task/cycle is `DONE`, all declared evidence is fresh
and passing, the independent review has returned artifact-bound `PASS` at cohort
close, the reviewed cohort commit is pushed to `main`, hosted receipts match its
SHA, and `action=next` returns the next dependency-valid successor.

## 6. Slice Delivery Sequence

Use direct task-scoped commits on `main`; no pull request, branch-protection, or
slice branch is used. Preserve each task commit; do not squash away task
traceability.

| Order | Delivery ref | Increment | Required exit journey |
|---:|---|---|---|
| 1 | `SLC-001-T001` | GitHub-hosted platform and deployment baseline | `npm exec playwright test tests/e2e/spikes/platform-baseline.spec.ts` |
| 2 | `SLC-011` | Public-build baseline plus authenticated five-activity vertical slice | `npm exec playwright test tests/e2e/learner/private-beta-mvp.spec.ts` |
| 3 | `SLC-001-T002..T005` | Remaining provider, licensing, PWA, and skeleton spikes | `npm exec playwright test tests/e2e/spikes/platform-baseline.spec.ts` |
| 4 | `SLC-002` | Parent authority, sole learner, pack activation, offline child mode | `npm exec playwright test tests/e2e/onboarding/offline-first-run.spec.ts` |
| 5 | `SLC-003` | Reproducible licensed Reception and Year 1 core pack | `npm exec playwright test tests/e2e/content/core-pack-install.spec.ts` |
| 6 | `SLC-004` | Deterministic adaptive English learning journey | `npm exec playwright test tests/e2e/learner/adaptive-english-journey.spec.ts` |
| 7 | `SLC-005` | Tracing, spelling, TTS, and ephemeral speech journey | `npm exec playwright test tests/e2e/learner/multimodal-language.spec.ts` |
| 8 | `SLC-006` | Offline reading and governed private AI overlay | `npm exec playwright test tests/e2e/stories/approved-overlay.spec.ts` |
| 9 | `SLC-007` | Reception and Year 1 mathematics mastery | `npm exec playwright test tests/e2e/maths/representations-and-retention.spec.ts` |
| 10 | `SLC-008` | Rewards, parent evidence, controls, export, and deletion | `npm exec playwright test tests/e2e/parent/dashboard-controls-data-rights.spec.ts` |
| 11 | `SLC-009` | Offline, privacy, accessibility, security, performance, and device gates | `npm exec playwright test tests/e2e/offline/full-release-journey.spec.ts` |
| 12 | `SLC-010` | Exact production candidate, rollback, privacy transition, and release | `npm run release:verify` |

At each slice boundary:

- [ ] All slice tasks are `DONE` with passing evidence.
- [ ] The exit journey passes against the exact direct-main candidate in its
  declared environment.
- [ ] The independent reviewer verifies the full slice regression and hosted
  receipts for the corresponding `main` SHA.
- [ ] @Javis records the working increment, evidence, residual risk, and rollback
  path. The current full-build instruction is standing authorization to continue
  through slice boundaries; do not interrupt the product owner for routine
  approval between slices.
- [ ] Continue the next eligible task from the updated `main` without discarding
  task commits.

**Completion criterion:** the slice is delivered on `main`, independently
verified, reproducible from `main`, and its successor is unlocked by the ledger.

## 7. Interface Ownership Boundaries

- SLC-002 exclusively owns `AttemptEvent` persistence and reconciliation.
- SLC-003 exclusively owns `CurriculumRules`, content schemas, validation, and
  immutable pack publication.
- SLC-004 exclusively owns `selectNextActivity`, mastery projection, and
  educational decisions; these remain pure and deterministic.
- Speech, TTS, and tracing produce evidence and never mutate mastery directly.
- Generated content remains revision-controlled, validated,
  product-owner-approved, and private. It never alters curriculum or learning
  decisions.
- Convex authorises every parent-sensitive and provider operation. Child
  activities read and write authorised local state first.
- Vercel contains the PWA and shared static core assets only.

Any change to an owned interface requires `action=reopen` on its owning task and
all transitively affected downstream work before implementation continues.

**Completion criterion:** every shared contract has one owner and no downstream
slice substitutes mocks for an upstream production contract at its exit gate.

## 8. Production Release Gate

SLC-010 is complete only after this sequence:

- [ ] @Javis clears the complete technical release evidence gate for all PRD
  acceptance criteria and non-functional requirements after the final task's
  independent review passes.
- [ ] Complete required curriculum, privacy, accessibility, supervised child,
  and product-owner reviews.
- [ ] Verify direct GitHub delivery, required CI checks, the existing Vercel Git
  binding, project root `.`, production branch `main`, and protected Convex
  environment variables.
- [ ] Push the final reviewed candidate directly to `main` without bypassing the
  direct-main evidence gate.
- [ ] Deploy backward-compatible Convex production functions and schema.
- [ ] Allow the existing Vercel Git integration to deploy the exact `main` SHA
  to `wawi-learns`.
- [ ] Verify GitHub SHA, CI SHA, Vercel source SHA, runtime build SHA, and Convex
  candidate metadata agree.
- [ ] Keep the repository public through all preceding checks, then make it
  private and immediately reverify GitHub Actions history, Vercel Git access,
  production availability, and rollback access before the final `LIVE` claim.
- [ ] Run production installability, authentication, offline learning,
  reconciliation, content-hash, private-static-leak, and observability checks.
- [ ] Rehearse rollback to the previous safe Vercel deployment and compatible
  Convex bundle while preserving pending local events.
- [ ] Restore the candidate and rerun the production smoke journey.
- [ ] Install the approved PWA on the authorised Android device and obtain the
  sole product owner's `FINAL` approval. No additional human, agent, reviewer,
  or organisation sign-off is required.
- [ ] Record `action=approve stage=FINAL` using only the product-owner
  identifier.

On any production failure: withdraw unsafe content, restore the previous Vercel
deployment and compatible Convex functions, verify pending events remain safe,
block the release task, and remove every `LIVE` claim.

**Completion criterion:** all 54 tasks are `DONE`, every task has independent
technical `PASS` evidence, the final gate is approved only by the product owner,
the exact tested SHA is healthy in production, the post-build privacy transition
and rollback are proven, and the ledger state is `RELEASE_READY`.

## 9. Final Cleanliness Gate

- [ ] `git status --short` is empty after release evidence is committed.
- [ ] No `.agents/`, `build-pack/`, GlobalSetup checkout, duplicate PRD, status
  dashboard, handover file, research log, backup, secret, local cache, test
  report, or untracked deployment artifact exists.
- [ ] `.vercel/`, environment files, dependency folders, builds, and raw test
  output remain ignored and uncommitted.
- [ ] Every tracked file maps to the PRD, active implementation, tests, required
  configuration, migration, deployment, rollback, or orchestration evidence.

**Completion criterion:** the repository contains only the product, its tests,
its required delivery configuration, the approved plans, and durable release
evidence.
