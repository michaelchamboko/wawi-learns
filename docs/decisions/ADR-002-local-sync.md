# ADR-002 — Local sync contract

- **Status:** accepted
- **Owner slice:** SLC-001-T003
- **Acceptance:** AC-SLC-001-003
- **Supersedes:** none

## Decision

Wawi Learns syncs learner evidence with a custom versioned IndexedDB outbox and a
server-side canonical projection. No candidate library (RxDB, PouchDB, electric-sql,
Replicache) is selected in V1.

### Spike boundary

- `appendAttempt(event: AttemptEvent): Promise<void>` is the only mutation entry
  point on the client. It assigns a monotonically increasing `sourceSequence`
  per `installationId`, persists to the local `attempts` store and the `outbox`
  store atomically in one IndexedDB transaction, and refuses duplicate `eventId`
  values without double-counting.
- `nextSyncBatch(limit: number): Promise<readonly AttemptEvent[]>` returns
  outbox entries ordered by `sourceSequence`.
- `acknowledgeSync(receipt: SyncReceipt)` removes accepted `eventId`s from the
  outbox in a single transaction.
- The Convex-side `reconcileAttempts(batch)` projects events into a server-side
  canonical store, deduplicates by `eventId`, detects source-sequence gaps,
  enforces an `occurredAt` skew bound (5 minutes), and returns a deterministic
  `SyncReceipt` whose `canonicalProjectionDigest` is the SHA-256 of the
  sorted canonical state.

### Why no library

- **RxDB / PouchDB / Replicache** add multi-megabyte bundle weight, async
  change-set protocols and conflict resolution that we do not need: V1 is
  append-only, never updates or deletes attempt rows client-side, and the
  authoritative mastery projection lives in the deterministic engine (SLC-004).
- **electric-sql / RxDB-lite** require server-shapes and Postgres/Convex
  adapters that do not exist in our stack.
- The custom path keeps the entire client surface visible in this repository,
  matches the PRD §32 immutability contract, and fits the AGENTS.md
  packages/local-data boundary.

### Durability and idempotency

- IndexedDB stores are versioned (`DB_VERSION = 1`) and migrations are additive.
  A failed migration must leave the prior DB readable.
- `sourceSequence` is assigned by the store, never accepted from the caller, so
  no gap is fabricated at ingestion. A later task may move assignment into the
  scheduler to keep transaction sizes bounded.
- Outbox ack is keyed on `eventId` and tolerates duplicate re-acks.

### Security and ownership

- The Convex function is owner-only; missing identity subject, deleted profile
  or stale revocation returns a typed denial and never leaks prior state.
- `occurredAt` skew is enforced server-side so a forged client cannot back-date
  mastery evidence.
- No raw audio, no child identifier beyond the opaque `installationId` is
  carried in this contract; payload redaction is enforced by the integration
  tests.

## Recovery semantics

- A Convex `idb` version bump, AttemptEvent schema change or conflict-rule
  change reopens this task via `action=reopen`.
- Rollback clears the spike adapter code while preserving the events already
  stored in IndexedDB and Convex.

## Rejected alternatives

- **RxDB with the Dexie storage adapter** — rejected because the V1 surface is
  a single append-only outbox; pulling RxDB in for one queue hides the contract
  and adds ~120 KB.
- **PouchDB / CouchDB replication** — rejected because it requires a separate
  replicated database and a second persistence boundary.
- **Convex-hosted reactive queries as the only client store** — rejected because
  PRD §32 requires offline-first child mode; reactive queries cannot serve a
  closed device.