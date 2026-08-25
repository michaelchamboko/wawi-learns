# Wawi Learns planning decisions

| ID | Decision | Rationale and authority |
|---|---|---|
| DEC-001 | Version 1 retains the full English, maths, adaptive, speech, handwriting, AI, reward, parent and offline scope. | Approved PRD §§1, 3 and 44. |
| DEC-002 | `Wawi Learns PRD.md` is the sole product-requirement authority; the plan may resolve implementation choices but may not reduce mandatory scope. | PRD status and this planning request. |
| DEC-003 | The product is a single installable Next.js PWA, not separate child games or native apps. | PRD §§7, 33 and 50. |
| DEC-004 | Convex is the sole backend authority; Vercel serves the application and shared static core assets only. | PRD §§33.4–33.5. |
| DEC-005 | The account model is one authenticated parent and exactly one direct-opening learner profile for Malachi. | PRD §3 and FR-AUTH-01…04. |
| DEC-006 | Core learning is local-first; append-only attempt events reconcile to Convex without arrival-order effects. | PRD §32. |
| DEC-007 | The deterministic engine alone selects objectives, scheduling and mastery. AI is constrained, server-side, validated and optional. | PRD §§16 and 28. |
| DEC-008 | Raw voice and child stroke data are never server-retained by default; voice processing is ephemeral. | PRD §§23.6 and 25.5. |
| DEC-009 | Generated child content is revision-specific and cannot be shown until applicable validation and parent approval pass. | PRD §§27–28. |
| DEC-010 | Use npm workspaces with the PRD package boundaries; do not add Turborepo or another orchestration framework until measured build scale requires it. | Karpathy simplicity rule; Vercel root is `.`. |
| DEC-011 | Baseline implementation pins Node 24.x, Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, Convex 1.43.0, Serwist 9.5.12, idb 8.0.3, Zod 4.4.3, Vitest 4.1.10, Playwright 1.62.1 and fast-check 4.9.0. | Live registry resolution on 2026-08-08; SLC-001 must prove compatibility before the pin is frozen. |
| DEC-012 | GitHub `michaelchamboko/wawi-learns` and Vercel project `wawi-learns` are canonical; production branch is `main` and project root is `.`. | Live project inspection on 2026-08-08 and user direction. |
| DEC-013 | Delivery uses one active implementation task, one review gate per task, one human approval per slice and a final release gate. | spec-kit PRD extension 1.1 orchestration contract. |
| DEC-014 | The root PRD remains the single source copy instead of duplicating it under `.specify`. | Explicit plans-only and repository-cleanliness constraint. |
| DEC-015 | Add a continuous Spark execution governance mode (PRD-NFR-009, AC-37): one ACTIVE packet and up to two READY packets, no manual packet waiting, one `gpt-5.5` review point per release cohort, and cohort-only push/deploy. | This supersedes DEC-013 review/push cadence only during product-owner-authorised continuous cohort mode; DEC-013 remains the outside-default. |

## Decisions owned by SLC-001 evidence

These are bounded spike outputs, not open product questions. Each has a named decision record and a pass/fail selection rubric in `001-validation-spikes/tasks.md`:

- `ADR-001-identity-provider.md`
- `ADR-002-local-sync.md`
- `ADR-003-speech-and-tts.md`
- `ADR-004-tracing-renderer.md`
- `ADR-005-ai-and-safety-providers.md`
- `ADR-006-content-licensing.md`
- `ADR-007-offline-packaging.md`

No later slice may start while any required ADR is absent or records `no acceptable candidate`.
