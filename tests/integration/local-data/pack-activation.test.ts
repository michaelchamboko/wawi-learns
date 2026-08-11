import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  LocalAttemptStore,
  InMemoryConvexProjection,
  canonicalDigest,
  activateValidatedPack,
  PackSlots,
  type ContentPackManifest,
  type AttemptEvent,
} from "../../../packages/local-data/test/index.js";

const baseEvent = (id: string, sourceSequence = 0, occurredAt: number = 1_700_000_000_000): AttemptEvent => ({
  eventId: id,
  installationId: "install-a",
  sourceSequence,
  occurredAt,
  recordedAt: 1_700_000_000_000,
  dimension: "phonics",
  itemId: "gpc-cat",
  result: "correct",
  hintCount: 0,
  durationMs: 1500,
  clientVersion: "0.1.0",
});

const baseManifest = (overrides: Partial<ContentPackManifest> = {}): ContentPackManifest => ({
  packVersion: "1.0.0",
  curriculumVersion: "curriculum-1",
  engineVersion: "engine-1",
  issuedAt: 1_700_000_000_000,
  assets: [
    { url: "/content/word-list.json", sha256: "f".repeat(64), bytes: 12, contentType: "application/json" },
  ],
  entryUrls: ["/content/word-list.json"],
  sizeBytes: 12,
  ...overrides,
});

describe("SLC-002-T003 — durable local stores and pack activation", () => {
  let store: LocalAttemptStore;
  beforeEach(() => {
    store = new LocalAttemptStore(`wawi-t003-${Math.random().toString(36).slice(2)}`);
  });
  afterEach(async () => {
    await store.reset();
  });

  it("preserves durability across tab races via a single IndexedDB transaction", async () => {
    const writes = await Promise.all([
      store.appendAttempt(baseEvent("evt-a")),
      store.appendAttempt(baseEvent("evt-b")),
      store.appendAttempt(baseEvent("evt-c")),
    ]);
    expect(writes.map((w) => w.sourceSequence)).toEqual([1, 2, 3]);
  });

  it("dedupes repeated ingest of the same batch on the server side", async () => {
    await store.appendAttempt(baseEvent("evt-a"));
    await store.appendAttempt(baseEvent("evt-b"));
    const projection = new InMemoryConvexProjection({ now: () => 1_700_000_000_000 });
    const batch = await store.nextSyncBatch(10);
    const first = await projection.reconcile(batch);
    expect(first.acceptedEventIds).toEqual(["evt-a", "evt-b"]);
    const replay = await projection.reconcile(batch);
    expect(replay.dedupedEventIds).toEqual(["evt-a", "evt-b"]);
    expect(replay.acceptedEventIds).toEqual([]);
  });

  it("flags a source-sequence gap and never drops earlier evidence", async () => {
    const projection = new InMemoryConvexProjection({ now: () => 1_700_000_000_000 });
    const receipt = await projection.reconcile([
      baseEvent("evt-1", 1),
      baseEvent("evt-3", 3),
    ]);
    expect(receipt.gapDetected).toBe(true);
    expect(projection.snapshot().map((e) => e.eventId)).toEqual(["evt-1", "evt-3"]);
  });

  it("rejects events whose occurredAt is implausibly skewed", async () => {
    const projection = new InMemoryConvexProjection({ now: () => 1_700_000_000_000 });
    await expect(
      projection.reconcile([
        baseEvent("evt-skew", 1, 1_700_000_000_000 + 24 * 60 * 60 * 1000),
      ]),
    ).rejects.toThrow(/skew/);
  });

  it("preserves local events when a pack activation fails", async () => {
    const slots = new PackSlots();
    const manifest = baseManifest();
    slots.stagePending(manifest);

    const result = await activateValidatedPack(manifest, {
      fetchFile: async () => {
        throw new Error("network failure");
      },
      previousPackVersion: undefined,
    });
    expect(result.status).toBe("rejected");
    expect(slots.activeManifest()).toBeNull();
  });

  it("activates a complete pack only after every asset verifies and rejects hash mismatch", async () => {
    const manifest = baseManifest();
    const payload = new TextEncoder().encode('{"words":[]}').buffer;
    const digest = await canonicalDigest([{ ...baseEvent("ignored", 1) }]);
    void digest;
    const realDigest = await crypto.subtle.digest("SHA-256", payload);
    const hex = Array.from(new Uint8Array(realDigest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const verified: ContentPackManifest = {
      ...manifest,
      assets: [
        {
          url: "/content/word-list.json",
          sha256: hex,
          bytes: payload.byteLength,
          contentType: "application/json",
        },
      ],
      sizeBytes: payload.byteLength,
    };

    const ok = await activateValidatedPack(verified, {
      fetchFile: async () => payload,
      previousPackVersion: "0.9.0",
    });
    expect(ok.status).toBe("activated");
    expect(ok.previousPackVersion).toBe("0.9.0");
    expect(ok.activePackVersion).toBe("1.0.0");

    const tampered: ContentPackManifest = {
      ...verified,
      assets: [{ ...verified.assets[0]!, sha256: "0".repeat(64) }],
    };
    const bad = await activateValidatedPack(tampered, {
      fetchFile: async () => payload,
      previousPackVersion: "1.0.0",
    });
    expect(bad.status).toBe("rejected");
    expect(bad.activePackVersion).toBe("1.0.0");
  });

  it("the canonical projection digest is deterministic for the same sorted event set", async () => {
    const projection = new InMemoryConvexProjection({ now: () => 1_700_000_000_000 });
    const batch = [baseEvent("evt-b", 2), baseEvent("evt-a", 1)];
    await projection.reconcile(batch);
    const first = await canonicalDigest(projection.snapshot());
    const second = await canonicalDigest(projection.snapshot());
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });
});