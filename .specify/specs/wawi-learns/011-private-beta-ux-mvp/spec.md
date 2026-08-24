# SLC-011 — Private-beta UX MVP

## Goal

Deliver one authenticated five-activity learner loop for a private beta without
claiming completion of the full V1 curriculum, offline-first, or adaptive-core
acceptance criteria.

## Acceptance

- The public entry and unauthenticated bundle contain no child profile data.
- A verified parent can create exactly one child profile and start the learner.
- The fixed `cat`, `sun`, `sit`, `sat`, `can` journey is usable with calm feedback.
- Attempts are durable locally before advancement and reconcile idempotently.
- A connectivity loss after session start does not interrupt the open session.
- Production release occurs only after the existing repository is private and
  the hosted Convex, Resend, GitHub, and Vercel receipts match the reviewed SHA.

## Non-goals

No full offline-first launch, 20-word daily curriculum, mastery projection,
parent dashboard, reward world, content-pack acceptance, or V1 release credit.
