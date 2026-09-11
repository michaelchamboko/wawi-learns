# Password recovery repair — 2026-09-11

Task: SLC-011-T002. Owner: @Builder (root). User authorizes restoring Forgot
password for registered email addresses and actionable authentication UX.

Production diagnosis: signup failed because the account already existed;
sign-in failed with InvalidSecret. Ordinary backend errors were masked by
Convex and the UI appended the unhelpful Server Error text.

The repair retains native Convex password hashing, code verification, credential
updates and session revocation. It adds an email-code recovery form, allowlisted
error messages, password confirmation, visibility control, accessible feedback,
and a mobile layout. Codes expire after 15 minutes. Missing-account reset
requests remain neutral; email-provider failures are never reported as sent.

The unauthenticated, hard-coded diagnostic deleteAccount mutation was removed.
No account data was deleted. Generated API bindings were regenerated.

## Verification

- Initial UI error regression: 4 failures, including the user's exact masked
  Server Error symptom. The revised expectations do not permit raw exception text.
- `npm run check`: PASS, 212 unit tests and 165 integration tests; lint has 19
  pre-existing warnings and no errors; TypeScript passes.
- `node node_modules/vitest/vitest.mjs run tests/unit/ui/parent-auth-errors.test.ts tests/unit/convex/password-recovery.test.ts tests/unit/repository-contract.test.ts`:
  PASS, 21 tests. Provider tests execute installed Password/Convex Auth and mock
  only the mutation and email-fetch boundaries.
- Production `next build --webpack`: PASS with the existing production Convex URL.
- Playwright `tests/e2e/learner/parent-password-recovery.spec.ts`: PASS, 2 tests
  against the local production build, with the external Convex WebSocket boundary
  simulated. Tests cover duplicate feedback, recovery submission, matching
  passwords, actual native reset parameter names, delivery failure and mobile width.
- Strict Convex `tsc --project convex/tsconfig.json --noEmit`: PASS.
- Convex production deployment dry-run with strict typecheck: PASS; no index
  deletion. Local codegen after diagnostic removal: PASS.
- GitNexus staged detection: low risk; 0 affected indexed processes. The index
  also lists shifted downstream page symbols; actual diff changes only ParentAuth.
- Independent auth specialist source review: PASS; native credential update and
  revocation preserved. Final cohort review and hosted receipts are separate gates.

## Delivery constraints

The user explicitly selected onboarding@resend.dev. Resend's documented test
sender restriction prevents delivery to arbitrary recipients; the app's Vercel
subdomain cannot be verified as an owned email-sending domain. A verified sender
is still required for unrestricted delivery. No provider secret is stored here.

The real orchestrator reopened SLC-011-T002, invalidated downstream evidence and
started @Builder. Existing PRD source-hash validation fails: manifest expects
e2eced5839b60fbd7047c8605fd03483464dc719f993353ea5846c17acf62257;
current source is cb4572a937fe6e4e9184446deb4be4b56a2b3bbd96b6a41f5d72de107cb685d3.
No hash, approval, or evidence state was falsified to hide this mismatch. This
repair does not certify the full product release or downstream tasks.

Rollback: revert the scoped repair commit and redeploy the compatible auth
configuration, preserving account records. Do not restore the unsafe diagnostic
deletion endpoint. Existing parent sign-in remains available during recovery setup.
