# Validation Spikes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire every architecture-blocking uncertainty with reproducible evidence before building the product.

**Architecture:** Use the smallest executable probes that cross the actual browser, Vercel and Convex boundaries. Each probe ends in one ADR; failed candidates are discarded, and only the selected contract is consumed downstream.

**Tech Stack:** Node.js 24.x, npm workspaces, Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2, Convex 1.43.0, Serwist 9.5.12, Playwright 1.62.1.

## Global Constraints

- Canonical GitHub repository: `https://github.com/michaelchamboko/wawi-learns.git`; canonical Vercel project: `wawi-learns`; root: `.`; production branch: `main`.
- Supported release matrix: Android 13–17 with Chrome stable and the two preceding stable majors.
- Convex remains the sole child-data/provider authority; no production child data enters spike fixtures.
- Raw child audio is never stored. Synthetic audio and synthetic learner data only.
- Any candidate without authoritative documentation or an acceptable licence/privacy result is rejected.
- Do not add Turborepo, a second backend, a generic provider plugin system or other speculative machinery.

---

## Architecture and interfaces

Observed code architecture is empty. This slice proposes only decision outputs under `docs/decisions/` and executable evidence under `tests/e2e/spikes/` and `tests/integration/spikes/`. Later slices consume the ADR decisions, not spike internals.

- Produces `proposed:docs/decisions/ADR-001-identity-provider.md:IdentityDecision -> AcceptedProvider`
- Produces `proposed:docs/decisions/ADR-002-local-sync.md:SyncDecision -> SyncContract`
- Produces `proposed:docs/decisions/ADR-003-speech-and-tts.md:SpeechDecision -> ProviderPolicy`
- Produces `proposed:docs/decisions/ADR-004-tracing-renderer.md:TracingDecision -> RendererContract`
- Produces `proposed:docs/decisions/ADR-005-ai-and-safety-providers.md:AiDecision -> ProviderPolicy`
- Produces `proposed:docs/decisions/ADR-006-content-licensing.md:LicensingDecision -> ApprovedSources`
- Produces `proposed:docs/decisions/ADR-007-offline-packaging.md:PackDecision -> PackagingContract`

## Data, security and delivery

Only synthetic fixtures may leave the browser. Provider probes redact payloads and assert no logging/training retention setting is enabled. Vercel preview probes target project `wawi-learns`; no production promotion occurs. There is no migration. Rollback is deletion of unselected probe code and reversion of the task commit.

## Documentation evidence

Use the official fallback entries in `../000-spec-of-specs/codegraph.md`. Re-resolve registry versions before installing; a version change requires a dated ADR amendment and a repeat of the affected probe.

## Ordered implementation

1. Bind the empty remote, toolchain and Vercel project, then prove a production-mode local build.
2. Prove installability, offline launch and atomic service-worker update behavior.
3. Prove append-only IndexedDB-to-Convex reconciliation and offline authorisation boundary.
4. Benchmark identity, speech/TTS and tracing candidates against explicit matrices.
5. Benchmark AI/safety, licensing and pack options; publish the seven decision records.

## Slice verification

Run `npm exec playwright test tests/e2e/spikes/platform-baseline.spec.ts` and `npm exec vitest run tests/integration/spikes`. Expected: all pass, every ADR has status `accepted`, and no later slice is marked `BLOCKED`.
