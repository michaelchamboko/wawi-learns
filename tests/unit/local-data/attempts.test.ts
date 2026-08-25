import { describe, expect, it } from "vitest";

import {
  canonicalDigest,
  type AttemptEvent,
} from "../../../packages/spike-local-data/test/index.js";

const makeEvent = ({ eventId, sourceSequence, ...overrides }: Partial<AttemptEvent> & Pick<AttemptEvent, "eventId" | "sourceSequence">): AttemptEvent => ({
  eventId,
  installationId: "install-spike-1",
  sourceSequence,
  occurredAt: 1_700_000_000_000,
  recordedAt: 1_700_000_000_000,
  dimension: "phonics",
  itemId: "gpc-cat",
  result: "correct",
  hintCount: 0,
  durationMs: 1_500,
  clientVersion: "0.1.0-spike",
  ...overrides,
});

describe("SLC-001-T003 — local attempt digest", () => {
  it("is deterministic and independent of event order", async () => {
    const first = makeEvent({ eventId: "evt-1", sourceSequence: 1 });
    const second = makeEvent({ eventId: "evt-2", sourceSequence: 2 });

    const digest = await canonicalDigest([first, second]);
    expect(await canonicalDigest([second, first])).toBe(digest);
    expect(await canonicalDigest([first, second])).toBe(digest);
  });

  it("changes when an attempt field changes", async () => {
    const event = makeEvent({ eventId: "evt-1", sourceSequence: 1 });

    expect(await canonicalDigest([event])).not.toBe(
      await canonicalDigest([{ ...event, hintCount: 1 }]),
    );
  });
});
