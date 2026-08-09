# Offline, Safety and Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the complete Version 1 application remains safe, usable, performant and internally consistent throughout the supported release matrix and worst operational transitions.

**Architecture:** Harden existing boundaries rather than add systems. One session pins shell/engine/curriculum/core-pack/overlay versions; one reconciliation engine handles retries/order/gaps; one privacy-filtered telemetry adapter emits only approved operational events.

**Tech Stack:** Existing app stack, Playwright 1.62.1, Vitest 4.1.10, browser/device labs selected in SLC-001, GitHub security actions and Vercel preview.

## Global Constraints

- No mandatory child activity or evidence commit depends on network after valid setup.
- Parent-sensitive actions remain online/recently verified; offline exception only reduces microphone consent.
- Safety withdrawal/deletion overrides normal between-session activation and prevents affected display immediately/at next authenticated sync.
- Logs exclude raw audio, stroke paths, child content/name/stable profile ID and unnecessary personal data.
- Performance gates are measured across the declared Android/Chrome matrix; physical evidence covers oldest/newest Android, phone/tablet.
- Any failed P0/NFR gate blocks SLC-010; no waiver by assertion.

---

## Interfaces and data flow

- Produces `proposed:packages/local-data/src/sessionVersion.ts:pinSessionVersions(input: AvailableVersions) -> SessionVersionSet`.
- Produces `proposed:packages/local-data/src/reconcile.ts:reconcileCanonicalState(input: ReconcileInput) -> Promise<ReconcileResult>`.
- Produces `proposed:packages/validation/src/telemetry.ts:sanitizeOperationalEvent(event: OperationalEvent) -> SanitizedOperationalEvent`.
- Consumes every prior public contract; changes require reopening the owning slice.

Startup validates shell/auth/core/overlay compatibility → pins versions → child session. Reconnect applies revocation/withdrawal first → evicts prohibited state → uploads immutable events → detects gaps → receives canonical projections/settings → activates compatible updates between sessions.

## Persistence, security and migration

Test upgrade paths for IndexedDB, Convex and pack/overlay schemas. All migrations are copy/validate/swap with rollback unless confirmed deletion. CSP and server authorisation apply at entry points; client bundles/history receive automated secret scans.

## Observability, deployment and rollback

Define allow-listed events and alerts for crash, sync, validation, provider, cost and pack failures. Preview soak precedes release. Rollback checks restore the previous Vercel deployment/worker and compatible Convex functions without mixing session versions or dropping events.

## Documentation evidence

Use official browser, Playwright, Vercel, Convex and platform sources in PRD/`codegraph.md`; capture actual Chrome majors at release execution, because “stable/previous two” is intentionally time-relative.

## Ordered implementation

1. Harden version pinning, pack/overlay updates and service-worker rollback.
2. Harden sync, deletion, consent and withdrawal reconciliation.
3. Complete accessibility and child-usability automation/audit fixes.
4. Enforce performance, security, observability, battery/data and integrity gates.
5. Run automated and physical supported-device matrix plus full cross-slice regression.

## Slice verification

Run `npm exec playwright test tests/e2e/offline/full-release-journey.spec.ts` and `npm run verify:matrix`. Expected: every automated matrix row passes and physical evidence records Android/Chrome/form factor/result for mandated devices.
