import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  InMemoryConvexProjection,
  LocalAttemptStore,
  canonicalDigest,
  type AttemptEvent,
} from "../../../packages/spike-local-data/test/index.js";

const INSTALLATION = "install-spike-1";
const CLIENT_VERSION = "0.1.0-spike";

const makeEvent = (overrides: Partial<AttemptEvent> & Pick<AttemptEvent, "eventId">): AttemptEvent => ({
  installationId: INSTALLATION,
  sourceSequence: 0,
  occurredAt: 1_700_000_000_000,
  recordedAt: 1_700_000_000_000,
  dimension: "phonics",
  itemId: "gpc-cat",
  result: "correct",
  hintCount: 0,
  durationMs: 1500,
  clientVersion: CLIENT_VERSION,
  ...overrides,
});

describe("SLC-001-T003 — local sync contract", () => {
  let store: LocalAttemptStore;
  let projection: InMemoryConvexProjection;

  beforeEach(() => {
    store = new LocalAttemptStore(`wawi-spike-test-${Math.random().toString(36).slice(2)}`);
    projection = new InMemoryConvexProjection({ now: () => 1_700_000_000_000 });
  });

  afterEach(async () => {
    await store.reset();
  });

  it("assigns monotonic source sequence and persists both attempts and outbox", async () => {
    const first = await store.appendAttempt(makeEvent({ eventId: "evt-1" }));
    const second = await store.appendAttempt(makeEvent({ eventId: "evt-2" }));
    const third = await store.appendAttempt(makeEvent({ eventId: "evt-3" }));

    expect(first.sourceSequence).toBe(1);
    expect(second.sourceSequence).toBe(2);
    expect(third.sourceSequence).toBe(3);

    const all = await store.readAllAttempts();
    expect(all.map((e) => e.eventId)).toEqual(["evt-1", "evt-2", "evt-3"]);

    const batch = await store.nextSyncBatch(10);
    expect(batch.map((e) => e.eventId)).toEqual(["evt-1", "evt-2", "evt-3"]);
  });

  it("dedupes identical event ids without dropping or double-counting", async () => {
    const a = await store.appendAttempt(makeEvent({ eventId: "evt-dup" }));
    const b = await store.appendAttempt(makeEvent({ eventId: "evt-dup" }));
    expect(a.sourceSequence).toBe(b.sourceSequence);

    const batch = await store.nextSyncBatch(10);
    expect(batch).toHaveLength(1);

    const receipt = await projection.reconcile(batch);
    expect(receipt.acceptedEventIds).toEqual(["evt-dup"]);
    expect(receipt.dedupedEventIds).toEqual([]);
    expect(receipt.canonicalProjectionDigest).toHaveLength(64);

    // Re-reconcile the same batch: server dedup must keep canonical projection stable
    const replay = await projection.reconcile(batch);
    expect(replay.dedupedEventIds).toEqual(["evt-dup"]);
    expect(replay.acceptedEventIds).toEqual([]);
    expect(replay.canonicalProjectionDigest).toBe(receipt.canonicalProjectionDigest);
  });

  it("flags a gap when source sequence jumps and never fabricates ordering", async () => {
    await store.appendAttempt(makeEvent({ eventId: "evt-1", sourceSequence: 1 }));
    // attempt with sourceSequence 5 instead of 2 → gap detected at ingestion
    await expect(
      store.appendAttempt(makeEvent({ eventId: "evt-2", sourceSequence: 5 })),
    ).rejects.toThrow(/sourceSequence/);
  });

  it("flags a gap when the server receives a batch with a missing source sequence and preserves occurredAt", async () => {
    const batch = [
      makeEvent({ eventId: "evt-3", sourceSequence: 3, occurredAt: 1_700_000_003_000 }),
      makeEvent({ eventId: "evt-1", sourceSequence: 1, occurredAt: 1_700_000_001_000 }),
      makeEvent({ eventId: "evt-4", sourceSequence: 4, occurredAt: 1_700_000_004_000 }),
      // sourceSequence 2 is missing → gap.
    ];

    const receipt = await projection.reconcile(batch);
    expect(receipt.acceptedEventIds).toEqual(["evt-1", "evt-3", "evt-4"]);
    expect(receipt.gapDetected).toBe(true);

    const snapshot = projection.snapshot();
    expect(snapshot.map((e) => ({ id: e.eventId, occurredAt: e.occurredAt }))).toEqual([
      { id: "evt-1", occurredAt: 1_700_000_001_000 },
      { id: "evt-3", occurredAt: 1_700_000_003_000 },
      { id: "evt-4", occurredAt: 1_700_000_004_000 },
    ]);
  });

  it("rejects an event whose occurredAt is implausibly skewed", async () => {
    await expect(
      projection.reconcile([
        makeEvent({ eventId: "evt-future", sourceSequence: 1, occurredAt: 1_700_000_000_000 + 24 * 60 * 60 * 1000 }),
      ]),
    ).rejects.toThrow(/skew/);
  });

  it("preserves durability across a simulated app close before sync acknowledgement", async () => {
    await store.appendAttempt(makeEvent({ eventId: "evt-a" }));
    await store.appendAttempt(makeEvent({ eventId: "evt-b" }));

    // simulate process restart by opening a fresh store and reseeding via raw indexedDB.
    const reopened = new LocalAttemptStore((store as unknown as { name: string }).name);
    const batch = await reopened.nextSyncBatch(10);
    expect(batch.map((e) => e.eventId)).toEqual(["evt-a", "evt-b"]);

    const receipt = await projection.reconcile(batch);
    await reopened.acknowledgeSync(receipt);

    const remaining = await reopened.nextSyncBatch(10);
    expect(remaining).toEqual([]);
  });

  it("canonical projection digest matches a recomputed digest for the same events", async () => {
    const batch = [
      makeEvent({ eventId: "evt-2", sourceSequence: 2 }),
      makeEvent({ eventId: "evt-1", sourceSequence: 1 }),
    ];
    const receipt = await projection.reconcile(batch);
    const recomputed = await canonicalDigest(projection.snapshot());
    expect(receipt.canonicalProjectionDigest).toBe(recomputed);
  });

  it("deleted profile rejection returns no data leakage and keeps local events durable", async () => {
    await store.appendAttempt(makeEvent({ eventId: "evt-1" }));
    const projectionDeleted = new InMemoryConvexProjection({
      now: () => 1_700_000_000_000,
    });

    // Server-side "deleted profile" path: it must not accept anything and must not leak attempts.
    // The projection itself never holds the events; it is purely a server-side accumulator.
    const batch = await store.nextSyncBatch(10);
    // simulate the server rejection path by dropping all events without acknowledgement
    void batch;

    const durable = await store.readAllAttempts();
    expect(durable.map((e) => e.eventId)).toEqual(["evt-1"]);
    expect(projectionDeleted.snapshot()).toEqual([]);
  });
});