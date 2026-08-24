# Wawi Learns Version 1 Implementation Plan

> **For @Javis and agentic workers:** REQUIRED EXECUTION METHOD: run one
> `orchestration.yml` task at a time. @Javis orchestrates and never writes
> implementation code; @Javis selects exactly one of @Jimmy, @Bumble, or @Cody
> as the implementation and commit owner for each task.

**Goal:** Build, verify, and release the complete approved private Wawi Learns
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
- Execute the frozen 54-task sequence across eleven slices. Exactly zero or one task may be active.
- @Javis selects one implementation owner per task: @Jimmy for platform and
  integration work, @Bumble for product and UI work, or @Cody for small bounded
  feature work. Every other agent remains read-only for that task.
- Add only files allowed by the active task packet.
- Run application installs, builds, full typechecks, and runtime checks in the
  task's approved hosted environment. Local application execution requires
  explicit product-owner opt-in recorded for that task.
- Use the existing GitHub repository, Vercel project `wawi-learns`, and Convex
  architecture. Do not create substitute projects.
- The product owner is the sole human approval authority for slice and final
  release decisions. No co-author, sign-off, second human, external reviewer, or
  outside organisation is required to approve the work. Agent `PASS`/`BLOCK`
  results are technical quality evidence, not additional approval authority.
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

`next` must return `SLC-001-T001`. Any other result is a blocker requiring a
ledger audit before implementation.

State-changing forms:

```text
/speckit.prd.orchestrate slug=wawi-learns action=start task=SLC-001-T001 owner=@Jimmy
/speckit.prd.orchestrate slug=wawi-learns action=evidence task=SLC-001-T001 check=unit.repository-contract result=pass path=tests/unit/repository-contract.test.ts
/speckit.prd.orchestrate slug=wawi-learns action=complete task=SLC-001-T001
/speckit.prd.orchestrate slug=wawi-learns action=block task=SLC-001-T001 reason="Vercel project identity does not match DEC-012"
/speckit.prd.orchestrate slug=wawi-learns action=reopen task=SLC-001-T001 reason="Accepted Node or dependency pin changed"
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
| @Javis | CTO/CEO and release commander | Clarify outcomes, create bounded packets, choose one owner per change, resolve trade-offs, enforce evidence gates, and make technical ship/no-ship decisions. | Routine implementation, competing edits, or self-approving a change. |
| @Jimmy | Platform implementation engineer | Backend/integration work, tooling, runtime repair, builds, and clearly scoped engineering tasks. | Product direction, cross-team orchestration, or final release approval. |
| @Bumble | Product and UI implementation engineer | Focused frontend/UI tasks, user-flow polish, and implementation with explicit acceptance criteria. | Broad architecture decisions or concurrent edits to another builder's files. |
| @Cody | Fast bounded feature implementer | Small self-contained changes with clear acceptance tests, explicit files, and a rollback boundary. | Whole-repository rewrites, ambiguous multi-system work, orchestration, or release decisions. |
| @Einstein | Architecture, diagnosis, and failure-mode reviewer | First-principles framing, root-cause analysis, load-bearing assumptions, and challenging the mechanism before code starts. | Primary delivery ownership or long build execution. |
| @Fizz | Quality strategy and independent verification reviewer | Test strategy, release-risk analysis, cross-cutting product trade-offs, and adversarial review. | Implementing the same change being verified. |
| @Honey | Robustness and large-context reviewer | Complex-diff second opinion, larger-surface consistency, edge cases, and evidence sufficiency. | Parallel implementation of the same task or final release authority. |

Every assignment message must contain:

```text
TASK: exact SLC-NNN-TMMM and title
OWNER: exactly one of @Jimmy, @Bumble, or @Cody
GOAL: active packet outcome
SCOPE: exact allowed and forbidden files
INTERFACES: exact owned and consumed contracts
RED: failing test or check and expected failure
GREEN: minimum implementation boundary
VERIFY: every required check and its location
ROUND_ROBIN: @Einstein -> @Jimmy -> @Bumble -> @Cody -> @Fizz -> @Honey -> @Javis
CANDIDATE: staged tree ID plus artifact paths for every PASS
DIRECT_MAIN: pre-push gate and post-push receipt/rollback conditions
ROLLBACK: packet rollback action
STOP: blocker and reopen conditions
```

**Completion criterion:** one named writer owns one bounded task; every agent
has a defined evidence target; no agent invents scope or interfaces.

## 5. Per-Task Delivery Loop

For each smallest task returned by `action=next`:

- [ ] @Javis checks dependencies and selects exactly one implementation owner:
  @Jimmy, @Bumble, or @Cody.
- [ ] @Einstein reviews the proposed mechanism, interfaces, load-bearing
  assumptions, and failure modes before code starts. A pre-change `BLOCK` must
  be resolved by @Javis and the selected owner before editing.
- [ ] The selected owner writes the packet's failing test or decisive failing
  check, retains the real failure, and implements the smallest allowed change.
- [ ] The selected owner runs every declared unit, integration, regression,
  E2E, migration, deployment, and rollback check in its declared environment.
- [ ] The selected owner stages only allowed files and records `git write-tree`
  as the candidate tree ID. As soon as the smallest task passes, stop
  implementation and run this read-only round robin on that candidate in order:
  @Einstein, @Jimmy, @Bumble, @Cody, @Fizz, @Honey, then @Javis.
- [ ] @Einstein checks mechanism, architecture, assumptions, and failure modes.
  @Jimmy checks platform, integration, tooling, runtime, and build evidence.
  @Bumble checks product behaviour, UI, and user-flow quality. @Cody checks
  task boundaries, acceptance tests, and rollback. @Fizz checks test strategy,
  release risk, cross-cutting trade-offs, and adversarial cases. @Honey checks
  larger-surface consistency, robustness, edge cases, and evidence sufficiency.
- [ ] The implementation owner uses their round-robin turn for explicit
  self-review and evidence handoff; every other review remains independent.
  Each required review role returns `PASS` only with the candidate tree ID plus
  an exact command result, hosted receipt, or evidence path; otherwise it returns
  `BLOCK` with one exact defect. A review has a ten-minute response window with
  one reminder at five minutes. Silence is `BLOCK`, never `PASS`; @Javis may
  record an available same-remit substitute, or the task remains blocked.
- [ ] Any `BLOCK` returns the task to the same implementation owner. After the
  repair, restage the candidate, record its new tree ID, rerun all affected
  checks and the complete round robin. Do not start another task while any
  `BLOCK` remains.
- [ ] @Javis resolves disagreements, records the evidence, and marks the
  technical gate complete only after every required review role returns `PASS`.
- [ ] The selected owner reviews the diff for secrets, generated clutter,
  unrelated changes, dead configuration, and forbidden files; then commits the
  implementation, tests, evidence, and ledger state as one task-scoped commit
  with configured Git author metadata plus matching `Co-authored-by` then
  `Signed-off-by` attribution trailers. Verify `HEAD^{tree}` equals the reviewed
  candidate tree ID.
- [ ] Push the reviewed task commit directly to `main`. GitHub Actions and
  Vercel receipts must identify that exact SHA before the task is `DONE`. On a
  hosted failure, revert the exact task commit on `main`, run `action=block`, and
  do not start another task.
- [ ] Report exactly:

```text
TASK | OWNER | STATE | DECISIVE EVIDENCE | COMMIT/RECEIPTS | BLOCKER | NEXT
```

If a task fails, run `action=block`. @Einstein diagnoses and the selected owner
repairs. If an accepted interface, dependency, ADR, test, or environment becomes
stale, run `action=reopen` and invalidate every downstream result. Never advance
on red.

**Completion criterion:** the task is `DONE`, all declared evidence is fresh and
passing, every required review role has returned artifact-bound `PASS`, its
reviewed commit is scoped and pushed to `main`, hosted receipts match its SHA,
and `action=next` returns only the dependency-valid successor.

## 6. Slice Delivery Sequence

Use direct task-scoped commits on `main`; no pull request, branch-protection, or
slice branch is used. Preserve each task commit; do not squash away task
traceability.

| Order | Delivery ref | Increment | Required exit journey |
|---:|---|---|---|
| 1 | `main` | Platform, provider, licensing, and skeleton proof | `npm exec playwright test tests/e2e/spikes/platform-baseline.spec.ts` |
| 2 | `main` | Parent authority, sole learner, pack activation, offline child mode | `npm exec playwright test tests/e2e/onboarding/offline-first-run.spec.ts` |
| 3 | `main` | Reproducible licensed Reception and Year 1 core pack | `npm exec playwright test tests/e2e/content/core-pack-install.spec.ts` |
| 4 | `main` | Deterministic adaptive English learning journey | `npm exec playwright test tests/e2e/learner/adaptive-english-journey.spec.ts` |
| 5 | `main` | Tracing, spelling, TTS, and ephemeral speech journey | `npm exec playwright test tests/e2e/learner/multimodal-language.spec.ts` |
| 6 | `main` | Offline reading and governed private AI overlay | `npm exec playwright test tests/e2e/stories/approved-overlay.spec.ts` |
| 7 | `main` | Reception and Year 1 mathematics mastery | `npm exec playwright test tests/e2e/maths/representations-and-retention.spec.ts` |
| 8 | `main` | Rewards, parent evidence, controls, export, and deletion | `npm exec playwright test tests/e2e/parent/dashboard-controls-data-rights.spec.ts` |
| 9 | `main` | Offline, privacy, accessibility, security, performance, and device gates | `npm exec playwright test tests/e2e/offline/full-release-journey.spec.ts` |
| 10 | `main` | Exact production candidate, rollback, and private-beta approval | `npm run release:verify` |

At each slice boundary:

- [ ] All slice tasks are `DONE` with passing evidence.
- [ ] The exit journey passes against the exact direct-main candidate in its
  declared environment.
- [ ] @Honey verifies the full slice regression and hosted receipts for the
  corresponding `main` SHA.
- [ ] @Javis gives the product owner the working increment, evidence, residual
  risk, and rollback path.
- [ ] The product owner alone approves the slice; no agent,
  second human, external reviewer, or outside organisation must approve it.
- [ ] @Javis records `action=approve stage=SLC-NNN` using only the product-owner
  identifier.
- [ ] @Javis assigns the approval-only ledger change to one builder, who commits
  it directly to `main` with configured attribution trailers after its review
  gate passes.
- [ ] Continue the next eligible task from the updated `main` without discarding
  task commits.

**Completion criterion:** the slice is delivered on `main`, product-owner-approved,
reproducible from `main`, and its successor is unlocked by the ledger.

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
  full-team round robin passes.
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

**Completion criterion:** all 54 tasks are `DONE`, every task has unanimous
technical `PASS` evidence, all eleven slices and the final gate are approved only
by the product owner, the exact tested SHA is healthy in production, rollback is
proven, and the ledger state is `RELEASE_READY`.

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
