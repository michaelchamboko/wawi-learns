import { describe, expect, it, vi } from "vitest";
import {
  commitActivityAttemptThenAdvance,
  cancelActivityAttempt,
  startSession,
} from "../../../packages/learning-engine/src/session";
import type { AttemptEvent } from "../../../packages/local-data/src";
import type { MvpActivity } from "../../../packages/ui/src/mvp-session";

const activity = (kind: MvpActivity["kind"], dimension: AttemptEvent["dimension"]): MvpActivity => ({
  id: `${kind}-cat`,
  kind,
  word: "cat",
  itemId: `w-${kind}`,
  image: "/content/mvp/images/cat.svg",
  prompt: "Try cat.",
  dimension,
});

const deps = (events: AttemptEvent[]) => ({
  appendAttempt: vi.fn(async (event: AttemptEvent) => {
    events.push(event);
    return { sourceSequence: events.length };
  }),
  now: () => 1_700_000_000_999,
});

describe("SLC-005-T005 — multimodal attempt evidence", () => {
  it("records speech evidence only as the activity's speech dimension", async () => {
    const events: AttemptEvent[] = [];
    const a = activity("say-word", "speech");
    const state = startSession("child-1", "web-1", "0.1.0", {
      itemId: a.itemId,
      dimension: a.dimension,
      modality: a.kind,
    });

    const out = await commitActivityAttemptThenAdvance(
      state,
      a,
      { eventId: "ev-speech", result: "partial", hintCount: 0, durationMs: 700, occurredAt: 1_700_000_000_000 },
      deps(events),
    );

    expect(out.advance).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ dimension: "speech", itemId: "w-say-word", result: "partial" });
    expect(events[0].dimension).not.toBe("phonics");
  });

  it("records handwriting evidence only as tracing and spelling evidence only as spelling", async () => {
    const events: AttemptEvent[] = [];
    const tracing = activity("trace", "tracing");
    const spelling = activity("spell", "spelling");

    await commitActivityAttemptThenAdvance(
      startSession("child-1", "web-1", "0.1.0", { itemId: tracing.itemId, dimension: tracing.dimension, modality: tracing.kind }),
      tracing,
      { eventId: "ev-trace", result: "correct", hintCount: 1, durationMs: 1200, occurredAt: 1 },
      deps(events),
    );
    await commitActivityAttemptThenAdvance(
      startSession("child-1", "web-1", "0.1.0", { itemId: spelling.itemId, dimension: spelling.dimension, modality: spelling.kind }),
      spelling,
      { eventId: "ev-spell", result: "incorrect", hintCount: 0, durationMs: 900, occurredAt: 2 },
      deps(events),
    );

    expect(events.map((event) => event.dimension)).toEqual(["tracing", "spelling"]);
  });

  it("cancels without appending an AttemptEvent", () => {
    const a = activity("say-word", "speech");
    const state = startSession("child-1", "web-1", "0.1.0", { itemId: a.itemId, dimension: a.dimension, modality: a.kind });
    const out = cancelActivityAttempt(state, a, "microphone-denied");
    expect(out.advance).toBe(false);
    expect(out.nextState.phase).toBe("playing");
    expect(out.nextState.lastError).toBe("cancelled:microphone-denied");
  });
});
