# Decomposition review v001

## Question and context

**Question:** Does the proposed ten-slice decomposition translate the approved Wawi Learns PRD into the smallest safe, dependency-valid delivery sequence without reducing Version 1 scope or adding unnecessary machinery?

**Context:** The project is greenfield; the GitHub repository is private and empty; Vercel project `wawi-learns` already exists. The PRD already defines Phase 0–9. The user requires plans only and an extremely clean repository. Assumptions: one implementation owner works one task at a time; all mandatory PRD scope remains; the root PRD stays the single source copy.

## Stage 1 — Independent answers

### A — First principles / Source Authority

**Position: pass.** The indivisible outcome is not “ten modules” but one child-safe, offline learning system. The decomposition preserves the PRD's own Phase 0–9 order and gives every one of the 32 grouped functional and eight non-functional planning requirements one primary owner. Platform and content foundations precede the first learner loop because an offline adaptive lesson cannot be tested honestly without durable events and validated content. The sequence adds no product scope. The root PRD digest and source locations preserve authority without duplicating the 115 KB document.

### B — Observation / Codegraph Controls

**Position: pass with a greenfield caveat.** Direct inspection found no code graph: only the PRD, an empty private GitHub remote and a pre-created Vercel project. The roadmap correctly labels every file and symbol as proposed rather than pretending they exist. Ten slice directories mirror the observable PRD phase structure, while 49 task packets provide the smaller review boundary. The key future interfaces—attempts, pack activation, auth guard, engine, tracing, speech, validation, maths and dashboard—have one owning slice.

### C — Evidence / Evidence Lens

**Position: pass.** The decomposition uses live GitHub/Vercel inspection and current registry/docs evidence where infrastructure claims are time-sensitive. It does not claim provider, identity, tracing, licensing or pack choices are known: SLC-001 turns each into a measured ADR and blocks downstream work if no candidate passes. Every slice has a decisive E2E or integration exit journey. The main uncertainty is project scale, handled by fail-closed gates rather than optimistic estimates.

### D — Systems / Traceability

**Position: pass.** Dependencies are acyclic and deliberately linear, with business priority recorded separately from execution priority. Shared contracts have a single owner and downstream consumers. Cross-cutting privacy, offline and NFR requirements reappear in hardening and release without stealing primary ownership. Reopen cascades are essential because a change to attempt, pack, engine or overlay contracts invalidates downstream evidence. The final gate closes the loop from PRD AC-01…36 through production and rollback.

### E — Human consequences / Simplicity

**Position: pass.** The plan serves one parent and one six-year-old, so privacy, calm correction, offline continuity and truthful reporting outrank architectural novelty. npm workspaces reuse the PRD package boundaries without adding Turborepo, a second backend or a runtime CMS. The only concern is that the full content inventory is large, but splitting it out would not reduce the mandatory release burden; keeping it as a gated content slice makes ownership and rejection clear.

## Stage 2 — Blind review

Mapping remained hidden during ranking: A–E are the independent answers above.

### Reviewer A

1. **D:** Strongest because it proves the dependency and invalidation model rather than merely restating scope.
2. **C:** Strong evidence discipline, though it could say more about educational review capacity.
3. **B:** Correctly refuses to invent a code graph, but proposed file boundaries still need later compatibility proof.
4. **E:** Human-centred and simple, but less explicit about traceability mechanics.

### Reviewer B

1. **C:** Best distinguishes verified platform facts from decisions still requiring spikes.
2. **D:** Strong systemic ordering, though strict linear execution costs calendar time.
3. **A:** Clear authority argument, but grouped requirements depend on preserved source labels for fine traceability.
4. **E:** Correct direction, but content-review staffing remains unmeasured.

### Reviewer C

1. **D:** Most testable because it names dependency, ownership and reopen behavior.
2. **A:** Strongest source argument and correctly treats the PRD phase sequence as approved evidence.
3. **B:** Sound greenfield observation, but live provider evidence still belongs in SLC-001.
4. **E:** Sensible simplicity case, though it offers little quantitative release evidence.

### Reviewer D

1. **A:** Best proves that nothing mandatory was lost or invented.
2. **C:** Correctly makes uncertainty explicit and executable.
3. **E:** Strong incentive alignment for child safety and parent trust.
4. **B:** Accurate current-state description, but a file map alone does not prove future cohesion.

### Reviewer E

1. **A:** Keeps the plan legitimate by anchoring every delivery claim to the approved PRD.
2. **D:** Protects long-term trust through explicit ownership and invalidation.
3. **C:** Prevents false confidence, though the evidence workload is substantial.
4. **B:** Technically careful but least attentive to human review constraints.

## Stage 3 — Debate

### Conflict 1: Ten slices are too broad versus 49 tasks are the correct review boundary

A argues that splitting every feature into a slice would produce a directory taxonomy rather than an implementation path. B argues that broad slices can hide risk. D resolves the conflict: a slice is the independently approvable user/system increment, while the 49 one-commit task packets are the implementation/reviewer boundary. **Winner: retain ten slices and enforce task-level gates.**

### Conflict 2: Strict waterfall versus parallel delivery

D notes that some content and UI work could technically overlap. E notes that one owner, a clean greenfield repository and safety-critical shared contracts make competing edits expensive. The spec-kit v1.1 orchestrator also enforces one active task. **Winner: strict dependency order; business priority remains visible but does not override contract readiness.**

### Conflict 3: Duplicate the PRD into `.specify` versus keep one canonical source

C prefers the stock extension's preserved-source copy for mechanical validation. A points to the explicit user constraint forbidding non-plan artifacts and the unchanged root PRD with digest/line/byte evidence. **Winner: keep the root PRD as the single canonical source and record DEC-014; do not add a duplicate.**

## Stage 4 — Chair's verdict

**Recommendation:** Approve decomposition v001 and freeze the ten-slice sequence. It is source-complete, acyclic, measurable and simpler than inventing an alternative programme structure.

**Reasoning that survived:** The PRD's own Phase 0–9 is the strongest source-backed sequence; task packets provide sufficiently small implementation gates; greenfield claims are correctly labelled proposed; uncertain vendors/technology are resolved by executable SLC-001 ADRs; shared contracts have one owner and clear reopen cascades.

**Council disagreement:** Calendar-time parallelism and duplicate source preservation remained disputed. The explicit one-task orchestrator and plans-only cleanliness constraint decide both for this repository.

**Strongest argument against:** The content inventory and device matrix are large enough that a ten-slice headline may understate operational effort. The response is not more architectural layers; it is fail-closed thresholds, named reviewers and decisive evidence in SLC-003, SLC-009 and SLC-010.

**First three actions:** (1) materialise all slice plans/tasks and the ledger; (2) run structural, traceability and placeholder audits; (3) begin only with `SLC-001-T001` after an implementation owner explicitly starts it.

**Verdict:** PASS. Unresolved Critical findings: 0. Unresolved Important findings: 0.
