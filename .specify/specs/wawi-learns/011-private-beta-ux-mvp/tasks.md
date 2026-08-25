# Tasks: SLC-011 Private-beta UX MVP

## SLC-011-T001 — Public build and privacy boundary baseline

- Depends on fresh `SLC-001-T001` evidence.
- Verify the existing GitHub repository is public, GitHub-hosted Actions can run,
  and the existing Vercel project retains access.
- Verify public routes and bundles contain no child profile data.

## SLC-011-T002 — Parent authority and connected-first persistence

- Configure Convex Auth password, verification, reset, sole-child profile, installation ownership, and idempotent attempt ingestion.
- Verify local durable write, duplicate acknowledgement, sequence-gap handling, and reconnect sync.

## SLC-011-T003 — Five-word private-beta pack

- Ship project-original, hashed `cat`, `sun`, `sit`, `sat`, and `can` SVG assets with licence metadata.
- Verify asset responses and content metadata; do not claim full content-pack acceptance.

## SLC-011-T004 — Child home and learner journey

- Build the calm storybook-trail home and the fixed five-activity renderer.
- Verify one clear primary action, speaker/hint/pause controls, neutral retry feedback, touch targets, and reduced motion.

## SLC-011-T005 — Hosted vertical-slice verification

- Verify preview then production against the reviewed `main` SHA, including authentication, email delivery, asset availability, outbox reconciliation, and rollback evidence.
