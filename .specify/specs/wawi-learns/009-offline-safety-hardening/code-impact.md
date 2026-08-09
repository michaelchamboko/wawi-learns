# SLC-009 code impact

## Consumes

Every prior slice. Changes are limited to defects revealed by hardening; interface changes reopen the owning slice.

## Creates/modifies

- Version pin/reconciliation/telemetry sanitisation modules.
- CSP/security/scanning and complete regression workflows.
- Accessibility, performance, offline, device-matrix and rollback tests/evidence scripts.
- Minimal focused fixes in prior modules when a failing test proves them necessary.

## Regression paths

Interrupted/corrupt update, mixed versions, offline close/reopen, repeated/out-of-order sync, gap/clock skew, consent/delete/withdrawal, stale device, quota/persistence loss, orientation/backgrounding, reduced modes, provider failure, secret/static-private leak, supported device/Chrome combinations and rollback.

## Test coverage map

| Acceptance | Evidence |
|---|---|
| AC-SLC-009-001 | `tests/e2e/offline/version-activation.spec.ts` |
| AC-SLC-009-002 | `tests/e2e/offline/reconciliation.spec.ts` |
| AC-SLC-009-003 | `tests/e2e/accessibility/child-parent.spec.ts`, audit report |
| AC-SLC-009-004 | `npm run verify:quality` |
| AC-SLC-009-005 | `npm run verify:matrix`, physical-device evidence |
