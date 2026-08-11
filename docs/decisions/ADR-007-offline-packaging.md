# ADR-007 — Offline packaging and service-worker update contract

- **Status:** accepted
- **Owner slice:** SLC-001-T002
- **Acceptance:** AC-SLC-001-002
- **Supersedes:** none

## Decision

Wawi Learns ships as a single Next.js 16.3.0 progressive web app with a
Serwist 9.5.12 service worker that follows an **atomic shell-update contract**:

1. The install shell precaches only the public shell (`/`, `/offline`, generated
   assets referenced by `__SW_MANIFEST`, and the manifest icons). Runtime caching
   is an explicit allow-list and nothing else: same-origin `/_next/static/*`
   (`CacheFirst`, bounded `shell-static`) and `/icons/*` (`CacheFirst`, bounded
   `shell-icons`). Every other request — navigation documents, `/api/*`, Convex
   traffic, RSC/data payloads, and all cross-origin requests — is `NetworkOnly`
   and can never enter a cache. Private and authenticated responses are therefore
   never precached and never enter runtime caches by construction.
2. `skipWaiting` is **opt-in via message**. The default lifecycle keeps the
   previously installed worker controlling open tabs. Serwist accepts a
   `SKIP_WAITING` message only from a future update-control UI after the user
   accepts a controlled update; this spike proves that handoff without adding
   product update UI. An interrupted activation therefore never strands a child
   mid-session on the wrong shell.
3. Navigation fallbacks route document requests that fail the network to
   `/offline` via `Serwist.fallbacks`. `clientsClaim: true` ensures a freshly
   activated worker takes control on next navigation.
4. Cache-version changes are additive. The shell revision is the build's
   `NEXT_PUBLIC_GIT_SHA` (with `development` only as a local fallback), supplied
   through `next.config.ts` `additionalPrecacheEntries`. Each release therefore
   creates a deterministic new revision and invalidates the prior cache namespace
   between sessions, not mid-session.

## Recovery semantics

- On any supported Chrome update, Serwist/Next pin change, or manifest change
  the spike evidence is invalidated and `SLC-001-T002` is reopened via
  `action=reopen`.
- Rollback clears the new cache namespace on the next controlled activation and
  points Vercel preview at the previous immutable deployment.

## Rejected alternatives

- `skipWaiting: true` at install time — rejected because interrupted updates
  would strand the previous shell controlling open tabs.
- Caching `runtimeCaching` rules for `/api/*` — rejected because private
  overlays must never enter the shell cache.
- Serwist's `defaultCache` runtime policy — rejected because its broad
  same-origin `others` catch-all, GET `/api/*` `NetworkFirst`, and
  `cross-origin` `NetworkFirst` rules could cache private or authenticated
  responses, contradicting the never-cache contract above.
