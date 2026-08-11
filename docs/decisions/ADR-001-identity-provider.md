# ADR-001 — Identity provider

- **Status:** accepted
- **Owner slice:** SLC-001-T004
- **Acceptance:** AC-SLC-001-004
- **Supersedes:** none

## Decision

V1 uses **Convex Auth (built-in)** as the sole parent identity provider. No
alternate IdP, social login, anonymous child identity or third-party OAuth is
configured.

### Spike boundary

- Parent sign-in uses the standard Convex Auth email + password flow with
  server-issued email verification. Magic-link and OAuth are explicitly
  disabled at the project configuration layer (no `oauth_providers` entries).
- Identity subject (`users._id`) is the only parent identifier that crosses
  any boundary; emails and verification tokens never appear in
  `AttemptEvent` payloads or analytics.
- `requireRecentVerification(ctx)` enforces a 10-minute freshness window for
  any parent-sensitive mutation (settings change, profile deletion, pack
  approval, story approval, custom pack draft). Re-verification is gated by
  password re-entry; no biometric fallback.
- Convex Auth's built-in session table drives `requireParent(ctx)` in
  `convex/lib/requireParent.ts`. No custom JWT layer is introduced.

### Benchmarks evaluated

| Candidate | Replacement cost | Bundle impact | Maintenance | Authoritative docs | Verdict |
|---|---|---|---|---|---|
| Convex Auth (built-in) | 1 sprint | None (server) | Convex-managed | [platform docs](https://docs.convex.dev/auth) | **selected** |
| Clerk | 1–2 sprints | ~80 KB (server is widget-only) | Vendor | Vendor docs | rejected (vendor account, third-party trust) |
| Auth0 | 2 sprints | N/A | Vendor | Vendor docs | rejected (pricing, second vendor relationship) |
| Supabase Auth | 2 sprints | None (server) | Active | Vendor docs | rejected (we are not using Postgres) |
| Custom NextAuth | 1 sprint | ~30 KB | Self-maintained | Community docs | rejected (in-scope security review) |

### Privacy and licence

- Convex Auth is part of the Convex platform licence already approved for the
  project; no new agreement is required.
- The provider stores no child identifiers; only parent emails and bcrypt-hashed
  passwords, both inside the private Convex deployment.

## Recovery semantics

- An auth schema change, recent-verification contract change or third-party
  breach reopens this task via `action=reopen`.

## Rejected alternatives

- **Clerk** — rejected because a vendor-managed user table requires a separate
  trust boundary and is harder to roll back if the vendor changes pricing.
- **Auth0** — rejected for the same reason plus a heavier configuration surface.
- **Custom NextAuth** — rejected because the security review for a custom
  password/email flow is in scope and Convex already implements that flow with
  the same primitives.