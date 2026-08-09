# Tasks: SLC-007 Mathematics Mastery

**Assumptions:** The complete validated maths template inventory from SLC-003 is available and immutable by version.
**Unresolved decisions:** None.

## Execution protocol

Tasks run in order with failing tests first and one scoped, human-trailed commit each. Do not edit English rules or create a second scheduler/mastery implementation.

### SLC-007-T001 — Integrate maths domain and evidence

- **Requirements / acceptance:** PRD-FR-016; AC-SLC-007-001.
- **Allowed scope:** maths engine module, typed activity/evidence extensions, unit/property tests.
- **Forbidden scope:** UI strand implementation, English-rule changes, speed-based evidence.
- **Interfaces:** implements `buildMathsActivity` and `classifyMathsAttempt`; consumes shared mastery/scheduler.
- **Steps:** write seed/answer/misconception/dimension/representation-mastery tests; implement typed plan and evidence; map misconception tags to support strategies; require representation diversity/delay; property-test deterministic output and English isolation; commit.
- **Evidence:** `npm exec vitest run tests/unit/learning-engine/maths.test.ts tests/unit/learning-engine/maths.property.test.ts tests/integration/learner/maths-projection.test.ts`; expected deterministic plans and client/server maths projections pass.
- **Edge/failure:** missing template, impossible seed, ambiguous answer, slow correct response and disabled representation return safe worked example/retry without penalty.
- **Security/migration:** no PII/new provider; additive event fields and engine version.
- **Observability:** strand/skill/template/seed/representation/misconception/result only.
- **Deployment/rollback:** preview library; rollback engine between sessions, preserve attempts.
- **Recovery trigger:** template, evidence, mastery or misconception contract change.

### SLC-007-T002 — Deliver Reception mathematics

- **Requirements / acceptance:** FR-MATH-01, 03–07; AC-SLC-007-002.
- **Allowed scope:** Reception renderers/rules/tests.
- **Forbidden scope:** Year 1-only objectives, timed challenge, unvalidated generation.
- **Interfaces:** consumes `MathsActivityPlan`; produces typed maths attempts for number-to-10, subitising, counting, bonds, comparison, doubles/odds/evens/distribution, shape/measure/pattern.
- **Steps:** write one worked-example/practice/offline journey per outcome; implement minimal reusable renderers; add spoken instructions and concrete/pictorial staging; map common misconceptions; run content and E2E suites; commit.
- **Evidence:** `npm exec playwright test tests/e2e/maths/reception.spec.ts`; expected every outcome passes online/offline with no speed penalty.
- **Edge/failure:** zero objects, reordered objects, repeated tap, visual ambiguity and no audio preserve exact answer/support.
- **Security/migration:** validated public core assets only; no schema migration beyond T001.
- **Observability:** plan/evidence fields from T001.
- **Deployment/rollback:** preview; unregister Reception plans on rollback.
- **Recovery trigger:** Reception curriculum/template/renderer change.

### SLC-007-T003 — Deliver Year 1 mathematics

- **Requirements / acceptance:** FR-MATH-02…07; AC-SLC-007-003.
- **Allowed scope:** Year 1 renderers/rules/tests.
- **Forbidden scope:** Year 2, calculator shortcuts, invalid random questions.
- **Interfaces:** typed attempts for numbers to 100, place value, operations/bonds, grouping/sharing, 2/5/10 foundations, fractions, measure/time/money, shape/position.
- **Steps:** write outcome and boundary tests; implement worked examples and activities using reusable SLC-007 renderers; add prerequisite and misconception fallback; property-test generated cases against exact answers; run offline E2E; commit.
- **Evidence:** `npm exec playwright test tests/e2e/maths/year-one.spec.ts && npm exec vitest run tests/unit/learning-engine/maths.property.test.ts`; expected pass.
- **Edge/failure:** regrouping boundary, missing number, half/quarter non-divisible fixture, coin combination and clock rollover remain within declared rules.
- **Security/migration:** no new data boundary; template versions immutable.
- **Observability:** existing maths fields.
- **Deployment/rollback:** preview; unregister Year 1 plans on rollback.
- **Recovery trigger:** Year 1 curriculum/template/renderer change.

### SLC-007-T004 — Prove adaptive maths mastery end to end

- **Requirements / acceptance:** FR-MATH-03…07; AC-SLC-007-004.
- **Allowed scope:** scheduler integration, reporting projection, E2E/regression tests.
- **Forbidden scope:** parent dashboard UI, mastery shortcut, reward changes.
- **Interfaces:** consumes all SLC-007 contracts; produces maths strand projection for SLC-008.
- **Steps:** write concrete→pictorial→abstract journey with planned misconceptions/delayed recall; integrate subject balance and parent-permitted manual choice; verify modality changes and no speed penalty; test restart/offline; run full English+maths engine regression; commit.
- **Evidence:** `npm exec playwright test tests/e2e/maths/representations-and-retention.spec.ts && npm exec vitest run tests/unit/learning-engine`; expected pass with English projections unchanged.
- **Edge/failure:** high weak backlog, maths disabled, manual subject selection and late event preserve deterministic scheduling.
- **Security/migration:** existing local/Convex authority only.
- **Observability:** maths projection reason and retention evidence.
- **Deployment/rollback:** preview; disable maths activity registration without deleting events.
- **Recovery trigger:** subject-balance, mastery, scheduler or reporting projection change.
