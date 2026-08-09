# SLC-010 — Private beta production release specification

**Requirements:** PRD-FR-030, PRD-FR-032, PRD-NFR-001…008; PRD AC-01…36
**Depends on:** SLC-009

## Vertical scope

Convert all prior evidence into a fail-closed release decision, finish human curriculum/privacy/accessibility/usability approvals, connect the approved GitHub `main` commit to Vercel `wawi-learns` and Convex production, then verify production and rollback before installing the PWA on Malachi's authorised browser.

## Acceptance criteria

- **AC-SLC-010-001:** A machine-readable release matrix maps PRD AC-01…36 to fresh passing evidence and blocks any missing/stale item.
- **AC-SLC-010-002:** Product owner, curriculum reviewer, privacy/safety reviewer and supervised usability reviewer approve their named gates with no unresolved Critical/Important finding.
- **AC-SLC-010-003:** Reviewed direct-`main` candidates require the PRD §42.2 checks, artifact-bound technical gate, and exact-SHA GitHub/Vercel receipts; Vercel Git integration targets existing project `wawi-learns` and Convex uses controlled environment-specific deployment.
- **AC-SLC-010-004:** The exact reviewed commit/deployment IDs, app/engine/curriculum/content/prompt/speech versions and production smoke are recorded and visible.
- **AC-SLC-010-005:** Rollback restores the previous safe deployment/Convex compatibility without data loss; final human approval moves the ledger to `RELEASE_READY`.

## Non-goals

No release with partial P0 evidence, preview called production, direct push around the review/check gate, unreviewed generated content, production data in tests or post-Version 1 feature.
