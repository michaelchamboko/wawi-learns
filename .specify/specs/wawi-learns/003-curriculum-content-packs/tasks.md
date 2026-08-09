# Tasks: SLC-003 Curriculum and Content Packs

**Assumptions:** Educational/content review is performed by the named product owner or delegated qualified reviewer and recorded per record.
**Unresolved decisions:** Exact GPC ordering and full-pack partition are outputs governed by ADR-006/007 and must stay within PRD constraints.

## Execution protocol

Run tasks in order. Each content task includes both source additions and the tests proving threshold, review, licence and correctness; do not commit a content dump that cannot pass validation. Use human commit trailers and scoped staging.

### SLC-003-T001 — Implement schemas, importer and validators

- **Requirements / acceptance:** PRD-FR-001, PRD-FR-002, PRD-FR-027, PRD-NFR-008; AC-SLC-003-001.
- **Allowed scope:** `packages/content-schema`, `packages/validation`, `scripts/content`, content fixtures/tests.
- **Forbidden scope:** runtime authoring API/UI, production content inventory, AI validator authority.
- **Interfaces:** implements `ContentPackManifestSchema`, `validateContentRepository`, typed word/sentence/story/maths/asset schemas.
- **Steps:** write invalid-record/path/answer/licence/US-spelling tests; confirm failure; define versioned discriminated schemas; implement deterministic import/canonicalise/validate CLI; add decodability and answer-key hooks; reject symlink/path escape; rerun and commit.
- **Evidence:** `npm exec vitest run tests/content/schema.test.ts tests/content/validators.test.ts`; expected all invalid fixtures rejected with stable reason codes.
- **Edge/failure:** duplicate canonical spelling, heterophone, absent optional-vs-required asset, invalid licence, colour-only instruction and unknown schema version block affected item/pack.
- **Security/migration:** untrusted source is data; no executable imports; new schema version is additive and old packs remain readable.
- **Observability:** CI report counts by validator/reason and emits no child data.
- **Deployment/rollback:** build-time only; revert commit and keep previous validator/version active.
- **Recovery trigger:** schema, curriculum authority, validator or package-version change.

### SLC-003-T002 — Build curriculum, phonics and word core

- **Requirements / acceptance:** PRD-FR-001, PRD-FR-002; AC-SLC-003-002.
- **Allowed scope:** curriculum/GPC/word/audio source records, reviewed feedback phrases and parent-assisted templates, inventory tests.
- **Forbidden scope:** AI-generated records without human promotion, proprietary programme copying, invented licence.
- **Interfaces:** produces `CurriculumVersion`, `CurriculumRules`, `WordRecord`, `GpcRecord` consumed by SLC-004.
- **Steps:** write exact-threshold and curriculum-version tests; confirm short fixture fails; add source/version/reviewer/licence registry; import and review complete GPC sequence and ≥2,000 words including ≥800 illustrated concrete/action items; add reviewed isolated phoneme audio and ≥50 feedback/≥20 assisted templates; run validators; commit source plus evidence.
- **Evidence:** `npm exec vitest run tests/content/english-inventory.test.ts`; expected exact counts at or above PRD minima and zero validation failures.
- **Edge/failure:** US variant, undecidable pronunciation, missing review, unsupported GPC, duplicate source or licence incompatibility excludes item and fails threshold.
- **Security/migration:** no personal data; curriculum versions immutable. New source version creates a new pack candidate.
- **Observability:** inventory report records counts/digests/reviewer coverage.
- **Deployment/rollback:** not published until T005; revert task or withdraw candidate version.
- **Recovery trigger:** DfE source, GPC ordering, record or licence change.

### SLC-003-T003 — Build reading and media core

- **Requirements / acceptance:** PRD-FR-002, PRD-FR-019; AC-SLC-003-003.
- **Allowed scope:** sentence/story/image/audio/tracing sources and tests.
- **Forbidden scope:** personalised content, unapproved AI output, unlicensed media.
- **Interfaces:** produces `SentenceRecord`, `StoryRecord`, `AssetRecord`, `FormationPath` consumed by SLC-004/005/006.
- **Steps:** write threshold/decodability/key/asset tests; add ≥400 reviewed phrases/sentences and ≥60 levelled stories with questions/answers; attach reviewed audio/images/tracing formations and full provenance; test greyscale recognition metadata and formation completeness; run full content suite; commit.
- **Evidence:** `npm exec vitest run tests/content/reading-media-inventory.test.ts`; expected threshold/review/licence/decodability/answer/asset checks pass.
- **Edge/failure:** out-of-band word, missing answer, ambiguous image, bad phoneme clip, incomplete formation or attribution omission blocks publication.
- **Security/migration:** static public core assets only; no private overlay item. Version changes are immutable.
- **Observability:** validation report by media type and failure reason.
- **Deployment/rollback:** candidate only; remove failing candidate or retain prior asset version.
- **Recovery trigger:** source, asset, validator, curriculum or licence change.

### SLC-003-T004 — Build mathematics core

- **Requirements / acceptance:** PRD-FR-002, PRD-FR-016; AC-SLC-003-004.
- **Allowed scope:** maths curriculum/template/manipulative/diagram sources and tests.
- **Forbidden scope:** unsafe unconstrained randomness, timed pressure, Year 2 scope.
- **Interfaces:** produces `MathsTemplate`, `MathsSkill`, `MisconceptionTag` consumed by SLC-007.
- **Steps:** write strand/threshold/property tests; add ≥40 templates covering every Reception/Year 1 outcome and CPA representation; implement seeded generators with exact answer/hint/misconception rules; add licensed manipulatives/diagrams; property-test allowed ranges and answer truth; commit.
- **Evidence:** `npm exec vitest run tests/content/maths-inventory.test.ts`; expected every strand covered and 10,000 seeded cases valid per template family.
- **Edge/failure:** invalid range, division remainder outside rule, ambiguous shape, impossible coin/time representation or language excess rejects generated item.
- **Security/migration:** no personal data; immutable template versions.
- **Observability:** generator seed/template/version included in validation failure only.
- **Deployment/rollback:** candidate only; revert invalid templates and rebuild.
- **Recovery trigger:** curriculum, template, answer logic or asset change.

### SLC-003-T005 — Build and publish immutable packs

- **Requirements / acceptance:** PRD-FR-001, PRD-FR-002, PRD-FR-019, PRD-FR-027, PRD-NFR-008; AC-SLC-003-005.
- **Allowed scope:** pack builder/verifier, generated `public/content/<version>`, metadata function, install/withdrawal tests.
- **Forbidden scope:** private overlays, mutable `latest` content without digest, production publish before review.
- **Interfaces:** implements `buildPacks(...) -> PackBuildResult`; consumes `activateValidatedPack`.
- **Steps:** write reproducibility/corruption/compatibility/interruption tests; build essential 14-day and full packs by canonical sort/serialization; hash every file and manifest; verify declared curriculum/engine compatibility; install in browser and interrupt update; add Convex withdrawal metadata; rerun twice and compare digests; commit sources/manifests, not transient caches.
- **Evidence:** `npm run test:content && npm exec vitest run tests/integration/content/pack-build.test.ts && npm exec playwright test tests/e2e/content/core-pack-install.spec.ts`; expected identical digests and safe prior-pack retention.
- **Edge/failure:** missing file, hash mismatch, insufficient 14-day variety, incompatible versions, withdrawal or cache quota fails closed.
- **Security/migration:** only reviewed shared assets public; symlink/path escape rejected. New pack version migrates by side-by-side activation.
- **Observability:** `pack_build`, `pack_verify`, `pack_withdrawal_applied` with version/digest/reason.
- **Deployment/rollback:** preview publication first; production later in SLC-010. Rollback repoints approved manifest to previous immutable pack and records withdrawal.
- **Recovery trigger:** any source, validator, pack-builder, compatibility or withdrawal change.
