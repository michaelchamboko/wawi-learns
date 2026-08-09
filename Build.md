# Wawi Learns Version 1 Implementation Plan

> **For @Javis and agentic workers:** REQUIRED EXECUTION METHOD: run one
> `orchestration.yml` task at a time. @Javis orchestrates and never writes
> implementation code; @Cody is the sole production-code writer unless the human
> product owner explicitly transfers one task.

**Goal:** Build, verify, and release the complete approved private Wawi Learns
Version 1 for Malachi.

**Architecture:** The child experience is a local-first Next.js PWA. IndexedDB
holds authorised offline learning state and append-only attempt events; Convex is
the only backend authority for identity, parent operations, reconciliation, and
private overlays. Vercel serves the application and shared static core assets.

**Tech stack:** npm workspaces; candidate pins Node 24.x, Next.js 16.3.0, React
19.2.8, TypeScript 7.0.2, Convex 1.43.0, Serwist 9.5.12, idb 8.0.3, Zod 4.4.3,
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
- Execute the frozen 49-task sequence. Exactly zero or one task may be active.
- @Cody owns production edits and commits. Other agents investigate, prototype
  outside the repository, or review without competing edits.
- Add only files allowed by the active task packet.
- Run application installs, builds, full typechecks, and runtime checks in the
  task's approved hosted environment. Local application execution requires
  explicit human opt-in recorded for that task.
- Use the existing GitHub repository, Vercel project `wawi-learns`, and Convex
  architecture. Do not create substitute projects.
- Human approval is mandatory after every slice and for the final release.
- A scaffold, preview, green command, or merged pull request is not `LIVE`.

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

The only persistent project-management outputs are:

- implementation, test, configuration, migration, and deployment files required
  by the active task;
- the existing `.specify` plans;
- task evidence under `000-spec-of-specs/orchestration-evidence/`;
- Git commits, pull requests, CI receipts, deployment receipts, and approvals.

**Completion criterion:** every agent can identify one authoritative task packet
and no second planning, task, status, or handover system exists.

## 2. Pre-Execution Git Bootstrap

The local repository is initialized on `main`, `origin` points to
`https://github.com/michaelchamboko/wawi-learns.git`, and the remote has no refs.
The ledger remains `NOT_STARTED`. The verified pre-execution blocker is missing
repository Git identity.

- [ ] Run `git config user.name` and `git config user.email`.
- [ ] If either value is empty, stop and ask the human for the exact name and
  email. Do not infer either value from GitHub or another repository.
- [ ] Confirm the PRD SHA-256 is
  `E2ECED5839B60FBD7047C8605FD03483464DC719F993353EA5846C17ACF62257`.
- [ ] Confirm `git remote get-url origin` returns the canonical repository.
- [ ] Confirm the only root entries are `.git/`, `.gitignore`, `.specify/`,
  `AGENTS.md`, `Build.md`, and `Wawi Learns PRD.md`.
- [ ] Stage exactly `.gitignore`, `.specify`, `AGENTS.md`, `Build.md`, and
  `Wawi Learns PRD.md`.
- [ ] Run `git diff --cached --check`; require exit `0`.
- [ ] Create the sole pre-ledger bootstrap commit:

```powershell
$humanName = git config user.name
$humanEmail = git config user.email
git commit -m "chore(repo): initialize Wawi Learns plans" `
  --trailer "Co-authored-by: $humanName <$humanEmail>" `
  --trailer "Signed-off-by: $humanName <$humanEmail>"
```

- [ ] Verify both trailers with `git log -1`.
- [ ] Push the initial `main` because the remote is empty, establish `main` as
  the default branch, and enable pull-request-only protection. Do not require a
  nonexistent CI check; SLC-001-T001 adds the real checks.

**Completion criterion:** GitHub contains one clean bootstrap commit with the
preserved PRD and plans, `main` is protected, and no implementation has started.

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
/speckit.prd.orchestrate slug=wawi-learns action=start task=SLC-001-T001 owner=@Cody
/speckit.prd.orchestrate slug=wawi-learns action=evidence task=SLC-001-T001 check=unit.repository-contract result=pass path=tests/unit/repository-contract.test.ts
/speckit.prd.orchestrate slug=wawi-learns action=complete task=SLC-001-T001
/speckit.prd.orchestrate slug=wawi-learns action=block task=SLC-001-T001 reason="Vercel project identity does not match DEC-012"
/speckit.prd.orchestrate slug=wawi-learns action=reopen task=SLC-001-T001 reason="Accepted Node or dependency pin changed"
```

Use the real check IDs returned by `action=next`; the evidence command above
shows syntax only. Evidence paths must exist inside the repository. Never edit
ledger state or evidence markers by hand. For an approval call, pass the exact
human name returned by `git config user.name` as `approved_by`; never pass an
agent identity.

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

| Agent | Required responsibility |
|---|---|
| @Javis | Select the next task, issue its packet, coordinate reviews, enforce gates, and report status. Never write production code. |
| @Cody | Own all production implementation, task tests, scoped commits, and fixes. Load only the active packet and affected files. |
| @Einstein | Investigate architecture/runtime risks before high-risk tasks and provide root-cause evidence for failures. |
| @Jimmy | Validate product behaviour, API/UI integration, child flow, and parent flow against acceptance criteria. |
| @Honey | Independently verify tests, CI, privacy, security, reliability, deployment, and rollback evidence. |
| @Bumble | Provide task-required primary documentation, curriculum, provider, licensing, and safety evidence. |
| @Fizz | Test interaction or platform hypotheses in disposable external scratch space; hand findings to @Cody without committing prototypes. |

Every assignment message must contain:

```text
TASK: exact SLC-NNN-TMMM and title
OWNER: @Cody
GOAL: active packet outcome
SCOPE: exact allowed and forbidden files
INTERFACES: exact owned and consumed contracts
RED: failing test or check and expected failure
GREEN: minimum implementation boundary
VERIFY: every required check and its location
REVIEWERS: @Honey plus task specialist
ROLLBACK: packet rollback action
STOP: blocker and reopen conditions
```

**Completion criterion:** one named writer owns one bounded task; reviewers have
independent evidence targets; no agent must invent scope or interfaces.

## 5. Per-Task Delivery Loop

For each task returned by `action=next`:

- [ ] @Javis checks that dependencies and the previous slice approval are valid.
- [ ] @Javis creates or continues the current slice branch and starts the task
  for @Cody.
- [ ] @Einstein or @Bumble supplies pre-change evidence when the packet depends
  on runtime, provider, documentation, curriculum, licensing, or safety facts.
- [ ] @Cody writes the packet's failing test or decisive failing check.
- [ ] Run the check in its declared environment and retain the real failure.
- [ ] @Cody implements the smallest code that makes the check pass, touching
  only allowed files.
- [ ] Run every declared unit, integration, regression, E2E, migration,
  deployment, and rollback check.
- [ ] @Honey independently verifies results. @Jimmy verifies product journeys;
  @Einstein verifies runtime and data contracts; @Bumble verifies source-backed
  decisions; @Fizz verifies task-authorized interaction hypotheses.
- [ ] @Javis records evidence and completes the task through the orchestrator.
- [ ] @Cody reviews the diff for secrets, generated clutter, unrelated changes,
  dead configuration, and forbidden files.
- [ ] @Cody commits implementation, tests, evidence, and ledger state as one
  task-scoped commit using the repository human trailers.
- [ ] Push the slice branch and require the configured CI and preview checks.
- [ ] Report exactly:

```text
TASK | OWNER | STATE | DECISIVE EVIDENCE | COMMIT/PR | BLOCKER | NEXT
```

If a task fails, run `action=block`. @Einstein diagnoses; @Cody repairs. If an
accepted interface, dependency, ADR, test, or environment becomes stale, run
`action=reopen` and invalidate every downstream result. Never advance on red.

**Completion criterion:** the task is `DONE`, all declared evidence is fresh and
passing, its commit is scoped and human-trailed, CI is green, and `action=next`
returns only the dependency-valid successor.

## 6. Slice Delivery Sequence

Use one short-lived branch and one pull request per slice. Preserve each task's
commit; do not squash away task traceability.

| Order | Branch | Increment | Required exit journey |
|---:|---|---|---|
| 1 | `feat/slc-001-validation-spikes` | Platform, provider, licensing, and skeleton proof | `npm exec playwright test tests/e2e/spikes/platform-baseline.spec.ts` |
| 2 | `feat/slc-002-secure-offline-foundation` | Parent authority, sole learner, pack activation, offline child mode | `npm exec playwright test tests/e2e/onboarding/offline-first-run.spec.ts` |
| 3 | `feat/slc-003-curriculum-content-packs` | Reproducible licensed Reception and Year 1 core pack | `npm exec playwright test tests/e2e/content/core-pack-install.spec.ts` |
| 4 | `feat/slc-004-adaptive-learner-core` | Deterministic adaptive English learning journey | `npm exec playwright test tests/e2e/learner/adaptive-english-journey.spec.ts` |
| 5 | `feat/slc-005-handwriting-spelling-speech` | Tracing, spelling, TTS, and ephemeral speech journey | `npm exec playwright test tests/e2e/learner/multimodal-language.spec.ts` |
| 6 | `feat/slc-006-reading-stories-ai` | Offline reading and governed private AI overlay | `npm exec playwright test tests/e2e/stories/approved-overlay.spec.ts` |
| 7 | `feat/slc-007-mathematics-mastery` | Reception and Year 1 mathematics mastery | `npm exec playwright test tests/e2e/maths/representations-and-retention.spec.ts` |
| 8 | `feat/slc-008-rewards-parent-operations` | Rewards, parent evidence, controls, export, and deletion | `npm exec playwright test tests/e2e/parent/dashboard-controls-data-rights.spec.ts` |
| 9 | `feat/slc-009-offline-safety-hardening` | Offline, privacy, accessibility, security, performance, and device gates | `npm exec playwright test tests/e2e/offline/full-release-journey.spec.ts` |
| 10 | `feat/slc-010-private-beta-release` | Exact production candidate, rollback, and private-beta approval | `npm run release:verify` |

At each slice boundary:

- [ ] All slice tasks are `DONE` with passing evidence.
- [ ] The exit journey passes against the pull-request candidate in its declared
  environment.
- [ ] @Honey verifies the full slice regression and preview receipts.
- [ ] @Javis gives the human the working increment, evidence, residual risk, and
  rollback path.
- [ ] The human approves the slice and pull request.
- [ ] @Javis records `action=approve stage=SLC-NNN` using the human identity.
- [ ] @Cody commits the approval-only ledger change with human trailers.
- [ ] Merge without discarding task commits, then create the next slice branch
  from the updated protected `main`.

**Completion criterion:** the slice is merged, human-approved, reproducible from
`main`, and its successor is unlocked by the ledger.

## 7. Interface Ownership Boundaries

- SLC-002 exclusively owns `AttemptEvent` persistence and reconciliation.
- SLC-003 exclusively owns `CurriculumRules`, content schemas, validation, and
  immutable pack publication.
- SLC-004 exclusively owns `selectNextActivity`, mastery projection, and
  educational decisions; these remain pure and deterministic.
- Speech, TTS, and tracing produce evidence and never mutate mastery directly.
- Generated content remains revision-controlled, validated, human-approved, and
  private. It never alters curriculum or learning decisions.
- Convex authorises every parent-sensitive and provider operation. Child
  activities read and write authorised local state first.
- Vercel contains the PWA and shared static core assets only.

Any change to an owned interface requires `action=reopen` on its owning task and
all transitively affected downstream work before implementation continues.

**Completion criterion:** every shared contract has one owner and no downstream
slice substitutes mocks for an upstream production contract at its exit gate.

## 8. Production Release Gate

SLC-010 is complete only after this sequence:

- [ ] Build and approve the complete release evidence gate for all PRD
  acceptance criteria and non-functional requirements.
- [ ] Complete required curriculum, privacy, accessibility, supervised child,
  and product-owner reviews.
- [ ] Verify protected GitHub delivery, required CI checks, the existing Vercel
  Git binding, project root `.`, production branch `main`, and protected Convex
  environment variables.
- [ ] Merge the approved pull request without bypassing checks.
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
- [ ] Install the approved PWA on the authorised Android device and obtain
  explicit human `FINAL` approval.
- [ ] Record `action=approve stage=FINAL` using the human identity.

On any production failure: withdraw unsafe content, restore the previous Vercel
deployment and compatible Convex functions, verify pending events remain safe,
block the release task, and remove every `LIVE` claim.

**Completion criterion:** all 49 tasks are `DONE`, all ten slices and the final
gate are human-approved, the exact tested SHA is healthy in production, rollback
is proven, and the ledger state is `RELEASE_READY`.

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
