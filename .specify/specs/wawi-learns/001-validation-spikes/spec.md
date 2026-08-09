# SLC-001 — Validation spikes specification

**Requirements:** PRD-FR-023, PRD-FR-028, PRD-FR-030, PRD-NFR-001, PRD-NFR-004
**Decisions:** DEC-003, DEC-004, DEC-010, DEC-011, DEC-012
**Depends on:** none

## Vertical scope

Turn every PRD §48 implementation uncertainty into a reproducible pass/fail decision before production architecture is committed. The slice also binds the empty private GitHub repository and existing Vercel project to the exact toolchain and delivery contract.

## Acceptance criteria

- **AC-SLC-001-001:** The local project can be initialised against `https://github.com/michaelchamboko/wawi-learns.git`, with `main` as the protected production branch and Vercel project `wawi-learns` rooted at `.`.
- **AC-SLC-001-002:** Next.js 16.3.0, React 19.2.8, TypeScript 7.0.2 and Node 24.x build a minimal installable PWA and pass a browser offline launch/update probe.
- **AC-SLC-001-003:** IndexedDB events round-trip through a Convex test deployment with event-id deduplication, source-sequence gap detection and occurrence-time preservation.
- **AC-SLC-001-004:** Identity, speech/TTS, tracing, AI/safety, content-licensing and pack-strategy ADRs name one acceptable choice or block later slices with measured evidence.
- **AC-SLC-001-005:** No spike chooses a dependency without licence, maintenance, security, bundle, supported-browser, offline, accessibility, privacy and replacement-cost review.

## Non-goals

No production learner UI, production content, provider purchase, final art theme or premature abstraction survives this slice. Throwaway spike code is removed unless it is promoted into a named production contract with tests.
