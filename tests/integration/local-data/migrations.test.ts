import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { LocalAttemptStore, type AttemptEvent } from "../../../packages/local-data/src/index";

const event: AttemptEvent = {
  eventId: "migration-event-1",
  installationId: "migration-install-1",
  sourceSequence: 0,
  occurredAt: 1_700_000_000_000,
  recordedAt: 1_700_000_000_000,
  dimension: "phonics",
  itemId: "gpc-cat",
  result: "correct",
  hintCount: 0,
  durationMs: 1_000,
  clientVersion: "0.1.0",
};

describe("SLC-002-T003 — local-data restart compatibility", () => {
  const database = `wawi-migration-${Math.random().toString(36).slice(2)}`;

  afterEach(async () => {
    await new LocalAttemptStore(database).reset();
  });

  it("preserves attempts and the unacknowledged outbox across a reopened store", async () => {
    const first = new LocalAttemptStore(database);
    await first.appendAttempt(event);

    const reopened = new LocalAttemptStore(database);
    expect((await reopened.readAllAttempts()).map((item) => item.eventId)).toEqual([
      "migration-event-1",
    ]);
    expect((await reopened.nextSyncBatch(10)).map((item) => item.eventId)).toEqual([
      "migration-event-1",
    ]);
  });
});
