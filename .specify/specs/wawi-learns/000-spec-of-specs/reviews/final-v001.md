# Final planning review v001

## Question and context

**Question:** Is the complete Wawi Learns planning workspace implementation-ready under spec-kit PRD extension v1.1, with sufficient source authority, evidence, traceability, greenfield architecture controls, task management and simplicity?

**Context:** Ten slices contain `spec.md`, `plan.md`, `tasks.md` and `code-impact.md`; the ledger contains 49 globally ranked tasks. Structural audit reports 10 slices, 49 unique/topologically ordered tasks, 40/40 grouped requirements covered, every slice acceptance criterion covered and zero active tasks. No implementation source or unrelated repository artifact was added.

## Stage 1 — Independent answers

### A — First principles / Source Authority

**Position: pass.** The root PRD is identified by path, byte count, line count and SHA-256. `requirements.md` preserves the source sections and original FR labels while assigning stable `PRD-FR/NFR` IDs. Every plan's global constraints copy the governing scope, privacy, offline, curriculum and delivery rules rather than weakening them. Non-goals remain explicit. The only intentional deviation from the stock extension layout is no duplicate PRD source file, justified by the user's plans-only instruction and DEC-014.

### B — Observation / Codegraph Controls

**Position: pass.** The workspace never calls proposed code observed. `codegraph.md` records the actual empty remote, absent local Git metadata and current Vercel project settings. Each slice lists exact files it will create/modify and exact signatures it owns or consumes. SLC-001 must prove toolchain/provider compatibility before downstream work. A later brownfield reconciliation must replace proposed references with verified file:symbol evidence and mark affected plans stale.

### C — Evidence / Evidence Lens

**Position: pass.** Each task has requirements, acceptance IDs, allowed/forbidden scope, ordered test-first steps, decisive command/output, edge/failure behavior, security, migration, observability, deployment, rollback and recovery trigger. Every ledger task declares unit, regression and E2E/integration checks. Current library/version claims use live registry results and explicit official-documentation fallback because Context7 was unavailable. Release claims are deliberately deferred to SLC-010 evidence.

### D — Systems / Traceability

**Position: pass.** Automated review found all 49 IDs unique, execution order equal to flattened task order, dependencies topological, every grouped requirement covered and every `AC-SLC-*` assigned. The ledger separates business priority from execution rank, permits zero/one active task, requires per-slice approval and declares baseline/full-regression/cross-slice/deployment/rollback final checks. Contract changes have explicit recovery triggers and downstream reopen rules.

### E — Human consequences / Simplicity

**Position: pass.** The plan adds planning files only under one spec-kit workspace. It avoids a second backend, Turborepo, generic provider plugin architecture, runtime CMS and parallel ownership. Tasks give a fresh agent exact boundaries and commands while preserving mandatory human approvals for curriculum, privacy, accessibility, supervised usability and release. The plan is large because the approved Version 1 is large; removing detail would transfer risk to implementation rather than simplify it.

## Stage 2 — Blind review

### Reviewer A

1. **D:** Strongest because machine-checked traceability and recovery make the plan operational.
2. **C:** Complete task evidence, though current commands necessarily target files created by earlier tasks.
3. **B:** Accurate greenfield control, with a clear stale-plan rule for later code drift.
4. **E:** Correctly defends necessary detail but cannot itself prove execution capacity.

### Reviewer B

1. **C:** Best demonstrates that an agent can execute and prove each task without guessing.
2. **D:** Strong project-management integrity, though linear work is slower than ideal staffing could permit.
3. **A:** Source coverage is credible, but grouped IDs require implementers to use the source column for fine detail.
4. **E:** Simple architecture argument is sound, but human gates still need named availability.

### Reviewer C

1. **D:** The ledger and automated coverage results are the strongest objective evidence.
2. **A:** Clear source authority and justified clean-repository adaptation.
3. **B:** Correctly distinguishes observed and proposed architecture.
4. **E:** Appropriate human-centred conclusion, though not an independent technical test.

### Reviewer D

1. **C:** Task packets provide the clearest executable contract.
2. **A:** Prevents scope erosion across a long programme.
3. **E:** Keeps the design proportional and approvals legitimate.
4. **B:** Useful evidence, but proposed interfaces may still change after SLC-001 results.

### Reviewer E

1. **A:** Strongest legitimacy and child-safety anchor.
2. **C:** Makes “done” concrete and prevents agent improvisation.
3. **D:** Protects long-term consistency through ownership and reopen cascades.
4. **B:** Necessary architecture honesty, but implementation proof remains future work.

## Stage 3 — Debate

### Conflict 1: Pin current library versions now versus decide after spikes

C argues exact pins make tasks reproducible. B argues greenfield compatibility is not yet proven. **Resolution:** DEC-011 defines the baseline pins; SLC-001 must build/test them and may amend the ADR with fresh official evidence before any downstream code. No silent `latest` dependency is allowed.

### Conflict 2: Commands reference future files

D argues the ledger validator should reject nonexistent commands. C argues greenfield implementation plans must name their future tests/scripts, and each referenced path has an owning task that creates it before execution. **Resolution:** paths are exact contracts, not placeholders; orchestration order makes them real before they are run.

### Conflict 3: The plan may be too large for one Version 1

E notes delivery risk; A notes scope is an approved product decision, not a planning option. **Resolution:** retain full scope, expose it honestly through 49 gated tasks, and block release rather than relabel a partial build Version 1.

## Validator compatibility note

The v1.1 orchestrator's read-only `status` and `next` actions parse this ledger successfully and select `SLC-001-T001`. The stock `phase=all` validator passes the orchestration representation after `priorities.execution` is encoded as `SLC-NNN::SLC-NNN-TMMM`; its sole remaining failure is `source.normalized` because it requires a second `Wawi Learns PRD.normalized.md` file. That duplicate was deliberately not added under the user's plans-only constraint. The canonical root PRD remains byte-preserved and SHA-256 verified. Do not add a duplicate source artifact unless the user changes that constraint.

## Stage 4 — Chair's verdict

**Recommendation:** Mark the planning workspace `PLAN_READY`. Start no implementation until a human assigns and starts `SLC-001-T001`; thereafter use the ledger as the sole machine-readable task-state authority.

**Reasoning that survived:** Complete PRD coverage, exact file/interface ownership, test-first task packets, authoritative documentation fallback, explicit greenfield evidence, one-active-task control, human slice approvals and production/rollback final gates all survived review.

**Council disagreement:** Current dependency pins and future-path checkability remain conditional on SLC-001 execution. Those are controlled conditions, not unresolved planning gaps.

**Strongest argument against:** Provider/device/content evidence could fail and force substantial rework. The plan anticipates that correctly: the affected task blocks, the owning ADR or slice reopens, and no downstream approval remains valid.

**First three actions:** (1) validate the checked-in planning structure after Git initialisation without modifying IDs; (2) use `orchestration.yml` action `next` to select only `SLC-001-T001`; (3) obtain human approval after SLC-001 exit evidence before unlocking SLC-002.

**Verdict:** PASS. Unresolved Critical findings: 0. Unresolved Important findings: 0. Implementation evidence claimed: none.
