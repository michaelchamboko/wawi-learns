# Wawi Learns Version 1 delivery roadmap

## Delivery rule

The frozen directory order follows PRD §46. Business priority and execution priority are recorded separately, but execution is dependency-gated and one task at a time. Every slice must produce a working, reviewable increment, pass its declared journey, and receive human approval before the next slice starts.

## Slice sequence

| Order | Slice | Working increment | Dependencies | Primary requirements | Exit journey |
|---:|---|---|---|---|---|
| 1 | SLC-001 Validation spikes | Evidence-backed platform/provider/licensing choices and a proven skeleton path with no unresolved release-blocking spike. | — | PRD-FR-023, 028, 030; PRD-NFR-001, 004 | `npm exec playwright test tests/e2e/spikes/platform-baseline.spec.ts` |
| 2 | SLC-002 Secure offline foundation | Parent can authenticate, create the sole learner profile, download/activate a valid pack and reopen authorised child mode offline. | SLC-001 | PRD-FR-003, 022, 023, 029, 030 | `npm exec playwright test tests/e2e/onboarding/offline-first-run.spec.ts` |
| 3 | SLC-003 Curriculum and content packs | A validated, versioned Reception/Year 1 core pack builds reproducibly and rejects incorrect or unlicensed content. | SLC-002 | PRD-FR-001, 002, 019, 027; PRD-NFR-008 | `npm exec playwright test tests/e2e/content/core-pack-install.spec.ts` |
| 4 | SLC-004 Adaptive learner core | Malachi can complete a deterministic mixed English lesson; attempts survive restart; weak items change modality; dimension mastery and daily status are correct. | SLC-003 | PRD-FR-004…010 | `npm exec playwright test tests/e2e/learner/adaptive-english-journey.spec.ts` |
| 5 | SLC-005 Handwriting, spelling and speech | A lesson rotates through tiles, tracing, TTS and consented speech, degrades offline/denied, and never stores raw audio. | SLC-004 | PRD-FR-012…015 | `npm exec playwright test tests/e2e/learner/multimodal-language.spec.ts` |
| 6 | SLC-006 Reading, stories and governed AI | Curated reading works offline; generated revisions remain blocked until validated/approved and are served only through the private overlay. | SLC-005 | PRD-FR-011, 017, 018, 019 | `npm exec playwright test tests/e2e/stories/approved-overlay.spec.ts` |
| 7 | SLC-007 Mathematics mastery | Malachi completes Reception and Year 1 representative maths journeys across concrete, pictorial and abstract forms with misconception recovery. | SLC-006 | PRD-FR-016 | `npm exec playwright test tests/e2e/maths/representations-and-retention.spec.ts` |
| 8 | SLC-008 Rewards and parent operations | Rewards never regress on error; parent sees evidence, overrides safely, manages custom content/consent and completes verified export/deletion. | SLC-007 | PRD-FR-020, 021, 026 | `npm exec playwright test tests/e2e/parent/dashboard-controls-data-rights.spec.ts` |
| 9 | SLC-009 Offline, privacy and release hardening | Full offline/reconnect/deletion/withdrawal, accessibility, security, performance and Android/Chrome matrix gates pass. | SLC-008 | PRD-FR-022, 024, 025, 026, 031; all NFRs | `npm exec playwright test tests/e2e/offline/full-release-journey.spec.ts` |
| 10 | SLC-010 Private beta production release | All AC-01…36 evidence is approved; the exact tested commit is deployed to Vercel `wawi-learns` with Convex production and rollback proof. | SLC-009 | PRD-FR-030, 032; all NFRs | `npm run release:verify` |

## Critical path

`SLC-001 → SLC-002 → SLC-003 → SLC-004 → SLC-005 → SLC-006 → SLC-007 → SLC-008 → SLC-009 → SLC-010`

## Private-beta MVP lane

`SLC-011` is a product-owner-approved validation-only lane. It becomes eligible
after fresh `SLC-001-T001` evidence, runs before the remaining V1 sequence, and
does not close or waive any SLC-002 through SLC-010 acceptance criteria.

No downstream slice may substitute mocks for an upstream production contract at its exit gate. Within a task, independent test fixtures may be created in the same commit; separate setup-only tasks are forbidden.

## Business priority

1. Safe retained learning and offline continuity: SLC-004, SLC-002, SLC-003.
2. Full English modalities and safe reading: SLC-005, SLC-006.
3. Mathematics: SLC-007.
4. Parent evidence, control and motivation: SLC-008.
5. Release assurance: SLC-009, SLC-010.
6. SLC-001 is execution-first only because it retires risks that would invalidate every later plan.

## Shared acceptance boundaries

- `AttemptEvent` is immutable and idempotent; only SLC-002 owns its storage contract.
- `CurriculumRules` and published content are versioned; only SLC-003 owns their schemas and build-time publication.
- `selectNextActivity` and mastery projections remain pure and deterministic; only SLC-004 changes educational decisions.
- Speech, TTS and tracing return evidence; they never directly mutate mastery.
- Generated content never changes curriculum or learning decisions and never bypasses Convex authorisation, validation or revision approval.
- Vercel contains the PWA and shared static core assets only; private overlays and all child authority remain in Convex.

## Non-goals

All PRD §7 exclusions remain binding. The plan adds no native apps, runtime CMS, multi-child flow, teacher role, unrestricted child AI, social features, ads, purchases, diagnosis, raw-media retention, extra curriculum or speculative framework.
