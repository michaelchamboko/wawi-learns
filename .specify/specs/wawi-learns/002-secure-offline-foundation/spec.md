# SLC-002 — Secure offline foundation specification

**Requirements:** PRD-FR-003, PRD-FR-022, PRD-FR-023, PRD-FR-029, PRD-FR-030, PRD-NFR-003, PRD-NFR-004, PRD-NFR-005
**Depends on:** SLC-001

## Vertical scope

Deliver the first real user journey: the parent authenticates, passes the parent gate, creates Malachi's sole profile, completes or skips a versioned assessment, downloads a valid essential pack, then the authorised installation reopens child mode offline while every parent-sensitive surface stays locked.

## Acceptance criteria

- **AC-SLC-002-001:** Strict TypeScript/npm-workspace foundation builds and CI runs every PRD §42.2 baseline check.
- **AC-SLC-002-002:** Convex enforces authenticated ownership, one learner per parent, recent verification for sensitive actions and no public internal/admin mutation.
- **AC-SLC-002-003:** IndexedDB durably stores attempts/settings/outbox; a complete hashed pack activates atomically while corrupt/interrupted packs leave the prior pack active.
- **AC-SLC-002-004:** Onboarding supports parent estimate, adaptive assessment, skip/restart history, baseline-incomplete states and default 20-word target.
- **AC-SLC-002-005:** A previously authorised installation opens child mode offline; parent mode remains unavailable except the narrow permission-reducing safety lockout.

## Non-goals

No full curriculum inventory, mastery logic, finished learner activities, multiple children, runtime CMS, AI generation or production release.
