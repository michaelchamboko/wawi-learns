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
- The repository remains public until the complete V1 build and release checks
  pass so GitHub-hosted Actions can run without a paid account. Source, public
  routes, and browser bundles contain no secrets or private child state.
- The hosted Convex, Resend, GitHub, and Vercel receipts match the reviewed SHA.

## Non-goals

No full offline-first launch, 20-word daily curriculum, mastery projection,
parent dashboard, reward world, content-pack acceptance, or V1 release credit.
