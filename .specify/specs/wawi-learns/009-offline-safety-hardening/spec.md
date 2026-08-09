# SLC-009 — Offline, safety and release hardening specification

**Requirements:** PRD-FR-022, PRD-FR-024, PRD-FR-025, PRD-FR-026, PRD-FR-031, PRD-NFR-001…008
**Depends on:** SLC-008

## Vertical scope

Harden the complete application under network loss, interrupted updates, stale installations, consent/deletion/withdrawal, accessibility settings, performance budgets, security controls, privacy-preserving observability and the full supported Android/Chrome matrix.

## Acceptance criteria

- **AC-SLC-009-001:** App shell, core pack, private overlay and engine/curriculum versions activate atomically between sessions; interruption/corruption cannot mix or displace valid state.
- **AC-SLC-009-002:** Repeated/out-of-order sync, sequence gaps, clock skew, deletion and withdrawal reconcile without loss, duplication, false retention credit or stale restoration/display.
- **AC-SLC-009-003:** Child touch/voice/caption/contrast/motion/focus/hand/error-tolerance and parent WCAG 2.2 AA requirements pass audited tests.
- **AC-SLC-009-004:** Performance, crash-free target instrumentation, CSP, authorisation, secret/dependency scanning, privacy-minimised logs, battery/data and pack integrity gates pass.
- **AC-SLC-009-005:** Android 13–17 × Chrome stable/previous-two automated matrix and required physical phone/tablet evidence pass every mandated install/offline/update/audio journey.

## Non-goals

No feature expansion, unsupported-browser release claim, production child-data copy into test, weakening of gates to achieve green CI or manual pass without recorded device evidence.
