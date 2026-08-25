import { describe, expect, it } from "vitest";
import { ingestAttempts } from "../../../convex/attempts";

const event = (eventId: string, sourceSequence: number) => ({
  eventId,
  installationId: "install-sync-1",
  sourceSequence,
  occurredAt: 1_700_000_000_000,
  recordedAt: 1_700_000_000_000,
  dimension: "phonics",
  itemId: "gpc-cat",
  result: "correct",
  hintCount: 0,
  durationMs: 1_000,
  clientVersion: "0.1.0",
});

const createContext = () => {
  const attempts: Array<Record<string, unknown>> = [];
  const context = {
    auth: { getUserIdentity: async () => ({ subject: "user-1", email: "parent@example.com" }) },
    db: {
      query: (table: string) => ({
        collect: async () => table === "parents"
          ? [{ _id: "parent-1", userId: "user-1", verifiedAt: 1_700_000_000_000 }]
          : table === "attempts" ? attempts : [],
        withIndex: (_index: string, callback: (query: { eq: (field: string, value: string) => void }) => void) => {
          let field = "";
          let value = "";
          callback({ eq: (nextField, nextValue) => { field = nextField; value = nextValue; } });
          const rows = table === "installations"
            ? [{ parentId: "parent-1", installationId: "install-sync-1" }]
            : attempts.filter((row) => row[field] === value);
          return {
            unique: async () => rows[0] ?? null,
            collect: async () => rows,
          };
        },
      }),
      insert: async (_table: string, value: Record<string, unknown>) => {
        attempts.push(value);
        return `attempt-${attempts.length}`;
      },
    },
  };
  return { context, attempts };
};

describe("SLC-002-T003 — Convex attempt reconciliation", () => {
  const handler = (ingestAttempts as unknown as {
    _handler: (context: unknown, args: { events: readonly unknown[] }) => Promise<{
      acceptedEventIds: string[];
      dedupedEventIds: string[];
      gapDetected: boolean;
    }>;
  })._handler;

  it("accepts the next event, dedupes replay, and flags a source gap", async () => {
    const { context } = createContext();
    const first = await handler(context, { events: [event("event-1", 1)] });
    expect(first).toMatchObject({ acceptedEventIds: ["event-1"], gapDetected: false });

    const replay = await handler(context, { events: [event("event-1", 1)] });
    expect(replay).toMatchObject({ acceptedEventIds: [], dedupedEventIds: ["event-1"] });

    const gap = await handler(context, { events: [event("event-3", 3)] });
    expect(gap).toMatchObject({ acceptedEventIds: [], gapDetected: true });
  });
});
